/**
 * Expo Config Plugin: Localized App Name
 *
 * iOS: Generates InfoPlist.strings with CFBundleDisplayName per language
 * Android: Generates strings.xml with app_name per language in values-{locale}/
 *
 * Usage in app.config.ts:
 *   plugins: [
 *     ['./plugins/withLocalizedAppName', {
 *       // key: iOS locale code, value: display name
 *       en: 'Tint Camera - Season & Retro',
 *       ko: '감성필터 - 계절·레트로 카메라',
 *       ja: 'Tint Camera - 四季&レトロ',
 *       ...
 *     }],
 *   ]
 */

const {
  withXcodeProject,
  withDangerousMod,
  IOSConfig,
} = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// iOS locale code mapping (Expo/Apple locale → .lproj folder name)
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
  en: '', // default (values/)
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
  id: 'in', // Android uses 'in' for Indonesian
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

  // Step 2: Add .lproj folders to Xcode project resources
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;

    for (const [locale] of Object.entries(localizedNames)) {
      const iosLocale = IOS_LOCALE_MAP[locale] || locale;
      // Add known region to project
      try {
        const pbxProject = project.getFirstProject();
        if (pbxProject && pbxProject.firstProject) {
          const knownRegions =
            pbxProject.firstProject.knownRegions || [];
          if (!knownRegions.includes(iosLocale)) {
            knownRegions.push(iosLocale);
            pbxProject.firstProject.knownRegions = knownRegions;
          }
        }
      } catch {
        // Ignore errors in region manipulation
      }
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
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res'
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

        // Check if strings.xml already exists
        if (fs.existsSync(stringsPath)) {
          // Read existing and replace/add app_name
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
          // Create new strings.xml
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
