import { Pressable, Text, ActivityIndicator, ViewStyle } from 'react-native';

type TButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type TButtonSize = 'sm' | 'md' | 'lg';

interface IButtonProps {
  title: string;
  onPress: () => void;
  variant?: TButtonVariant;
  size?: TButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className,
  style,
}: IButtonProps): React.JSX.Element {
  const isDisabled = disabled || loading;

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary': return 'bg-primary dark:bg-primary-dark';
      case 'secondary': return 'bg-surface dark:bg-surface-dark';
      case 'outline': return 'bg-transparent border border-primary dark:border-primary-dark';
      case 'ghost': return 'bg-transparent';
      default: return 'bg-primary';
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm': return 'h-9 px-3';
      case 'md': return 'h-11 px-4';
      case 'lg': return 'h-13 px-6';
      default: return 'h-11 px-4';
    }
  };

  const getTextStyle = () => {
    const base = "font-semibold";
    const sizeStyle = size === 'sm' ? "text-sm" : size === 'lg' ? "text-lg" : "text-base";
    let color = "text-white";
    
    if (variant === 'secondary') color = "text-primary dark:text-primary-dark";
    if (variant === 'outline' || variant === 'ghost') color = "text-primary dark:text-primary-dark";
    
    return \`\${base} \${sizeStyle} \${color}\`;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={style}
      className={\`
        flex-row items-center justify-center rounded-xl
        \${getVariantStyle()}
        \${getSizeStyle()}
        \${fullWidth ? 'w-full' : ''}
        \${isDisabled ? 'opacity-50' : 'active:opacity-80'}
        \${className || ''}
      \`}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? undefined : '#fff'}
        />
      ) : (
        <Text className={getTextStyle()}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
