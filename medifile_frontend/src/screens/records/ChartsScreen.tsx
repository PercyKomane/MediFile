import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Lightweight, dependency-free mock charts using Views
const LineChartMock = () => (
  <View style={styles.chartBox}>
    <Text style={styles.chartTitle}>Temperature</Text>
    <View style={styles.graphArea}>
      <View style={[styles.dot, { left: '10%', top: '60%' }]} />
      <View style={[styles.dot, { left: '30%', top: '40%' }]} />
      <View style={[styles.dot, { left: '50%', top: '50%' }]} />
      <View style={[styles.dot, { left: '70%', top: '20%' }]} />
      <View style={[styles.dot, { left: '85%', top: '35%' }]} />
      <View style={styles.line} />
    </View>
  </View>
);

const AreaChartMock = () => (
  <View style={styles.chartBox}>
    <Text style={styles.chartTitle}>Blood pressure</Text>
    <View style={[styles.graphArea, { backgroundColor: '#FBE9E7' }]} />
  </View>
);

export default function ChartsScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <LineChartMock />
      <AreaChartMock />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F8A83', padding: 16 },
  chartBox: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 14, padding: 12 },
  chartTitle: { fontWeight: '700', color: '#334B48', marginBottom: 6 },
  graphArea: { height: 140, borderRadius: 8, backgroundColor: '#E5F4F2', overflow: 'hidden', position: 'relative' },
  dot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935' },
  line: { position: 'absolute', left: 0, right: 0, top: '50%', height: 2, backgroundColor: '#0F8A83', opacity: 0.4 },
});


