import { StyleSheet, View, type ColorValue } from 'react-native';

export function TabGlyph({ name, color }: { name: 'pause' | 'history' | 'settings'; color: ColorValue }) {
  if (name === 'pause') {
    return (
      <View style={[styles.pause, { borderColor: color }]}>
        <View style={[styles.pauseBar, { backgroundColor: color }]} />
      </View>
    );
  }
  if (name === 'history') {
    return (
      <View style={[styles.history, { borderColor: color }]}>
        <View style={[styles.historyLine, { backgroundColor: color }]} />
        <View style={[styles.historyLine, styles.historyShort, { backgroundColor: color }]} />
      </View>
    );
  }
  return (
    <View style={styles.settings}>
      <View style={[styles.settingLine, { backgroundColor: color, width: 16 }]} />
      <View style={[styles.settingLine, { backgroundColor: color, width: 11 }]} />
      <View style={[styles.settingLine, { backgroundColor: color, width: 16 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  pause: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBar: {
    width: 8,
    height: 1.5,
    borderRadius: 1,
  },
  history: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 3,
  },
  historyLine: {
    height: 1.5,
    borderRadius: 1,
  },
  historyShort: {
    width: 9,
  },
  settings: {
    width: 18,
    height: 14,
    justifyContent: 'space-between',
  },
  settingLine: {
    height: 1.5,
    borderRadius: 1,
  },
});
