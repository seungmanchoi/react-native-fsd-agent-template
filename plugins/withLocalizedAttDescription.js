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
  en: "MyApp uses your device's advertising identifier to make the ads shown in this app more relevant — for example, showing ads for apps and games similar to MyApp instead of unrelated products — and to measure how many people install an app after seeing its ad. Ads still appear if you decline; they just won't be personalized.",
  ko: '이 앱은 기기의 광고 식별자를 사용해 표시되는 광고를 더 관련성 있게 만듭니다. 예를 들어 관련 없는 상품 대신 MyApp 앱과 비슷한 앱·게임 광고를 보여주고, 광고를 본 뒤 앱을 설치한 사용자 수를 측정합니다. 허용하지 않아도 광고는 계속 표시되며, 맞춤 광고가 아닐 뿐입니다.',
  ja: 'MyAppは、端末の広告識別子を使用して、このアプリに表示される広告をより関連性の高いものにします。たとえば、無関係な商品ではなくMyAppに似たアプリやゲームの広告を表示したり、広告を見た後にアプリをインストールした人数を測定したりします。許可しない場合も広告は表示されますが、パーソナライズされません。',
  'zh-Hans': 'MyApp 使用您设备的广告标识符，让本应用中显示的广告更相关——例如展示与 MyApp 类似的应用和游戏，而不是无关的商品——并用于统计有多少人在看到广告后安装了应用。拒绝后仍会显示广告，只是不会个性化。',
  'zh-Hant': 'MyApp 使用您裝置的廣告識別碼，讓本 App 中顯示的廣告更相關——例如顯示與 MyApp 類似的 App 和遊戲，而非無關的商品——並用於統計有多少人在看到廣告後安裝 App。拒絕後仍會顯示廣告，只是不會個人化。',
  es: 'MyApp usa el identificador de publicidad de tu dispositivo para que los anuncios que ves en la app sean más relevantes —por ejemplo, mostrando anuncios de apps y juegos similares a MyApp en lugar de productos sin relación— y para medir cuántas personas instalan una app tras ver su anuncio. Si lo rechazas seguirás viendo anuncios, solo que no personalizados.',
  'es-ES': 'MyApp usa el identificador de publicidad de tu dispositivo para que los anuncios que ves en la app sean más relevantes —por ejemplo, mostrando anuncios de apps y juegos similares a MyApp en lugar de productos sin relación— y para medir cuántas personas instalan una app tras ver su anuncio. Si lo rechazas seguirás viendo anuncios, solo que no personalizados.',
  fr: "MyApp utilise l'identifiant publicitaire de votre appareil pour rendre les publicités affichées dans l'app plus pertinentes — par exemple en montrant des apps et des jeux similaires à MyApp plutôt que des produits sans rapport — et pour mesurer combien de personnes installent une app après avoir vu sa publicité. Les publicités restent affichées si vous refusez, elles ne seront simplement pas personnalisées.",
  de: 'MyApp verwendet die Werbe-ID Ihres Geräts, um die in dieser App gezeigte Werbung relevanter zu machen – etwa indem Apps und Spiele ähnlich wie MyApp statt unpassender Produkte angezeigt werden – und um zu messen, wie viele Personen eine App nach dem Sehen ihrer Werbung installieren. Werbung erscheint auch bei Ablehnung, sie ist dann nur nicht personalisiert.',
  it: "MyApp usa l'identificatore pubblicitario del tuo dispositivo per rendere più pertinenti gli annunci mostrati nell'app — ad esempio mostrando app e giochi simili a MyApp invece di prodotti non correlati — e per misurare quante persone installano un'app dopo averne visto l'annuncio. Gli annunci compaiono anche se rifiuti, semplicemente non saranno personalizzati.",
  pt: 'O MyApp usa o identificador de publicidade do seu dispositivo para tornar os anúncios exibidos no app mais relevantes — por exemplo, mostrando apps e jogos parecidos com o MyApp em vez de produtos sem relação — e para medir quantas pessoas instalam um app depois de ver seu anúncio. Os anúncios continuam aparecendo se você recusar, apenas não serão personalizados.',
  'pt-BR': 'O MyApp usa o identificador de publicidade do seu dispositivo para tornar os anúncios exibidos no app mais relevantes — por exemplo, mostrando apps e jogos parecidos com o MyApp em vez de produtos sem relação — e para medir quantas pessoas instalam um app depois de ver seu anúncio. Os anúncios continuam aparecendo se você recusar, apenas não serão personalizados.',
  ru: 'MyApp использует рекламный идентификатор вашего устройства, чтобы реклама в приложении была более подходящей — например, показывать приложения и игры, похожие на MyApp, вместо несвязанных товаров — и чтобы измерять, сколько людей устанавливают приложение после просмотра его рекламы. Реклама показывается и при отказе, но не будет персонализированной.',
  tr: 'MyApp, cihazınızın reklam tanımlayıcısını kullanarak uygulamada gösterilen reklamları daha alakalı hale getirir — örneğin alakasız ürünler yerine MyApp benzeri uygulama ve oyunları gösterir — ve bir reklamı gördükten sonra kaç kişinin uygulamayı yüklediğini ölçer. Reddederseniz reklamlar yine görünür, yalnızca kişiselleştirilmez.',
  th: 'MyApp ใช้ตัวระบุโฆษณาของอุปกรณ์ของคุณเพื่อทำให้โฆษณาที่แสดงในแอปนี้เกี่ยวข้องกับคุณมากขึ้น เช่น แสดงแอปและเกมที่คล้ายกับ MyApp แทนสินค้าที่ไม่เกี่ยวข้อง และเพื่อวัดว่ามีคนติดตั้งแอปหลังจากเห็นโฆษณากี่คน หากคุณปฏิเสธ โฆษณาจะยังคงแสดงอยู่ เพียงแต่จะไม่ปรับให้เหมาะกับคุณ',
  vi: 'MyApp sử dụng mã định danh quảng cáo của thiết bị để quảng cáo hiển thị trong ứng dụng phù hợp hơn với bạn — ví dụ: hiển thị các ứng dụng và trò chơi tương tự MyApp thay vì sản phẩm không liên quan — và để đo lường có bao nhiêu người cài đặt ứng dụng sau khi xem quảng cáo. Nếu từ chối, bạn vẫn thấy quảng cáo, chỉ là không được cá nhân hóa.',
  id: 'MyApp menggunakan pengidentifikasi iklan perangkat Anda agar iklan yang tampil di aplikasi ini lebih relevan — misalnya menampilkan aplikasi dan game serupa MyApp alih-alih produk yang tidak terkait — dan untuk mengukur berapa banyak orang yang memasang aplikasi setelah melihat iklannya. Iklan tetap muncul jika Anda menolak, hanya saja tidak dipersonalisasi.',
  ms: 'MyApp menggunakan pengecam pengiklanan peranti anda supaya iklan yang dipaparkan dalam apl ini lebih relevan — contohnya memaparkan apl dan permainan seperti MyApp dan bukannya produk yang tidak berkaitan — dan untuk mengukur berapa ramai orang memasang apl selepas melihat iklannya. Iklan tetap dipaparkan jika anda menolak, cuma tidak diperibadikan.',
  hi: 'MyApp आपके डिवाइस के विज्ञापन पहचानकर्ता का उपयोग इस ऐप में दिखने वाले विज्ञापनों को अधिक प्रासंगिक बनाने के लिए करता है — उदाहरण के लिए, असंबंधित उत्पादों के बजाय MyApp जैसे ऐप और गेम दिखाना — और यह मापने के लिए कि विज्ञापन देखने के बाद कितने लोग ऐप इंस्टॉल करते हैं। मना करने पर भी विज्ञापन दिखेंगे, बस वे वैयक्तिकृत नहीं होंगे।',
  ar: 'يستخدم MyApp معرّف الإعلانات في جهازك لجعل الإعلانات المعروضة في التطبيق أكثر صلة بك — على سبيل المثال عرض تطبيقات وألعاب مشابهة لـ MyApp بدلاً من منتجات غير ذات صلة — ولقياس عدد الأشخاص الذين يثبّتون تطبيقًا بعد مشاهدة إعلانه. ستظل الإعلانات تظهر إذا رفضت، لكنها لن تكون مخصصة.',
  nl: 'MyApp gebruikt de advertentie-identificatie van je apparaat om de advertenties in deze app relevanter te maken — bijvoorbeeld door apps en games te tonen die lijken op MyApp in plaats van niet-gerelateerde producten — en om te meten hoeveel mensen een app installeren na het zien van de advertentie. Je ziet nog steeds advertenties als je weigert, alleen niet gepersonaliseerd.',
  pl: 'MyApp używa identyfikatora reklamowego Twojego urządzenia, aby reklamy wyświetlane w aplikacji były trafniejsze — na przykład pokazując aplikacje i gry podobne do MyApp zamiast niepowiązanych produktów — oraz aby mierzyć, ile osób instaluje aplikację po obejrzeniu jej reklamy. Reklamy nadal się pojawią, jeśli odmówisz, po prostu nie będą spersonalizowane.',
  sv: 'MyApp använder enhetens annons-ID för att göra annonserna i appen mer relevanta – till exempel genom att visa appar och spel som liknar MyApp i stället för orelaterade produkter – och för att mäta hur många som installerar en app efter att ha sett annonsen. Du ser fortfarande annonser om du nekar, de blir bara inte personanpassade.',
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

  // app.config.ts 가 Expo 의 `locales` 를 쓰면 Expo 가 ios/<Project>/Supporting/
  // <lang>.lproj/InfoPlist.strings 를 만들어 variant group 에 등록한다. 여기서 또
  // 등록하면 결과 경로가 같아 "Multiple commands produce ... InfoPlist.strings" 로
  // 빌드가 깨진다 → 비켜서고, ATT 문구는 각 locale JSON 에 직접 넣는다.
  if (config.locales && Object.keys(config.locales).length > 0) {
    return config;
  }

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
