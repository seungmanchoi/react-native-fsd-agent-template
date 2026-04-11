import { Text, TextStyle } from 'react-native';
import { ReactNode } from 'react';

type TTypographyVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';

interface ITypographyProps {
  children: ReactNode;
  variant?: TTypographyVariant;
  color?: string;
  style?: TextStyle;
  className?: string;
}

export function AppText({
  children,
  variant = 'body',
  color,
  style,
  className,
}: ITypographyProps): React.JSX.Element {
  const getVariantStyle = () => {
    switch (variant) {
      case 'h1': return 'text-3xl font-bold text-primary dark:text-primary-dark';
      case 'h2': return 'text-2xl font-bold text-primary dark:text-primary-dark';
      case 'h3': return 'text-xl font-semibold text-primary dark:text-primary-dark';
      case 'body': return 'text-base font-normal text-primary dark:text-primary-dark';
      case 'caption': return 'text-sm font-normal text-text-muted';
      case 'label': return 'text-sm font-medium text-text-muted';
      default: return 'text-base';
    }
  };

  return (
    <Text 
      style={[color ? { color } : null, style]}
      className={\`\${getVariantStyle()} \${className || ''}\`}
    >
      {children}
    </Text>
  );
}
