import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { listVitals } from '../../api/records';

// Catmull-Rom spline interpolation to create a smooth curve through given points
function computeCatmullRomPath(points: { x: number; y: number }[], samplesPerSegment: number = 16) {
  if (points.length < 2) return points;
  const result: { x: number; y: number }[] = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i === 0 ? points[i] : points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i + 2 < points.length ? points[i + 2] : points[i + 1];
    for (let t = 1; t <= samplesPerSegment; t++) {
      const u = t / samplesPerSegment;
      const u2 = u * u;
      const u3 = u2 * u;
      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * u +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3
      );
      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * u +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3
      );
      result.push({ x, y });
    }
  }
  return result;
}

// Lightweight, dependency-free mock charts using Views
const LineChartMock = ({
  title,
  points,
  unit,
  yHint,
  normalLabel,
  normalMin,
  normalMax,
  chartHeight,
}: {
  title: string;
  points: number[];
  unit: string;
  yHint: string;
  normalLabel?: string;
  normalMin?: number;
  normalMax?: number;
  chartHeight?: number;
}) => {
  // Map points (0-100 scale) to positions; keep mock simple
  const coords = points.map((p, i) => ({ left: `${10 + i * (75 / Math.max(points.length - 1, 1))}%`, top: `${100 - Math.min(Math.max(p, 0), 100)}%` }));
  const [graphSize, setGraphSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const pixelCoords = useMemo(() => {
    if (!graphSize.width || !graphSize.height) return [] as { x: number; y: number }[];
    return coords.map(c => {
      const leftPerc = parseFloat(String(c.left).replace('%', '')) / 100;
      const topPerc = parseFloat(String(c.top).replace('%', '')) / 100;
      return { x: leftPerc * graphSize.width, y: topPerc * graphSize.height };
    });
  }, [coords, graphSize]);
  const curvePoints = useMemo(() => computeCatmullRomPath(pixelCoords, 20), [pixelCoords]);
  return (
    <View style={styles.chartBox}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{title}</Text>
        <Text style={styles.chartHint}>{yHint}</Text>
      </View>
      <View style={[styles.graphArea, chartHeight ? { height: chartHeight } : null]} onLayout={e => setGraphSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
        {normalMin !== undefined && normalMax !== undefined && (
          <View style={[styles.normalBand, { top: `${100 - normalMax}%`, height: `${normalMax - normalMin}%` }]} />
        )}
        {coords.map((c, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              { left: c.left as unknown as number, top: c.top as unknown as number },
            ]}
          />
        ))}
        <View style={styles.line} />
        {/* Smooth curve through dots (approximated with many small segments) */}
        {curvePoints.map((pt, idx) => {
          if (idx === 0) return null;
          const prev = curvePoints[idx - 1];
          const dx = pt.x - prev.x;
          const dy = pt.y - prev.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          return (
            <View
              key={`cseg-${idx}`}
              style={{
                position: 'absolute',
                left: prev.x,
                top: prev.y,
                width: len,
                height: 2,
                backgroundColor: '#17A196',
                opacity: 0.9,
                transform: [{ rotateZ: `${angle}rad` }],
              }}
            />
          );
        })}
      </View>
      {normalLabel ? (
        <View style={styles.legendRow}>
          <View style={[styles.legendSwatch, { backgroundColor: '#C8E6C9' }]} />
          <Text style={styles.legendText}>{normalLabel}</Text>
          <View style={[styles.legendSwatch, { backgroundColor: '#E53935' }]} />
          <Text style={styles.legendText}>Your last {points.length} readings ({unit})</Text>
        </View>
      ) : null}
    </View>
  );
};

const SummaryCard = ({ label, value, unit, trend }: { label: string; value: string | number; unit?: string; trend?: 'up' | 'down' | 'flat' }) => (
  <View style={styles.summaryCard}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
      <Text style={styles.summaryValue}>{value}</Text>
      {unit ? <Text style={styles.summaryUnit}>{unit}</Text> : null}
      {trend === 'up' && <Text style={styles.trendUp}>▲</Text>}
      {trend === 'down' && <Text style={styles.trendDown}>▼</Text>}
      {trend === 'flat' && <Text style={styles.trendFlat}>—</Text>}
    </View>
  </View>
);

export default function ChartsScreen() {
  const [vitals, setVitals] = useState<any[]>([]);
  const [metric, setMetric] = useState<'temp' | 'bp' | 'hr'>('temp');
  const [windowSize, setWindowSize] = useState<5 | 10 | 20>(10);
  useEffect(() => { (async () => { try { setVitals(await listVitals()); } catch {} })(); }, []);
  const windowH = Dimensions.get('window').height;
  const chartHeight = Math.max(320, Math.floor(windowH * 0.50));
  const insets = useSafeAreaInsets();
  const recent = useMemo(() => vitals.slice(0, windowSize).reverse(), [vitals, windowSize]);
  const normalize = (value: number, min: number, max: number) => ((value - min) / (max - min)) * 100;
  const tempSeries = useMemo(() => {
    const values = recent
      .map(v => parseFloat(String(v.temperature_c)))
      .filter(v => !isNaN(v));
    const fallback = [36.5, 36.8, 37.0, 36.7, 36.9];
    const domain = { min: 35, max: 40 };
    const arr = (values.length ? values : fallback).map(x => normalize(x, domain.min, domain.max));
    return { arr, domain };
  }, [recent]);
  const bpSeries = useMemo(() => {
    const sys = recent.map(v => v.systolic_bp).filter((n: any) => typeof n === 'number');
    const dia = recent.map(v => v.diastolic_bp).filter((n: any) => typeof n === 'number');
    const domain = { min: 60, max: 160 };
    const sysArr = (sys.length ? sys : [120, 121, 119, 117, 121]).map((x: number) => normalize(x, domain.min, domain.max));
    const diaArr = (dia.length ? dia : [80, 78, 77, 74, 80]).map((x: number) => normalize(x, domain.min, domain.max));
    return { sysArr, diaArr, domain };
  }, [recent]);
  const hrSeries = useMemo(() => {
    const hr = recent.map(v => v.heart_rate_bpm).filter((n: any) => typeof n === 'number');
    const domain = { min: 50, max: 120 };
    const arr = (hr.length ? hr : [72, 75, 73, 70, 74]).map((x: number) => normalize(x, domain.min, domain.max));
    return { arr, domain };
  }, [recent]);
  const lastVital = vitals[0];
  const latestTemp = lastVital?.temperature_c ? Number(lastVital.temperature_c).toFixed(1) : '--';
  const latestBP = lastVital?.systolic_bp && lastVital?.diastolic_bp ? `${lastVital.systolic_bp}/${lastVital.diastolic_bp}` : '--';
  const latestHR = lastVital?.heart_rate_bpm ?? '--';
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {/* Top summaries */}
        <View style={styles.summaryRow}>
          <SummaryCard label="Temperature" value={latestTemp} unit="°C" trend="flat" />
          <SummaryCard label="Blood Pressure" value={latestBP} unit="mmHg" trend="flat" />
          <SummaryCard label="Heart Rate" value={latestHR} unit="bpm" trend="flat" />
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          {([
            { k: 'temp', label: 'Temperature' },
            { k: 'bp', label: 'Blood Pressure' },
            { k: 'hr', label: 'Heart Rate' },
          ] as const).map((c) => (
            <TouchableOpacity key={c.k} onPress={() => setMetric(c.k)} style={[styles.ctrlChip, metric === c.k && styles.ctrlChipActive]}>
              <Text style={[styles.ctrlChipText, metric === c.k && styles.ctrlChipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={[styles.controlsRow, { marginTop: 6 }]}>          
          <Text style={styles.windowLabel}>Window:</Text>
          {([5, 10, 20] as const).map((n) => (
            <TouchableOpacity key={n} onPress={() => setWindowSize(n)} style={[styles.ctrlSmallChip, windowSize === n && styles.ctrlSmallChipActive]}>
              <Text style={[styles.ctrlSmallChipText, windowSize === n && styles.ctrlSmallChipTextActive]}>Last {n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {metric === 'temp' && (
          <LineChartMock
            title="Temperature"
            points={tempSeries.arr}
            unit="°C"
            yHint={`${tempSeries.domain.min} — ${tempSeries.domain.max} °C`}
            normalLabel="Normal range (36.1–37.2 °C)"
            normalMin={((36.1 - tempSeries.domain.min) / (tempSeries.domain.max - tempSeries.domain.min)) * 100}
            normalMax={((37.2 - tempSeries.domain.min) / (tempSeries.domain.max - tempSeries.domain.min)) * 100}
            chartHeight={chartHeight}
          />
        )}

        {metric === 'bp' && (
          <View style={styles.chartBox}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Blood Pressure</Text>
            <Text style={styles.chartHint}>{`${bpSeries.domain.min} — ${bpSeries.domain.max} mmHg`}</Text>
          </View>
          <View style={[styles.graphArea, { height: chartHeight }]}>
            {/* Normal bands */}
            <View style={[styles.normalBand, { top: `${100 - ((120 - bpSeries.domain.min) / (bpSeries.domain.max - bpSeries.domain.min)) * 100}%`, height: `${(((120 - bpSeries.domain.min) / (bpSeries.domain.max - bpSeries.domain.min)) * 100) - (((90 - bpSeries.domain.min) / (bpSeries.domain.max - bpSeries.domain.min)) * 100)}%`, backgroundColor: '#90CAF9', opacity: 0.25 }]} />
            <View style={[styles.normalBand, { top: `${100 - ((80 - bpSeries.domain.min) / (bpSeries.domain.max - bpSeries.domain.min)) * 100}%`, height: `${(((80 - bpSeries.domain.min) / (bpSeries.domain.max - bpSeries.domain.min)) * 100) - (((60 - bpSeries.domain.min) / (bpSeries.domain.max - bpSeries.domain.min)) * 100)}%`, backgroundColor: '#F8BBD0', opacity: 0.25 }]} />
            {/* Points */}
            {bpSeries.sysArr.map((p, i) => (
              <View key={`s${i}`} style={[styles.dot, { left: `${10 + i * (75 / Math.max(bpSeries.sysArr.length - 1, 1))}%`, top: `${100 - Math.min(Math.max(p, 0), 100)}%`, backgroundColor: '#1976D2' }]} />
            ))}
            {bpSeries.diaArr.map((p, i) => (
              <View key={`d${i}`} style={[styles.dot, { left: `${10 + i * (75 / Math.max(bpSeries.diaArr.length - 1, 1))}%`, top: `${100 - Math.min(Math.max(p, 0), 100)}%`, backgroundColor: '#E91E63' }]} />
            ))}
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendSwatch, { backgroundColor: '#90CAF9' }]} />
            <Text style={styles.legendText}>Normal systolic</Text>
            <View style={[styles.legendSwatch, { backgroundColor: '#F8BBD0' }]} />
            <Text style={styles.legendText}>Normal diastolic</Text>
            <View style={[styles.legendSwatch, { backgroundColor: '#1976D2' }]} />
            <Text style={styles.legendText}>Systolic</Text>
            <View style={[styles.legendSwatch, { backgroundColor: '#E91E63' }]} />
            <Text style={styles.legendText}>Diastolic</Text>
          </View>
          </View>
        )}

        {metric === 'hr' && (
          <LineChartMock
            title="Heart Rate"
            points={hrSeries.arr}
            unit="bpm"
            yHint={`${hrSeries.domain.min} — ${hrSeries.domain.max} bpm`}
            normalLabel="Typical resting (60–100 bpm)"
            normalMin={((60 - hrSeries.domain.min) / (hrSeries.domain.max - hrSeries.domain.min)) * 100}
            normalMax={((100 - hrSeries.domain.min) / (hrSeries.domain.max - hrSeries.domain.min)) * 100}
            chartHeight={chartHeight}
          />
        )}

        {/* Explanatory note */}
        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>How to read these charts</Text>
          <Text style={styles.noteText}>
            The green band shows the typical normal range. Dots represent your recent readings. Values above or below the band may warrant attention.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F8A83', padding: 16 },
  chartBox: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 14, padding: 12 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  chartTitle: { fontWeight: '700', color: '#334B48' },
  chartHint: { color: '#7B8F8C', fontSize: 12 },
  graphArea: { height: 140, borderRadius: 8, backgroundColor: '#E5F4F2', overflow: 'hidden', position: 'relative' },
  dot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935' },
  line: { position: 'absolute', left: 0, right: 0, top: '50%', height: 2, backgroundColor: '#0F8A83', opacity: 0.4 },
  normalBand: { position: 'absolute', left: 0, right: 0, backgroundColor: '#C8E6C9', opacity: 0.5 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  legendSwatch: { width: 12, height: 12, borderRadius: 2 },
  legendText: { color: '#334B48', fontSize: 12 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  summaryLabel: { color: '#7B8F8C', fontSize: 12, marginBottom: 4 },
  summaryValue: { color: '#334B48', fontWeight: '700', fontSize: 18 },
  summaryUnit: { color: '#7B8F8C' },
  trendUp: { color: '#2e7d32', marginLeft: 2 },
  trendDown: { color: '#d32f2f', marginLeft: 2 },
  trendFlat: { color: '#7B8F8C', marginLeft: 2 },
  noteBox: { backgroundColor: '#E5F4F2', borderRadius: 12, padding: 12 },
  noteTitle: { color: '#334B48', fontWeight: '700', marginBottom: 4 },
  noteText: { color: '#334B48' },
  controlsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ctrlChip: { borderWidth: 1, borderColor: '#0F8A83', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8 },
  ctrlChipActive: { backgroundColor: '#0F8A83' },
  ctrlChipText: { color: '#0F8A83', fontWeight: '600' },
  ctrlChipTextActive: { color: '#fff' },
  ctrlSmallChip: { borderWidth: 1, borderColor: '#CCE7E3', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 6, backgroundColor: '#F3FAF9' },
  ctrlSmallChipActive: { borderColor: '#0F8A83', backgroundColor: '#E8F3F1' },
  ctrlSmallChipText: { color: '#334B48', fontSize: 12, fontWeight: '500' },
  ctrlSmallChipTextActive: { color: '#0F8A83' },
  windowLabel: { color: '#7B8F8C', marginRight: 6, fontSize: 12 },
});


