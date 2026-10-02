import { StyleSheet, View } from 'react-native';

import { palette } from '@/theme/tokens';

export function Mark({ size = 72 }: { size?: number }) {
  const stroke = Math.max(2, Math.round(size * 0.06));
  const barWidth = Math.round(size * 0.28);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
        },
      ]}>
      <View
        style={{
          width: barWidth,
          height: stroke,
          borderRadius: stroke,
          backgroundColor: palette.accent,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
