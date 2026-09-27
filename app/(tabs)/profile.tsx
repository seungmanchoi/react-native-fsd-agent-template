import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { queryClient } from '@core/providers';
import { useUserStore } from '@entities/user';
import { onAdConsentResult, showAdsConsentForm } from '@features/ads';
import { AppText, Card, Button } from '@shared/ui';
import { Colors, Spacing } from '@shared/config';

export default function ProfileScreen(): React.JSX.Element {
  const logout = useUserStore((s) => s.logout);
  // UMP requires a way to change consent where regulations apply (EEA, UK, ...).
  // Subscribed, not read once: a consent retry on the next foreground can flip it.
  const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);

  useEffect(
    () => onAdConsentResult((result) => setPrivacyOptionsRequired(result.privacyOptionsRequired)),
    [],
  );

  const handleSignOut = async (): Promise<void> => {
    await logout();
    queryClient.clear(); // the next user must not see this user's cached queries
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="h2">Profile</AppText>
        <AppText variant="caption" style={styles.subtitle}>
          Manage your account
        </AppText>

        <Card style={styles.card}>
          <AppText variant="h3">User</AppText>
          <AppText variant="body" style={styles.cardText}>
            Logged in as guest
          </AppText>
          <Button title="Sign Out" onPress={() => void handleSignOut()} variant="outline" />
        </Card>

        {privacyOptionsRequired && (
          <Button
            title="Ad privacy settings"
            onPress={() => void showAdsConsentForm()}
            variant="ghost"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    padding: Spacing.xl,
  },
  subtitle: {
    marginTop: Spacing.xs,
    marginBottom: Spacing['2xl'],
  },
  card: {
    marginBottom: Spacing.lg,
  },
  cardText: {
    marginVertical: Spacing.md,
  },
});
