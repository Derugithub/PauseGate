import { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, radius, space } from '@/theme/tokens';

export function Screen({
  children,
  scroll = true,
  topInset = true,
  footer,
}: {
  children: ReactNode;
  scroll?: boolean;
  topInset?: boolean;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const paddingTop = topInset ? insets.top + 12 : 8;
  const paddingBottom = insets.bottom + 20;

  if (!scroll) {
    return (
      <View style={[styles.screen, styles.column, { paddingTop, paddingBottom }]}>
        {children}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.column, { paddingTop, paddingBottom: footer ? space.md : paddingBottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>{footer}</View> : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  testID,
  style,
}: {
  label: string;
  onPress: PressableProps['onPress'];
  variant?: 'primary' | 'ghost' | 'quiet';
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        style,
        variant === 'primary' && styles.primary,
        variant === 'ghost' && styles.ghost,
        variant === 'quiet' && styles.quiet,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <Text
        style={[
          styles.buttonLabel,
          variant === 'primary' ? styles.primaryLabel : styles.ghostLabel,
          variant === 'quiet' && styles.quietLabel,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
  testID,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  testID?: string;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleCopy}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {subtitle ? <Text style={styles.toggleSubtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        accessibilityLabel={title}
        testID={testID}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: palette.track, true: '#3E8F84' }}
        thumbColor={value ? '#D7F6F1' : '#C5D0CC'}
        ios_backgroundColor={palette.track}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  column: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: space.lg,
    gap: 28,
    flexGrow: 1,
  },
  footer: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: 20,
    gap: 14,
  },
  section: {
    color: palette.textFaint,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primary: {
    backgroundColor: palette.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: palette.accentLine,
  },
  quiet: {
    backgroundColor: 'transparent',
    minHeight: 44,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.4,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryLabel: {
    color: palette.accentInk,
  },
  ghostLabel: {
    color: palette.text,
  },
  quietLabel: {
    color: palette.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '500',
  },
  toggleSubtitle: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
