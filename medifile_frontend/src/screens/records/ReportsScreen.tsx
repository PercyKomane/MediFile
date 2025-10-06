import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchMyMedicalHistory, listPatientMedications, listLabResults, listSymptoms, listVitals } from '../../api/records';

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'All';
type Scope = 'All' | 'Vitals' | 'Labs' | 'Meds' | 'Diagnoses' | 'Symptoms';

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function inRange(dateStr: string | Date, range: TimeRange) {
  if (range === 'All') return true;
  const dt = new Date(dateStr);
  if (range === '7d') return dt >= daysAgo(7);
  if (range === '30d') return dt >= daysAgo(30);
  if (range === '90d') return dt >= daysAgo(90);
  if (range === '1y') return dt >= daysAgo(365);
  return true;
}

function avg(nums: number[]) {
  const arr = nums.filter((n) => Number.isFinite(n));
  if (!arr.length) return NaN;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function toNumber(v: any) {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : NaN;
}

export default function ReportsScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [scope, setScope] = useState<Scope>('All');

  const [history, setHistory] = useState<any[]>([]);
  const [meds, setMeds] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [h, m, l, s, v] = await Promise.all([
          fetchMyMedicalHistory(),
          listPatientMedications(),
          listLabResults(),
          listSymptoms(),
          listVitals(),
        ]);
        setHistory(h || []);
        setMeds(m || []);
        setLabs(l || []);
        setSymptoms(s || []);
        setVitals(v || []);
      } catch {}
    })();
  }, []);

  // Apply time filter
  const historyF = useMemo(() => history.filter((x: any) => inRange(x.date_recorded || x.created_at || x.updated_at || new Date(), timeRange)), [history, timeRange]);
  const medsF = useMemo(() => meds.filter((x: any) => inRange(x.started_at || x.created_at || new Date(), timeRange)), [meds, timeRange]);
  const labsF = useMemo(() => labs.filter((x: any) => inRange(x.tested_at || x.created_at || new Date(), timeRange)), [labs, timeRange]);
  const symptomsF = useMemo(() => symptoms.filter((x: any) => inRange(x.recorded_at || x.created_at || new Date(), timeRange)), [symptoms, timeRange]);
  const vitalsF = useMemo(() => vitals.filter((x: any) => inRange(x.recorded_at || x.created_at || new Date(), timeRange)), [vitals, timeRange]);

  // KPIs
  const kpiActiveConditions = historyF.length; // fallback
  const kpiAbnormalLabs = useMemo(() => {
    return labsF.filter((l: any) => {
      const val = toNumber(l.result_value);
      const lo = toNumber(l.ref_low);
      const hi = toNumber(l.ref_high);
      if (Number.isFinite(lo) && Number.isFinite(hi) && Number.isFinite(val)) return val < lo || val > hi;
      return false;
    }).length;
  }, [labsF]);
  const kpiAvgSys = useMemo(() => avg(vitalsF.map((v: any) => toNumber(v.systolic_bp))), [vitalsF]);
  const kpiAvgDia = useMemo(() => avg(vitalsF.map((v: any) => toNumber(v.diastolic_bp))), [vitalsF]);
  const kpiAvgHr = useMemo(() => avg(vitalsF.map((v: any) => toNumber(v.heart_rate_bpm))), [vitalsF]);
  const kpiNewSymptoms = symptomsF.length;

  // Insights (simple trend based on first vs last in range)
  const insights = useMemo(() => {
    const out: string[] = [];
    const vt = vitalsF.slice().sort((a: any, b: any) => new Date(a.recorded_at || a.created_at).getTime() - new Date(b.recorded_at || b.created_at).getTime());
    if (vt.length >= 2) {
      const first = vt[0];
      const last = vt[vt.length - 1];
      const sysTrend = toNumber(last.systolic_bp) - toNumber(first.systolic_bp);
      const hrTrend = toNumber(last.heart_rate_bpm) - toNumber(first.heart_rate_bpm);
      if (Number.isFinite(sysTrend)) out.push(`Blood pressure ${sysTrend > 0 ? 'trending up' : sysTrend < 0 ? 'trending down' : 'stable'} in this period`);
      if (Number.isFinite(hrTrend)) out.push(`Heart rate ${hrTrend > 0 ? 'increased' : hrTrend < 0 ? 'decreased' : 'stable'} vs start of period`);
    }
    if (kpiAbnormalLabs > 0) out.push(`${kpiAbnormalLabs} lab result${kpiAbnormalLabs > 1 ? 's' : ''} outside reference range`);
    if (kpiNewSymptoms > 0) out.push(`${kpiNewSymptoms} new symptom entry${kpiNewSymptoms > 1 ? 'ies' : 'y'} recorded`);
    return out;
  }, [vitalsF, kpiAbnormalLabs, kpiNewSymptoms]);

  // Search within insights and sections
  const queryL = query.trim().toLowerCase();
  const insightsQ = useMemo(() => (queryL ? insights.filter((t) => t.toLowerCase().includes(queryL)) : insights), [insights, queryL]);
  const labsTop = useMemo(() => labsF.filter((l: any) => (queryL ? `${l.test_name} ${l.result_value} ${l.units || ''}`.toLowerCase().includes(queryL) : true)).slice(0, 5), [labsF, queryL]);
  const medsTop = useMemo(() => medsF.filter((m: any) => (queryL ? `${m.name} ${m.dosage || ''}`.toLowerCase().includes(queryL) : true)).slice(0, 5), [medsF, queryL]);
  const diagTop = useMemo(() => historyF.filter((h: any) => (queryL ? String(h.diagnosis || '').toLowerCase().includes(queryL) : true)).slice(0, 5), [historyF, queryL]);
  const sympTop = useMemo(() => symptomsF.filter((s: any) => (queryL ? String(s.description || '').toLowerCase().includes(queryL) : true)).slice(0, 5), [symptomsF, queryL]);

  const todayStr = useMemo(() => new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), []);

  const showSection = (name: Scope) => scope === 'All' || scope === name;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={22} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Reports</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#6B8F8C" />
        <TextInput
          placeholder="Search reports, labs, meds, diagnoses..."
          placeholderTextColor="#6B8F8C"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Filters */}
        <Text style={styles.sectionLabel}>Time range</Text>
        <View style={styles.chipsRow}>
          {(['7d','30d','90d','1y','All'] as TimeRange[]).map((r) => (
            <Chip key={r} label={r} active={timeRange === r} onPress={() => setTimeRange(r)} />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Scope</Text>
        <View style={styles.chipsRow}>
          {(['All','Vitals','Labs','Meds','Diagnoses','Symptoms'] as Scope[]).map((r) => (
            <Chip key={r} label={r} active={scope === r} onPress={() => setScope(r)} />
          ))}
        </View>

        {/* KPIs */}
        <View style={styles.kpiGrid}>
          <KpiCard title="Active conditions" value={String(kpiActiveConditions)} subtitle={todayStr} tone="neutral" />
          <KpiCard title="Abnormal labs" value={String(kpiAbnormalLabs)} subtitle={todayStr} tone={kpiAbnormalLabs > 0 ? 'alert' : 'ok'} />
          <KpiCard title="Avg BP" value={Number.isFinite(kpiAvgSys) && Number.isFinite(kpiAvgDia) ? `${Math.round(kpiAvgSys)}/${Math.round(kpiAvgDia)}` : '--'} subtitle={timeRange} tone="neutral" />
          <KpiCard title="Avg HR" value={Number.isFinite(kpiAvgHr) ? `${Math.round(kpiAvgHr)} bpm` : '--'} subtitle={timeRange} tone="neutral" />
        </View>

        {/* Insights */}
        {!!insightsQ.length && (
          <View style={styles.card}> 
            <Text style={styles.cardTitle}>Insights</Text>
            {insightsQ.map((txt, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#17A196', marginRight: 8 }} />
                <Text style={styles.detail}>{txt}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Sections */}
        {showSection('Vitals') && (
          <View style={styles.card}>
            <View style={styles.titleRow}> 
              <Text style={styles.cardTitle}>Vitals trends</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Charts')}><Text style={styles.link}>Open charts</Text></TouchableOpacity>
            </View>
            <View style={styles.rowWrap}>
              <MiniStat label="Systolic" value={Number.isFinite(kpiAvgSys) ? `${Math.round(kpiAvgSys)} mmHg` : '--'} />
              <MiniStat label="Diastolic" value={Number.isFinite(kpiAvgDia) ? `${Math.round(kpiAvgDia)} mmHg` : '--'} />
              <MiniStat label="Heart rate" value={Number.isFinite(kpiAvgHr) ? `${Math.round(kpiAvgHr)} bpm` : '--'} />
            </View>
          </View>
        )}

        {showSection('Labs') && (
          <View style={styles.card}>
            <View style={styles.titleRow}> 
              <Text style={styles.cardTitle}>Lab tests</Text>
              <TouchableOpacity onPress={() => navigation.navigate('LabTests')}><Text style={styles.link}>See all</Text></TouchableOpacity>
            </View>
            {labsTop.map((l: any, idx: number) => {
              const val = toNumber(l.result_value);
              const lo = toNumber(l.ref_low);
              const hi = toNumber(l.ref_high);
              const flagged = Number.isFinite(val) && Number.isFinite(lo) && Number.isFinite(hi) && (val < lo || val > hi);
              return (
                <View key={idx} style={styles.rowBetween}>
                  <Text style={styles.detail}>{l.test_name}</Text>
                  <Text style={[styles.detail, { color: flagged ? '#D9534F' : '#334B48' }]}>{Number.isFinite(val) ? val : l.result_value} {l.units || ''}</Text>
                </View>
              );
            })}
            {!labsTop.length && <Text style={styles.muted}>No labs in this range</Text>}
          </View>
        )}

        {showSection('Meds') && (
          <View style={styles.card}>
            <View style={styles.titleRow}> 
              <Text style={styles.cardTitle}>Medications</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Medications')}><Text style={styles.link}>Manage</Text></TouchableOpacity>
            </View>
            {medsTop.map((m: any, idx: number) => (
              <View key={idx} style={styles.rowBetween}>
                <Text style={styles.detail}>{m.name}</Text>
                <Text style={styles.muted}>{m.dosage || ''}</Text>
              </View>
            ))}
            {!medsTop.length && <Text style={styles.muted}>No meds in this range</Text>}
          </View>
        )}

        {showSection('Diagnoses') && (
          <View style={styles.card}>
            <View style={styles.titleRow}> 
              <Text style={styles.cardTitle}>Diagnoses</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Diagnoses')}><Text style={styles.link}>See all</Text></TouchableOpacity>
            </View>
            {diagTop.map((h: any, idx: number) => (
              <View key={idx} style={styles.rowBetween}>
                <Text style={styles.detail}>{h.diagnosis}</Text>
                <Text style={styles.muted}>{h.date_recorded ? new Date(h.date_recorded).toLocaleDateString() : ''}</Text>
              </View>
            ))}
            {!diagTop.length && <Text style={styles.muted}>No diagnoses in this range</Text>}
          </View>
        )}

        {showSection('Symptoms') && (
          <View style={styles.card}>
            <View style={styles.titleRow}> 
              <Text style={styles.cardTitle}>Symptoms</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Symptoms')}><Text style={styles.link}>See all</Text></TouchableOpacity>
            </View>
            {sympTop.map((s: any, idx: number) => (
              <View key={idx} style={styles.rowBetween}>
                <Text style={styles.detail}>{s.description}</Text>
                <Text style={[styles.muted, { textTransform: 'capitalize' }]}>{s.severity || ''}</Text>
              </View>
            ))}
            {!sympTop.length && <Text style={styles.muted}>No symptoms in this range</Text>}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function KpiCard({ title, value, subtitle, tone }: { title: string; value: string; subtitle?: string; tone?: 'ok' | 'alert' | 'neutral' }) {
  const borderColor = tone === 'ok' ? '#17A196' : tone === 'alert' ? '#D9534F' : '#B3CBC7';
  return (
    <View style={[styles.kpiCard, { borderColor }]}> 
      <Text style={styles.kpiTitle}>{title}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {!!subtitle && <Text style={styles.kpiSubtitle}>{subtitle}</Text>}
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={styles.miniValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F8A83' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { color: '#fff', fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DDF0EE', marginHorizontal: 16, borderRadius: 24, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, color: '#0F3330', marginLeft: 6 },
  sectionLabel: { color: '#E6FFFB', opacity: 0.9, marginTop: 14, marginHorizontal: 16, marginBottom: 6, fontWeight: '600' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  chip: { borderWidth: 1, borderColor: '#8FB9B3', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: 'transparent' },
  chipActive: { backgroundColor: '#E5F4F2', borderColor: '#17A196' },
  chipText: { color: '#E6FFFB' },
  chipTextActive: { color: '#0F3330', fontWeight: '700' },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 16 },
  kpiCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1 },
  kpiTitle: { color: '#5C7A76', fontSize: 12 },
  kpiValue: { color: '#0F3330', fontSize: 22, fontWeight: '800', marginTop: 2 },
  kpiSubtitle: { color: '#6B8F8C', fontSize: 11, marginTop: 2 },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginHorizontal: 16, marginTop: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: '#0F8A83', fontWeight: '700', marginVertical: 6 },
  detail: { color: '#334B48' },
  link: { color: '#17A196', fontWeight: '700' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  miniStat: { backgroundColor: '#F4FBFA', borderWidth: 1, borderColor: '#B3CBC7', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  miniLabel: { color: '#5C7A76', fontSize: 12 },
  miniValue: { color: '#0F3330', fontWeight: '800', marginTop: 2 },
  muted: { color: '#6B8F8C', fontSize: 12, marginTop: 6 },
});


