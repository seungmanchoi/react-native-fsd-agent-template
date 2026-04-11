import { View, ViewStyle } from 'react-native';
import { ReactNode } from 'react';

interface ICardProps {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'glass';
  className?: string;
}

export function Card({ 
  children, 
  style, 
  variant = 'default',
  className 
}: ICardProps): React.JSX.Element {
  const baseStyle = "rounded-2xl p-4";
  const variantStyle = variant === 'glass' 
    ? "bg-surface dark:bg-surface-dark border border-border dark:border-border-dark shadow-md"
    : "bg-surface dark:bg-surface-dark shadow-sm";

  return (
    <View 
      style={style}
      className={\`\${baseStyle} \${variantStyle} \${className || ''}\`}
    >
      {children}
    </View>
  );
}
