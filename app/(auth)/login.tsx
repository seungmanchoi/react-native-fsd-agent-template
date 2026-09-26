import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, Input } from '@shared/ui';
import { Colors, Typography, Spacing } from '@shared/config';

export default function LoginScreen(): React.JSX.Element {
  const handleLogin = (): void => {
    // TODO: Implement login logic
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Email"
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.spacer} />
        <Input label="Password" placeholder="Enter your password" secureTextEntry />
        <View style={styles.spacerLg} />
        <Button title="Sign In" onPress={handleLogin} fullWidth />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: Spacing['4xl'],
  },
  title: {
    fontSize: Typography.fontSizes['3xl'],
    fontWeight: Typography.fontWeights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSizes.base,
    color: Colors.text.secondary,
  },
  form: {
    width: '100%',
  },
  spacer: {
    height: Spacing.lg,
  },
  spacerLg: {
    height: Spacing['2xl'],
  },
});
