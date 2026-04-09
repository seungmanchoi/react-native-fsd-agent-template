/**
 * Expo Config Plugin: Localized App Name
 *
 * iOS: Generates InfoPlist.strings with CFBundleDisplayName per language
 *      AND registers them in the Xcode project as variant group resources
 * Android: Generates strings.xml with app_name per language in values-{locale}/
 */

const {
  withXcodeProject,
  withDangerousMod,
  IOSConfig,
} = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// iOS locale code mapping
const IOS_LOCALE_MAP = {
  en: 'en',
  ko: 'ko',
  ja: 'ja',
  'zh-Hans': 'zh-Hans',
  zh: 'zh-Hans',
  es: 'es',
  pt: 'pt-BR',
  'pt-BR': 'pt-BR',
  fr: 'fr',
  de: 'de',
  it: 'it',
  ru: 'ru',
  tr: 'tr',
  th: 'th',
  vi: 'vi',
  id: 'id',
  ms: 'ms',
  hi: 'hi',
  ar: 'ar',
  nl: 'nl',
  pl: 'pl',
  sv: 'sv',
};

// Android locale code mapping
const ANDROID_LOCALE_MAP = {
  en: '',
  ko: 'ko',
  ja: 'ja',
  'zh-Hans': 'zh-rCN',
  zh: 'zh-rCN',
  es: 'es',
  pt: 'pt-rBR',
  'pt-BR': 'pt-rBR',
  fr: 'fr',
  de: 'de',
  it: 'it',
  ru: 'ru',
  tr: 'tr',
  th: 'th',
  vi: 'vi',
  id: 'in',
  ms: 'ms',
  hi: 'hi',
  ar: 'ar',
  nl: 'nl',
  pl: 'pl',
  sv: 'sv',
};

function withLocalizedAppNameIOS(config, localizedNames) {
  // Step 1: Write InfoPlist.strings files
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const projectName = IOSConfig.XcodeUtils.getProjectName(projectRoot);
      const iosDir = path.join(projectRoot, 'ios', projectName);

      for (const [locale, name] of Object.entries(localizedNames)) {
        const iosLocale = IOS_LOCALE_MAP[locale] || locale;
        const lprojDir = path.join(iosDir, `${iosLocale}.lproj`);

        if (!fs.existsSync(lprojDir)) {
          fs.mkdirSync(lprojDir, { recursive: true });
        }

        const content = `"CFBundleDisplayName" = "${name}";\n"CFBundleName" = "${name}";\n`;
        fs.writeFileSync(
          path.join(lprojDir, 'InfoPlist.strings'),
          content,
          'utf-8'
        );
      }

      return config;
    },
  ]);

  // Step 2: Register InfoPlist.strings as variant group in Xcode project
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectName = IOSConfig.XcodeUtils.getProjectName(
      config.modRequest.projectRoot
    );

    // Collect all locale codes
    const locales = Object.entries(localizedNames).map(
      ([locale]) => IOS_LOCALE_MAP[locale] || locale
    );

    // Add known regions
    try {
      const pbxProject = project.getFirstProject();
      if (pbxProject && pbxProject.firstProject) {
        const knownRegions = pbxProject.firstProject.knownRegions || ['en', 'Base'];
        for (const locale of locales) {
          if (!knownRegions.includes(locale)) {
            knownRegions.push(locale);
          }
        }
        pbxProject.firstProject.knownRegions = knownRegions;
      }
    } catch {
      // Ignore
    }

    // Create variant group for InfoPlist.strings and add to Resources build phase
    try {
      // Check if variant group already exists
      const variantGroups = project.hash.project.objects['PBXVariantGroup'] || {};
      let existingGroupKey = null;

      for (const [key, value] of Object.entries(variantGroups)) {
        if (typeof value === 'object' && value.name === 'InfoPlist.strings') {
          existingGroupKey = key;
          break;
        }
      }

      if (!existingGroupKey) {
        // Create variant group with all locale files
        const variantGroupChildren = [];

        for (const locale of locales) {
          const fileRefUuid = project.generateUuid();
          const filePath = `${locale}.lproj/InfoPlist.strings`;

          // Add file reference
          project.hash.project.objects['PBXFileReference'] =
            project.hash.project.objects['PBXFileReference'] || {};
          project.hash.project.objects['PBXFileReference'][fileRefUuid] = {
            isa: 'PBXFileReference',
            lastKnownFileType: 'text.plist.strings',
            name: locale,
            path: filePath,
            sourceTree: '"<group>"',
          };
          project.hash.project.objects['PBXFileReference'][`${fileRefUuid}_comment`] = locale;

          variantGroupChildren.push({
            value: fileRefUuid,
            comment: locale,
          });
        }

        // Create variant group
        const variantGroupUuid = project.generateUuid();
        project.hash.project.objects['PBXVariantGroup'] =
          project.hash.project.objects['PBXVariantGroup'] || {};
        project.hash.project.objects['PBXVariantGroup'][variantGroupUuid] = {
          isa: 'PBXVariantGroup',
          children: variantGroupChildren,
          name: 'InfoPlist.strings',
          sourceTree: '"<group>"',
        };
        project.hash.project.objects['PBXVariantGroup'][`${variantGroupUuid}_comment`] =
          'InfoPlist.strings';

        // Add variant group to main group
        const mainGroupKey = project.getFirstProject().firstProject.mainGroup;
        const mainGroup = project.hash.project.objects['PBXGroup'][mainGroupKey];
        if (mainGroup && mainGroup.children) {
          // Find the project name group
          for (const child of mainGroup.children) {
            const childGroup =
              project.hash.project.objects['PBXGroup'][child.value];
            if (childGroup && childGroup.name === projectName) {
              childGroup.children.push({
                value: variantGroupUuid,
                comment: 'InfoPlist.strings',
              });
              break;
            }
            // Also check path-based groups
            if (childGroup && childGroup.path === projectName) {
              childGroup.children.push({
                value: variantGroupUuid,
                comment: 'InfoPlist.strings',
              });
              break;
            }
          }
        }

        // Add to Resources build phase
        const buildPhases = project.hash.project.objects['PBXResourcesBuildPhase'] || {};
        for (const [, phase] of Object.entries(buildPhases)) {
          if (typeof phase === 'object' && phase.files) {
            const buildFileUuid = project.generateUuid();
            project.hash.project.objects['PBXBuildFile'] =
              project.hash.project.objects['PBXBuildFile'] || {};
            project.hash.project.objects['PBXBuildFile'][buildFileUuid] = {
              isa: 'PBXBuildFile',
              fileRef: variantGroupUuid,
              fileRef_comment: 'InfoPlist.strings',
            };
            project.hash.project.objects['PBXBuildFile'][`${buildFileUuid}_comment`] =
              'InfoPlist.strings in Resources';

            phase.files.push({
              value: buildFileUuid,
              comment: 'InfoPlist.strings in Resources',
            });
            break; // Only add to first Resources phase
          }
        }
      }
    } catch (e) {
      console.warn('withLocalizedAppName: Failed to add variant group:', e.message);
    }

    return config;
  });

  return config;
}

function withLocalizedAppNameAndroid(config, localizedNames) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const resDir = path.join(
        projectRoot, 'android', 'app', 'src', 'main', 'res'
      );

      for (const [locale, name] of Object.entries(localizedNames)) {
        const androidLocale = ANDROID_LOCALE_MAP[locale];
        if (androidLocale === undefined) continue;

        const valuesDir =
          androidLocale === ''
            ? path.join(resDir, 'values')
            : path.join(resDir, `values-${androidLocale}`);

        if (!fs.existsSync(valuesDir)) {
          fs.mkdirSync(valuesDir, { recursive: true });
        }

        const stringsPath = path.join(valuesDir, 'strings.xml');

        if (fs.existsSync(stringsPath)) {
          let content = fs.readFileSync(stringsPath, 'utf-8');
          if (content.includes('name="app_name"')) {
            content = content.replace(
              /<string name="app_name">[^<]*<\/string>/,
              `<string name="app_name">${escapeXml(name)}</string>`
            );
          } else {
            content = content.replace(
              '</resources>',
              `    <string name="app_name">${escapeXml(name)}</string>\n</resources>`
            );
          }
          fs.writeFileSync(stringsPath, content, 'utf-8');
        } else {
          const content = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="app_name">${escapeXml(name)}</string>\n</resources>\n`;
          fs.writeFileSync(stringsPath, content, 'utf-8');
        }
      }

      return config;
    },
  ]);
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'");
}

function withLocalizedAppName(config, localizedNames) {
  config = withLocalizedAppNameIOS(config, localizedNames);
  config = withLocalizedAppNameAndroid(config, localizedNames);
  return config;
}

module.exports = withLocalizedAppName;
