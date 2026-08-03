/**
 * Expo Config Plugin: Localized ATT (App Tracking Transparency) Description
 *
 * iOS only — appends NSUserTrackingUsageDescription per language to existing
 * InfoPlist.strings files (created by withLocalizedAppName) or creates them.
 * Apple displays the localized string matching the device locale during the
 * ATT prompt; the app.config.ts `infoPlist.NSUserTrackingUsageDescription`
 * value remains the fallback for unsupported locales.
 *
 * Usage in app.config.ts:
 *   // Use built-in 4-language defaults (en/ko/ja/zh-Hans)
 *   plugins: [['./plugins/withLocalizedAttDescription']]
 *
 *   // Or override / extend:
 *   plugins: [
 *     ['./plugins/withLocalizedAttDescription', {
 *       en: 'Custom English message.',
 *       de: 'Deutsche Nachricht.',
 *     }],
 *   ]
 *
 * Notes:
 *   - This plugin should be ordered AFTER withLocalizedAppName so the
 *     .lproj directories already exist. It also tolerates missing files.
 *   - Android does not require ATT; this plugin is a no-op there.
 *   - Plugin DOES NOT modify Xcode project (variant group). It relies on
 *     withLocalizedAppName having already registered InfoPlist.strings as a
 *     resource. If you don't use withLocalizedAppName, ATT localization
 *     will only work for English (the app.config.ts fallback).
 */

const { withXcodeProject } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Default ATT messages — generic enough to use across all apps with AdMob
const DEFAULT_ATT_DESCRIPTIONS = {
  en: 'This identifier will be used to deliver personalized ads to you.',
  ko: '이 식별자는 맞춤형 광고를 제공하는 데 사용됩니다.',
  ja: 'この識別子は、お客様にパーソナライズされた広告を配信するために使用されます。',
  'zh-Hans': '此标识符将用于向您投放个性化广告。',
  'zh-Hant': '此識別碼將用於向您投放個人化廣告。',
  es: 'Este identificador se usará para mostrarte anuncios personalizados.',
  'es-ES': 'Este identificador se usará para mostrarte anuncios personalizados.',
  fr: 'Cet identifiant servira à vous proposer des publicités personnalisées.',
  de: 'Diese Kennung wird verwendet, um Ihnen personalisierte Werbung anzuzeigen.',
  it: 'Questo identificatore verrà usato per offrirti annunci personalizzati.',
  pt: 'Este identificador será usado para entregar anúncios personalizados a você.',
  'pt-BR': 'Este identificador será usado para entregar anúncios personalizados a você.',
  ru: 'Этот идентификатор будет использоваться для показа персонализированной рекламы.',
  tr: 'Bu tanımlayıcı, size kişiselleştirilmiş reklamlar sunmak için kullanılacaktır.',
  th: 'ตัวระบุนี้จะถูกใช้เพื่อแสดงโฆษณาที่ปรับให้เหมาะกับคุณ',
  vi: 'Mã định danh này sẽ được dùng để hiển thị quảng cáo phù hợp với bạn.',
  id: 'Pengidentifikasi ini akan digunakan untuk menayangkan iklan yang dipersonalisasi.',
  ms: 'Pengecam ini akan digunakan untuk menyampaikan iklan diperibadikan kepada anda.',
  hi: 'इस पहचानकर्ता का उपयोग आपको व्यक्तिगत विज्ञापन दिखाने के लिए किया जाएगा।',
  ar: 'سيُستخدم هذا المعرّف لعرض إعلانات مخصصة لك.',
  nl: 'Deze identifier wordt gebruikt om u gepersonaliseerde advertenties te tonen.',
  pl: 'Ten identyfikator będzie używany do wyświetlania spersonalizowanych reklam.',
  sv: 'Den här identifieraren används för att visa anpassade annonser.',
};

const IOS_LOCALE_MAP = {
  en: 'en',
  ko: 'ko',
  ja: 'ja',
  'zh-Hans': 'zh-Hans',
  zh: 'zh-Hans',
  'zh-Hant': 'zh-Hant',
  es: 'es',
  'es-ES': 'es',
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

function escapeStrings(str) {
  // Escape for .strings file format: backslash, double-quote, newline
  return String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function withLocalizedAttDescription(config, overrides) {
  const descriptions = Object.assign({}, DEFAULT_ATT_DESCRIPTIONS, overrides || {});

  // xcodeproj mod 는 dangerous mod 가 모두 끝난 뒤 실행된다. withLocalizedAppName 은
  // dangerous mod 에서 InfoPlist.strings 를 통째로 덮어쓰므로, 여기서 써야 문구가
  // 살아남는다(plugins 배열 순서와 무관). 이어서 만들어진 .lproj 를 전부 Xcode 에
  // 등록한다 — AppName 은 "앱 이름을 선언한 언어"만 등록해 나머지는 번들에서 누락된다.
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const projectName = cfg.modRequest.projectName;
    const iosDir = path.join(cfg.modRequest.platformProjectRoot, projectName);
    if (!fs.existsSync(iosDir)) return cfg;

    for (const [locale, description] of Object.entries(descriptions)) {
      const iosLocale = IOS_LOCALE_MAP[locale] || locale;
      const lprojDir = path.join(iosDir, `${iosLocale}.lproj`);

      if (!fs.existsSync(lprojDir)) {
        fs.mkdirSync(lprojDir, { recursive: true });
      }

      const stringsPath = path.join(lprojDir, 'InfoPlist.strings');
      const line = `"NSUserTrackingUsageDescription" = "${escapeStrings(description)}";\n`;

      if (fs.existsSync(stringsPath)) {
        let content = fs.readFileSync(stringsPath, 'utf-8');
        if (/"NSUserTrackingUsageDescription"\s*=/.test(content)) {
          content = content.replace(
            /"NSUserTrackingUsageDescription"\s*=\s*"[^"]*";\n?/,
            line,
          );
        } else {
          if (!content.endsWith('\n')) content += '\n';
          content += line;
        }
        fs.writeFileSync(stringsPath, content, 'utf-8');
      } else {
        fs.writeFileSync(stringsPath, line, 'utf-8');
      }
    }

    const locales = fs
      .readdirSync(iosDir)
      .filter(
        (d) =>
          d.endsWith('.lproj') &&
          fs.existsSync(path.join(iosDir, d, 'InfoPlist.strings')),
      )
      .map((d) => d.replace(/\.lproj$/, ''));
    if (locales.length === 0) return cfg;

    const objects = project.hash.project.objects;
    const firstProject = project.getFirstProject().firstProject;

    const knownRegions = firstProject.knownRegions || [];
    for (const locale of locales) {
      if (!knownRegions.includes(locale)) knownRegions.push(locale);
    }
    firstProject.knownRegions = knownRegions;

    objects['PBXVariantGroup'] = objects['PBXVariantGroup'] || {};
    objects['PBXFileReference'] = objects['PBXFileReference'] || {};

    let groupKey = Object.keys(objects['PBXVariantGroup']).find(
      (k) =>
        !k.endsWith('_comment') &&
        objects['PBXVariantGroup'][k] &&
        objects['PBXVariantGroup'][k].name === 'InfoPlist.strings',
    );
    const created = !groupKey;

    if (created) {
      groupKey = project.generateUuid();
      objects['PBXVariantGroup'][groupKey] = {
        isa: 'PBXVariantGroup',
        children: [],
        name: 'InfoPlist.strings',
        sourceTree: '"<group>"',
      };
      objects['PBXVariantGroup'][`${groupKey}_comment`] = 'InfoPlist.strings';
    }

    const group = objects['PBXVariantGroup'][groupKey];
    group.children = group.children || [];
    const registered = new Set(
      group.children
        .map((c) => objects['PBXFileReference'][c.value])
        .filter(Boolean)
        .map((ref) => ref.name),
    );

    for (const locale of locales) {
      if (registered.has(locale)) continue;
      const fileRefKey = project.generateUuid();
      objects['PBXFileReference'][fileRefKey] = {
        isa: 'PBXFileReference',
        lastKnownFileType: 'text.plist.strings',
        name: locale,
        path: `${projectName}/${locale}.lproj/InfoPlist.strings`,
        sourceTree: '"<group>"',
      };
      objects['PBXFileReference'][`${fileRefKey}_comment`] =
        `${locale} — InfoPlist.strings`;
      group.children.push({
        value: fileRefKey,
        comment: `${locale} — InfoPlist.strings`,
      });
    }

    if (!created) return cfg;

    const mainGroup = (objects['PBXGroup'] || {})[firstProject.mainGroup];
    if (mainGroup && mainGroup.children) {
      mainGroup.children.push({ value: groupKey, comment: 'InfoPlist.strings' });
    }

    const buildFileKey = project.generateUuid();
    objects['PBXBuildFile'] = objects['PBXBuildFile'] || {};
    objects['PBXBuildFile'][buildFileKey] = {
      isa: 'PBXBuildFile',
      fileRef: groupKey,
      fileRef_comment: 'InfoPlist.strings',
    };
    objects['PBXBuildFile'][`${buildFileKey}_comment`] =
      'InfoPlist.strings in Resources';

    for (const target of Object.values(objects['PBXNativeTarget'] || {})) {
      if (!target || !target.buildPhases) continue;
      const phase = target.buildPhases.find(
        (p) => objects['PBXResourcesBuildPhase']?.[p.value],
      );
      if (!phase) continue;
      objects['PBXResourcesBuildPhase'][phase.value].files.push({
        value: buildFileKey,
        comment: 'InfoPlist.strings in Resources',
      });
      break;
    }

    return cfg;
  });
}

module.exports = withLocalizedAttDescription;
