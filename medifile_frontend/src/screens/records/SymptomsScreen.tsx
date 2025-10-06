import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { listSymptoms, addSymptom, updateSymptom, deleteSymptom } from '../../api/records';

type TimeRange = 'Today' | '7d' | '30d' | '90d' | 'All';
type Sev = 'mild' | 'moderate' | 'severe';

export default function SymptomsScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<{ description: string; severity: Sev; notes?: string }>({ description: '', severity: 'mild' });
  const [query, setQuery] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [sevFilter, setSevFilter] = useState<Sev | 'All'>('All');
  const [viewMode, setViewMode] = useState<'List' | 'Timeline'>('List');
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<{ description?: string; severity?: Sev; notes?: string } | null>(null);

  const load = async () => {
    const data = await listSymptoms();
    setItems(data);
  };

  useEffect(() => { load(); }, []);

  const onAdd = async () => {
    if (!form.description.trim()) {
      Alert.alert('Validation', 'Description is required');
      return;
    }
    try {
      await addSymptom({
        description: form.description,
        severity: form.severity,
        onset_date: new Date().toISOString().slice(0, 10),
        notes: form.notes || undefined,
      });
      setForm({ description: '', severity: 'mild' });
      setShowAdd(false);
      load();
    } catch (e) {
      Alert.alert('Error', 'Failed to add symptom');
    }
  };

  function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
  function inRange(dateStr: string | Date, range: TimeRange) {
    if (range === 'All') return true;
    const dt = new Date(dateStr);
    if (range === 'Today') { const now = new Date(); return dt.toDateString() === now.toDateString(); }
    if (range === '7d') return dt >= daysAgo(7);
    if (range === '30d') return dt >= daysAgo(30);
    if (range === '90d') return dt >= daysAgo(90);
    return true;
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = items.filter((s: any) => inRange(s.onset_date || s.recorded_at || s.created_at || new Date(), timeRange));
    if (sevFilter !== 'All') arr = arr.filter((s: any) => String(s.severity).toLowerCase() === sevFilter);
    if (q) arr = arr.filter((s: any) => `${s.description} ${s.notes || ''}`.toLowerCase().includes(q));
    return arr.sort((a: any, b: any) => new Date(b.onset_date || b.created_at).getTime() - new Date(a.onset_date || a.created_at).getTime());
  }, [items, query, timeRange, sevFilter]);

  const kpiTotal = filtered.length;
  const kpi7d = useMemo(() => items.filter((s: any) => inRange(s.onset_date || s.created_at || new Date(), '7d')).length, [items]);
  const freqSymptom = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((s: any) => { const key = String(s.description || '').toLowerCase(); map[key] = (map[key] || 0) + 1; });
    const top = Object.entries(map).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : '--';
  }, [items]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={22} color="#0F8A83" /></TouchableOpacity>
        <Text style={styles.title}>Symptoms</Text>
        <TouchableOpacity onPress={() => setShowAdd(s => !s)}>
          <Ionicons name={showAdd ? 'close' : 'add'} size={22} color="#0F8A83" />
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View style={styles.formCard}>
          <TextInput placeholder="Describe your symptom" placeholderTextColor="#7B8F8C" style={styles.input} value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} />
          <View style={styles.row}>
            {(['mild', 'moderate', 'severe'] as const).map((s) => (
              <TouchableOpacity key={s} style={[styles.chip, form.severity === s && styles.chipActive]} onPress={() => setForm({ ...form, severity: s })}>
                <Text style={[styles.chipText, form.severity === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput placeholder="Notes (optional)" placeholderTextColor="#7B8F8C" style={styles.input} value={form.notes || ''} onChangeText={(t) => setForm({ ...form, notes: t })} />
          <TouchableOpacity style={styles.addBtn} onPress={onAdd}><Text style={styles.addBtnText}>Add</Text></TouchableOpacity>
        </View>
      )}

      {/* Filters & KPIs */}
      <View style={styles.kpiRow}>
        <Kpi title="Total" value={String(kpiTotal)} />
        <Kpi title="Last 7d" value={String(kpi7d)} />
        <Kpi title="Top" value={freqSymptom === '--' ? '--' : freqSymptom} />
      </View>
      <View style={styles.filtersRow}>
        <Chip label="Today" active={timeRange === 'Today'} onPress={() => setTimeRange('Today')} />
        <Chip label="7d" active={timeRange === '7d'} onPress={() => setTimeRange('7d')} />
        <Chip label="30d" active={timeRange === '30d'} onPress={() => setTimeRange('30d')} />
        <Chip label="90d" active={timeRange === '90d'} onPress={() => setTimeRange('90d')} />
        <Chip label="All" active={timeRange === 'All'} onPress={() => setTimeRange('All')} />
      </View>
      <View style={styles.filtersRow}>
        <Chip label="All" active={sevFilter === 'All'} onPress={() => setSevFilter('All')} />
        <Chip label="Mild" active={sevFilter === 'mild'} onPress={() => setSevFilter('mild')} />
        <Chip label="Moderate" active={sevFilter === 'moderate'} onPress={() => setSevFilter('moderate')} />
        <Chip label="Severe" active={sevFilter === 'severe'} onPress={() => setSevFilter('severe')} />
        <View style={{ flex: 1 }} />
        <Chip label={viewMode} active onPress={() => setViewMode(viewMode === 'List' ? 'Timeline' : 'List')} />
      </View>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#6B8F8C" />
        <TextInput placeholder="Search symptoms" placeholderTextColor="#6B8F8C" style={styles.searchInput} value={query} onChangeText={setQuery} />
      </View>

      {viewMode === 'List' ? (
        <FlatList
          data={filtered}
          keyExtractor={(it) => String(it.symptom_id)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <CardSymptom item={item} onEdit={() => { setEditItem(item); setEditForm({ description: item.description, severity: item.severity, notes: item.notes }); }} onDelete={async () => { try { await deleteSymptom(item.symptom_id); load(); } catch { Alert.alert('Error', 'Delete failed'); } }} />
          )}
          ListEmptyComponent={<Text style={{ color: '#7B8F8C', padding: 16 }}>No symptom entries</Text>}
        />
      ) : (
        <SectionList
          sections={Object.values(groupByDate(filtered))}
          keyExtractor={(it: any) => String(it.symptom_id)}
          renderSectionHeader={({ section }: any) => <Text style={styles.sectionHeader}>{section.title}</Text>}
          renderItem={({ item }: any) => (
            <View style={{ paddingHorizontal: 16 }}>
              <CardSymptom item={item} onEdit={() => { setEditItem(item); setEditForm({ description: item.description, severity: item.severity, notes: item.notes }); }} onDelete={async () => { try { await deleteSymptom(item.symptom_id); load(); } catch { Alert.alert('Error', 'Delete failed'); } }} />
            </View>
          )}
          ListEmptyComponent={<Text style={{ color: '#7B8F8C', padding: 16 }}>No symptom entries</Text>}
        />
      )}

      {/* Edit Modal */}
      <Modal visible={!!editForm} animationType="fade" transparent onRequestClose={() => setEditForm(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit symptom</Text>
              <TouchableOpacity onPress={() => setEditForm(null)}><Ionicons name="close" size={22} color="#334B48" /></TouchableOpacity>
            </View>
            <View style={{ padding: 16 }}>
              <TextInput placeholder="Description" placeholderTextColor="#7B8F8C" style={styles.input} value={editForm?.description || ''} onChangeText={(t) => setEditForm((f) => ({ ...(f||{}), description: t }))} />
              <View style={styles.row}>
                {(['mild','moderate','severe'] as Sev[]).map((s) => (
                  <TouchableOpacity key={s} style={[styles.chip, editForm?.severity === s && styles.chipActive]} onPress={() => setEditForm((f) => ({ ...(f||{}), severity: s }))}>
                    <Text style={[styles.chipText, editForm?.severity === s && styles.chipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput placeholder="Notes" placeholderTextColor="#7B8F8C" style={styles.input} value={editForm?.notes || ''} onChangeText={(t) => setEditForm((f) => ({ ...(f||{}), notes: t }))} />
              <TouchableOpacity style={styles.addBtn} onPress={async () => { if (!editItem) return; try { await updateSymptom(editItem.symptom_id, editForm); setEditForm(null); load(); } catch { Alert.alert('Error', 'Update failed'); } }}>
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
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: { borderWidth: 1, borderColor: '#0F8A83', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: { backgroundColor: '#0F8A83' },
  chipText: { color: '#0F8A83', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
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

function CardSymptom({ item, onEdit, onDelete }: { item: any; onEdit: () => void; onDelete: () => void }) {
  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={styles.name}>{item.description}</Text>
        <SeverityBadge level={String(item.severity)} />
      </View>
      <Text style={styles.sub}>{String(item.severity).toUpperCase()} • {item.onset_date}</Text>
      {item.notes ? <Text style={styles.sub}>{item.notes}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
        <TouchableOpacity onPress={onEdit}><Text style={{ color: '#17A196', fontWeight: '700' }}>Edit</Text></TouchableOpacity>
        <TouchableOpacity onPress={onDelete}><Text style={{ color: '#D9534F', fontWeight: '700' }}>Delete</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function SeverityBadge({ level }: { level: string }) {
  const map: any = { mild: '#8BC34A', moderate: '#FFC107', severe: '#D9534F' };
  const bg = map[String(level).toLowerCase()] || '#B3CBC7';
  return <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}><Text style={{ color: '#0F3330', fontSize: 12 }}>{String(level)}</Text></View>;
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiTitle}>{title}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[{ borderWidth: 1, borderColor: '#B3CBC7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 }, active && { backgroundColor: '#E5F4F2', borderColor: '#17A196' }]}>
      <Text style={[{ color: '#334B48' }, active && { color: '#0F3330', fontWeight: '700' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function groupByDate(arr: any[]) {
  const map: Record<string, { title: string; data: any[] }> = {};
  arr.forEach((it) => {
    const d = new Date(it.onset_date || it.created_at);
    const title = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    if (!map[title]) map[title] = { title, data: [] };
    map[title].data.push(it);
  });
  return map;
}


