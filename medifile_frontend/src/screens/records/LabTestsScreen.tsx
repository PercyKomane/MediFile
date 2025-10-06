import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { listLabResults, addLabResult, updateLabResult, deleteLabResult } from '../../api/records';
import { useAuth } from '../../context/AuthContext';

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'All';
type ResultFilter = 'All' | 'Normal' | 'Abnormal';

export default function LabTestsScreen({ navigation }: any) {
  const { role } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ test_name: '', result_value: '', units: '', ref_low: '', ref_high: '', recorded_at: '' });
  const [query, setQuery] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [resultFilter, setResultFilter] = useState<ResultFilter>('All');
  const [panel, setPanel] = useState<string>('All');
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<{ test_name?: string; result_value?: string; units?: string; ref_low?: string; ref_high?: string; recorded_at?: string } | null>(null);

  const load = async () => {
    const data = await listLabResults();
    setItems(data);
  };

  useEffect(() => { load(); }, []);

  const onAdd = async () => {
    if (!form.test_name.trim() || !form.result_value.trim()) {
      Alert.alert('Validation', 'Test name and result are required');
      return;
    }
    try {
      await addLabResult({
        test_name: form.test_name,
        result_value: form.result_value,
        units: form.units,
        ref_low: form.ref_low || undefined,
        ref_high: form.ref_high || undefined,
        recorded_at: form.recorded_at || new Date().toISOString().slice(0, 10),
      });
      setForm({ test_name: '', result_value: '', units: '', ref_low: '', ref_high: '', recorded_at: '' });
      setShowAdd(false);
      load();
    } catch (e) {
      Alert.alert('Error', 'Failed to add lab result');
    }
  };

  function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
  function inRange(dateStr: string | Date, range: TimeRange) {
    if (range === 'All') return true;
    const dt = new Date(dateStr);
    if (range === '7d') return dt >= daysAgo(7);
    if (range === '30d') return dt >= daysAgo(30);
    if (range === '90d') return dt >= daysAgo(90);
    if (range === '1y') return dt >= daysAgo(365);
    return true;
  }
  function toNumber(v: any) { const n = typeof v === 'number' ? v : parseFloat(String(v)); return Number.isFinite(n) ? n : NaN; }
  function isAbnormal(it: any) {
    const val = toNumber(it.result_value);
    const lo = toNumber(it.ref_low);
    const hi = toNumber(it.ref_high);
    if (Number.isFinite(val) && Number.isFinite(lo) && Number.isFinite(hi)) return val < lo || val > hi;
    return false;
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = items.filter((x: any) => inRange(x.recorded_at || x.created_at || new Date(), timeRange));
    if (resultFilter !== 'All') arr = arr.filter((x: any) => (resultFilter === 'Abnormal') === isAbnormal(x));
    if (panel !== 'All') arr = arr.filter((x: any) => String(x.panel || '').toLowerCase() === panel.toLowerCase());
    if (q) arr = arr.filter((x: any) => `${x.test_name} ${x.units || ''}`.toLowerCase().includes(q));
    return arr.sort((a: any, b: any) => new Date(b.recorded_at || b.created_at).getTime() - new Date(a.recorded_at || a.created_at).getTime());
  }, [items, query, timeRange, resultFilter, panel]);

  const kpiTotal = filtered.length;
  const kpiAbnormal = useMemo(() => filtered.filter(isAbnormal).length, [filtered]);
  const recentPanel = useMemo(() => filtered[0]?.panel || '--', [filtered]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={22} color="#0F8A83" /></TouchableOpacity>
        <Text style={styles.title}>Lab Tests</Text>
        {role === 'doctor' ? (
          <TouchableOpacity onPress={() => setShowAdd(s => !s)}>
            <Ionicons name={showAdd ? 'close' : 'add'} size={22} color="#0F8A83" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      {role === 'doctor' && showAdd && (
        <View style={styles.formCard}>
          <TextInput placeholder="Test name" placeholderTextColor="#7B8F8C" style={styles.input} value={form.test_name} onChangeText={(t) => setForm({ ...form, test_name: t })} />
          <TextInput placeholder="Result" placeholderTextColor="#7B8F8C" style={styles.input} value={form.result_value} onChangeText={(t) => setForm({ ...form, result_value: t })} />
          <TextInput placeholder="Units" placeholderTextColor="#7B8F8C" style={styles.input} value={form.units} onChangeText={(t) => setForm({ ...form, units: t })} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput placeholder="Ref low" placeholderTextColor="#7B8F8C" style={[styles.input, { flex: 1 }]} value={form.ref_low} onChangeText={(t) => setForm({ ...form, ref_low: t })} />
            <TextInput placeholder="Ref high" placeholderTextColor="#7B8F8C" style={[styles.input, { flex: 1 }]} value={form.ref_high} onChangeText={(t) => setForm({ ...form, ref_high: t })} />
          </View>
          <TextInput placeholder="Date (YYYY-MM-DD)" placeholderTextColor="#7B8F8C" style={styles.input} value={form.recorded_at} onChangeText={(t) => setForm({ ...form, recorded_at: t })} />
          <TouchableOpacity style={styles.addBtn} onPress={onAdd}><Text style={styles.addBtnText}>Add</Text></TouchableOpacity>
        </View>
      )}

      {/* KPIs */}
      <View style={styles.kpiRow}>
        <Kpi title="Total" value={String(kpiTotal)} />
        <Kpi title="Abnormal" value={String(kpiAbnormal)} accent="#D9534F" />
        <Kpi title="Recent panel" value={String(recentPanel)} />
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        {(['7d','30d','90d','1y','All'] as TimeRange[]).map((t) => (
          <Chip key={t} label={t} active={timeRange === t} onPress={() => setTimeRange(t)} />
        ))}
      </View>
      <View style={styles.filtersRow}>
        {(['All','Normal','Abnormal'] as ResultFilter[]).map((t) => (
          <Chip key={t} label={t} active={resultFilter === t} onPress={() => setResultFilter(t)} />
        ))}
        <View style={{ flex: 1 }} />
        <Chip label="Flagged first" active onPress={() => setResultFilter('Abnormal')} />
      </View>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#6B8F8C" />
        <TextInput placeholder="Search labs" placeholderTextColor="#6B8F8C" style={styles.searchInput} value={query} onChangeText={setQuery} />
      </View>

      {/* Grouped timeline by date */}
      <SectionList
        sections={Object.values(groupByDate(filtered))}
        keyExtractor={(it: any) => String(it.lab_result_id)}
        renderSectionHeader={({ section }: any) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }: any) => (
          <View style={{ paddingHorizontal: 16 }}>
            <LabCard
              item={item}
              isDoctor={role === 'doctor'}
              onEdit={() => { setEditItem(item); setEditForm({ test_name: item.test_name, result_value: String(item.result_value), units: item.units, ref_low: String(item.ref_low || ''), ref_high: String(item.ref_high || ''), recorded_at: item.recorded_at }); }}
              onDelete={async () => { try { await deleteLabResult(item.lab_result_id); load(); } catch { Alert.alert('Error', 'Delete failed'); } }}
            />
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#7B8F8C', padding: 16 }}>No lab results</Text>}
      />

      {/* Edit Modal */}
      <Modal visible={role === 'doctor' && !!editForm} animationType="fade" transparent onRequestClose={() => setEditForm(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit lab result</Text>
              <TouchableOpacity onPress={() => setEditForm(null)}><Ionicons name="close" size={22} color="#334B48" /></TouchableOpacity>
            </View>
            <View style={{ padding: 16 }}>
              <TextInput placeholder="Test name" placeholderTextColor="#7B8F8C" style={styles.input} value={editForm?.test_name || ''} onChangeText={(t) => setEditForm((f) => ({ ...(f||{}), test_name: t }))} />
              <TextInput placeholder="Result" placeholderTextColor="#7B8F8C" style={styles.input} value={editForm?.result_value || ''} onChangeText={(t) => setEditForm((f) => ({ ...(f||{}), result_value: t }))} />
              <TextInput placeholder="Units" placeholderTextColor="#7B8F8C" style={styles.input} value={editForm?.units || ''} onChangeText={(t) => setEditForm((f) => ({ ...(f||{}), units: t }))} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput placeholder="Ref low" placeholderTextColor="#7B8F8C" style={[styles.input, { flex: 1 }]} value={editForm?.ref_low || ''} onChangeText={(t) => setEditForm((f) => ({ ...(f||{}), ref_low: t }))} />
                <TextInput placeholder="Ref high" placeholderTextColor="#7B8F8C" style={[styles.input, { flex: 1 }]} value={editForm?.ref_high || ''} onChangeText={(t) => setEditForm((f) => ({ ...(f||{}), ref_high: t }))} />
              </View>
              <TextInput placeholder="Date (YYYY-MM-DD)" placeholderTextColor="#7B8F8C" style={styles.input} value={editForm?.recorded_at || ''} onChangeText={(t) => setEditForm((f) => ({ ...(f||{}), recorded_at: t }))} />
              <TouchableOpacity style={styles.addBtn} onPress={async () => { if (!editItem) return; try { await updateLabResult(editItem.lab_result_id, editForm); setEditForm(null); load(); } catch { Alert.alert('Error', 'Update failed'); } }}>
                <Text style={styles.addBtnText}>Save changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { fontWeight: '700', color: '#0F8A83' },
  formCard: { backgroundColor: '#F3FAF9', borderWidth: 1, borderColor: '#E8F3F1', marginHorizontal: 16, padding: 12, borderRadius: 12 },
  input: { borderWidth: 1, borderColor: '#CCE7E3', borderRadius: 8, padding: 10, color: '#334B48', marginBottom: 8, backgroundColor: '#fff' },
  addBtn: { backgroundColor: '#0F8A83', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8F3F1', borderRadius: 12, padding: 14, marginBottom: 10 },
  name: { fontWeight: '700', marginBottom: 2, color: '#334B48' },
  sub: { color: '#7B8F8C' },
  kpiRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 8 },
  kpiCard: { flex: 1, backgroundColor: '#F4FBFA', borderColor: '#CCE7E3', borderWidth: 1, borderRadius: 10, padding: 10 },
  kpiTitle: { color: '#5C7A76', fontSize: 12 },
  kpiValue: { color: '#0F3330', fontSize: 18, fontWeight: '800', marginTop: 2 },
  filtersRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginTop: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3FAF9', borderWidth: 1, borderColor: '#E8F3F1', margin: 16, borderRadius: 24, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, color: '#0F3330', marginLeft: 6 },
  sectionHeader: { color: '#5C7A76', fontWeight: '700', paddingHorizontal: 16, paddingTop: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEF4F3' },
  modalTitle: { color: '#0F3330', fontWeight: '800' },
});

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[{ borderWidth: 1, borderColor: '#B3CBC7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 }, active && { backgroundColor: '#E5F4F2', borderColor: '#17A196' }]}>
      <Text style={[{ color: '#334B48' }, active && { color: '#0F3330', fontWeight: '700' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Kpi({ title, value, accent }: { title: string; value: string; accent?: string }) {
  return (
    <View style={[styles.kpiCard, accent ? { borderLeftWidth: 3, borderLeftColor: accent } : null]}>
      <Text style={styles.kpiTitle}>{title}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );
}

function LabCard({ item, onEdit, onDelete, isDoctor }: { item: any; onEdit: () => void; onDelete: () => void; isDoctor: boolean }) {
  const abnormal = (() => {
    const val = parseFloat(String(item.result_value));
    const lo = item.ref_low != null ? parseFloat(String(item.ref_low)) : NaN;
    const hi = item.ref_high != null ? parseFloat(String(item.ref_high)) : NaN;
    if (Number.isFinite(val) && Number.isFinite(lo) && Number.isFinite(hi)) return val < lo || val > hi;
    return false;
  })();
  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={styles.name}>{item.test_name}</Text>
        <View style={{ backgroundColor: abnormal ? '#D9534F' : '#17A196', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
          <Text style={{ color: '#fff', fontSize: 12 }}>{abnormal ? 'Abnormal' : 'Normal'}</Text>
        </View>
      </View>
      <Text style={styles.sub}>{item.result_value} {item.units || ''} {Number.isFinite(parseFloat(String(item.ref_low))) && Number.isFinite(parseFloat(String(item.ref_high))) ? `(Ref ${item.ref_low}-${item.ref_high})` : ''}</Text>
      <Text style={styles.sub}>{item.recorded_at}</Text>
      {isDoctor ? (
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <TouchableOpacity onPress={onEdit}><Text style={{ color: '#17A196', fontWeight: '700' }}>Edit</Text></TouchableOpacity>
          <TouchableOpacity onPress={onDelete}><Text style={{ color: '#D9534F', fontWeight: '700' }}>Delete</Text></TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

function groupByDate(arr: any[]) {
  const map: Record<string, { title: string; data: any[] }> = {};
  arr.forEach((it) => {
    const d = new Date(it.recorded_at || it.created_at);
    const title = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    if (!map[title]) map[title] = { title, data: [] };
    map[title].data.push(it);
  });
  return map;
}


