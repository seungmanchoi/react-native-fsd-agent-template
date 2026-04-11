import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Card, Button } from '@shared/ui';
import { Colors, Spacing } from '@shared/config';

export default function HomeScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="h2">Home</AppText>
        <AppText variant="caption" style={styles.subtitle}>
          Welcome to your app
        </AppText>

        <Card style={styles.card}>
          <AppText variant="h3">Getting Started</AppText>
          <AppText variant="body" style={styles.cardText}>
            This is a template with FSD architecture, Expo Router, Zustand, TanStack Query, and
            NativeWind.
          </AppText>
          <Button title="Learn More" onPress={() => {}} variant="outline" />
        </Card>

        <Card variant="glass" style={styles.card}>
          <AppText variant="h3">FSD Architecture</AppText>
          <AppText variant="body" style={styles.cardText}>
            Feature-Sliced Design helps organize code by business domains with clear layer
            boundaries.
          </AppText>
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
