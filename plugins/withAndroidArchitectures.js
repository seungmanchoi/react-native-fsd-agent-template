const { withGradleProperties } = require('expo/config-plugins');

/**
 * 출시 빌드의 CPU 종류를 휴대폰 둘(arm64-v8a·armeabi-v7a)로 줄인다.
 *
 * 기본값은 에뮬레이터용 x86·x86_64 까지 넷이라, 새 아키텍처의 C++(React Native·reanimated·Expo 모듈)을
 * 네 번 컴파일한다 — Android 출시 빌드가 iOS 보다 한참 오래 걸리고 로컬 빌드 때 메모리를 많이 쓰는 원인이다.
 * 실제 휴대폰은 영향이 없다. 에뮬레이터 개발 빌드(`expo run:android`)는 연결된 기기 종류를
 * `-PreactNativeArchitectures` 로 따로 넘기므로 그대로 된다.
 * `android/` 는 prebuild 산출물이라 gradle.properties 를 손으로 고치면 다음 prebuild 에 사라진다 — 그래서 플러그인이다.
 */
const ARCHS = 'arm64-v8a,armeabi-v7a';

module.exports = function withAndroidArchitectures(config, archs = ARCHS) {
  return withGradleProperties(config, (cfg) => {
    cfg.modResults = cfg.modResults.filter(
      (item) => !(item.type === 'property' && item.key === 'reactNativeArchitectures'),
    );
    cfg.modResults.push({ type: 'property', key: 'reactNativeArchitectures', value: archs });
    return cfg;
  });
};
