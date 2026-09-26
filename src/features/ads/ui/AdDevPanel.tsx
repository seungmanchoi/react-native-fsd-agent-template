import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { env, ADS_CONFIG } from '@/shared/config';
import { useAdStore } from '../store/ad.store';
import { usePremiumStore } from '../store/premium.store';

function formatMs(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}

function formatTimestamp(ts: number): string {
  if (ts <= 0) return 'never';
  return new Date(ts).toLocaleTimeString();
}

function DevButton({
  label,
  onPress,
  color = '#3b82f6',
}: {
  label: string;
  onPress: () => void;
  color?: string;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: color,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 4,
        marginRight: 6,
        marginBottom: 6,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}

function Row({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}): React.JSX.Element {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 2,
      }}
    >
      <Text style={{ color: '#9ca3af', fontSize: 11 }}>{label}</Text>
      <Text
        style={{
          color: warn ? '#f59e0b' : '#e5e7eb',
          fontSize: 11,
          fontWeight: '500',
        }}
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * Dev-only panel for QA testing ad timing.
 * Shows all ad state and provides manual controls.
 * Only renders in development mode.
 */
export function AdDevPanel(): React.JSX.Element | null {
  const [isExpanded, setIsExpanded] = useState(false);

  const adState = useAdStore();
  const premiumState = usePremiumStore();
  // Ticks once a second so countdowns stay live (render itself must stay pure).
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (env.IS_PROD) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (env.IS_PROD) return null;

  const timeSinceStart = now - adState.appStartTime;
  const timeSinceLastAd = adState.lastInterstitialTime > 0
    ? now - adState.lastInterstitialTime
    : -1;
  const premiumActive = premiumState.isPremiumActive();
  const premiumRemaining = premiumState.remainingTimeMs();
  const canShow = adState.canShowInterstitial();

  if (!isExpanded) {
    return (
      <Pressable
        onPress={() => setIsExpanded(true)}
        style={{
          position: 'absolute',
          bottom: 100,
          right: 8,
          backgroundColor: premiumActive ? '#059669' : '#1f2937',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#374151',
          zIndex: 9999,
        }}
      >
        <Text style={{ color: '#e5e7eb', fontSize: 10 }}>
          {premiumActive ? `P ${formatMs(premiumRemaining)}` : 'AD'}
        </Text>
      </Pressable>
    );
  }

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 60,
        left: 8,
        right: 8,
        backgroundColor: '#111827',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#374151',
        padding: 10,
        zIndex: 9999,
        maxHeight: 400,
      }}
    >
      <ScrollView>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <Text style={{ color: '#e5e7eb', fontSize: 12, fontWeight: '700' }}>
            Ad Dev Panel
          </Text>
          <Pressable onPress={() => setIsExpanded(false)}>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>Close</Text>
          </Pressable>
        </View>

        {/* Premium Section */}
        <Text
          style={{
            color: premiumActive ? '#34d399' : '#9ca3af',
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 4,
          }}
        >
          PREMIUM {premiumActive ? 'ACTIVE' : 'INACTIVE'}
        </Text>
        <Row
          label="Expiry"
          value={formatTimestamp(premiumState.premiumExpiryTime)}
        />
        <Row
          label="Remaining"
          value={formatMs(premiumRemaining)}
          warn={premiumActive && premiumRemaining < 60_000}
        />
        <Row
          label="Total rewards"
          value={String(premiumState.totalRewardsEarned)}
        />

        <View
          style={{
            height: 1,
            backgroundColor: '#374151',
            marginVertical: 6,
          }}
        />

        {/* Interstitial Section */}
        <Text
          style={{
            color: '#9ca3af',
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 4,
          }}
        >
          INTERSTITIAL
        </Text>
        <Row
          label="Actions"
          value={`${adState.actionCount} / ${ADS_CONFIG.INTERSTITIAL_INTERVAL}`}
        />
        <Row
          label="Today"
          value={`${adState.interstitialsToday} / ${ADS_CONFIG.MAX_INTERSTITIALS_PER_DAY}`}
          warn={adState.interstitialsToday >= ADS_CONFIG.MAX_INTERSTITIALS_PER_DAY}
        />
        <Row
          label="Cooldown"
          value={
            timeSinceLastAd < 0
              ? 'N/A'
              : timeSinceLastAd >= ADS_CONFIG.INTERSTITIAL_COOLDOWN_MS
                ? 'Ready'
                : formatMs(ADS_CONFIG.INTERSTITIAL_COOLDOWN_MS - timeSinceLastAd)
          }
        />
        <Row
          label="First ad delay"
          value={
            timeSinceStart >= ADS_CONFIG.FIRST_AD_DELAY_MS
              ? 'Passed'
              : formatMs(ADS_CONFIG.FIRST_AD_DELAY_MS - timeSinceStart)
          }
        />
        <Row
          label="Can show"
          value={canShow ? 'YES' : 'NO'}
          warn={!canShow}
        />
        <Row label="Reset date" value={adState.lastDailyResetDate} />

        <View
          style={{
            height: 1,
            backgroundColor: '#374151',
            marginVertical: 6,
          }}
        />

        {/* Hydration */}
        <Row
          label="Ad hydrated"
          value={adState.isHydrated ? 'YES' : 'NO'}
          warn={!adState.isHydrated}
        />
        <Row
          label="Premium hydrated"
          value={premiumState.isHydrated ? 'YES' : 'NO'}
          warn={!premiumState.isHydrated}
        />

        <View
          style={{
            height: 1,
            backgroundColor: '#374151',
            marginVertical: 6,
          }}
        />

        {/* Controls */}
        <Text
          style={{
            color: '#9ca3af',
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 6,
          }}
        >
          CONTROLS
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <DevButton
            label="Grant 1m Premium"
            onPress={() => premiumState.grantPremium(60_000)}
            color="#059669"
          />
          <DevButton
            label="Grant 30m Premium"
            onPress={() =>
              premiumState.grantPremium(ADS_CONFIG.REWARDED_PREMIUM_DURATION_MS)
            }
            color="#059669"
          />
          <DevButton
            label="Expire Premium"
            onPress={() => premiumState.expirePremium()}
            color="#dc2626"
          />
          <DevButton
            label="+1 Action"
            onPress={() => adState.incrementAction()}
          />
          <DevButton
            label={`+${ADS_CONFIG.INTERSTITIAL_INTERVAL} Actions`}
            onPress={() => {
              for (let i = 0; i < ADS_CONFIG.INTERSTITIAL_INTERVAL; i++) {
                adState.incrementAction();
              }
            }}
          />
          <DevButton
            label="Reset Daily"
            onPress={() => adState.resetDaily()}
            color="#f59e0b"
          />
          <DevButton
            label="Reset All"
            onPress={() => {
              adState.resetDaily();
              premiumState.resetAll();
            }}
            color="#dc2626"
          />
          <DevButton
            label="Check Daily Reset"
            onPress={() => adState.checkDailyReset()}
          />
        </View>
      </ScrollView>
    </View>
  );
}
