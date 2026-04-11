import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@shared/ui';
import { Colors, Spacing } from '@shared/config';

export default function ExploreScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="h2">Explore</AppText>
        <AppText variant="caption" style={styles.subtitle}>
          Discover new features
        </AppText>
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
  },
});
