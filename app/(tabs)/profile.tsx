import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Card, Button } from '@shared/ui';
import { Colors, Spacing } from '@shared/config';

export default function ProfileScreen(): React.JSX.Element {
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
          <Button title="Sign Out" onPress={() => {}} variant="outline" />
        </Card>
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
