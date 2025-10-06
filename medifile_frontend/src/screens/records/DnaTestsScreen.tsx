import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { listDnaTests, addDnaTest } from '../../api/records';
import { useAuth } from '../../context/AuthContext';

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'All';
type Category = 'All' | 'Carrier' | 'PGx' | 'Traits' | 'Ancestry';
type Outcome = 'All' | 'Normal' | 'Variant' | 'VUS';

export default function DnaTestsScreen({ navigation }: any) {
  const { role } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ test_name: '', trait: '', interpretation: '', category: '', recorded_at: '' });
  const [query, setQuery] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('1y');
  const [category, setCategory] = useState<Category>('All');
  const [outcome, setOutcome] = useState<Outcome>('All');
  const [detailItem, setDetailItem] = useState<any | null>(null);

  const load = async () => {
    const data = await listDnaTests();
    setItems(data);
  };

  useEffect(() => { load(); }, []);

  const onAdd = async () => {
    if (!form.test_name.trim()) {
      Alert.alert('Validation', 'Test name is required');
      return;
    }
    try {
      await addDnaTest({
        test_name: form.test_name,
        trait: form.trait,
        interpretation: form.interpretation,
        category: form.category || undefined,
        recorded_at: form.recorded_at || new Date().toISOString().slice(0, 10),
      });
      setForm({ test_name: '', trait: '', interpretation: '', category: '', recorded_at: '' });
      setShowAdd(false);
      load();
    } catch (e) {
      Alert.alert('Error', 'Failed to add DNA test');
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
  function deriveOutcome(it: any): 'Normal' | 'Variant' | 'VUS' {
    const raw = String(it.outcome || it.result || it.interpretation || '').toLowerCase();
    if (raw.includes('vus') || raw.includes('uncertain')) return 'VUS';
    if (raw.includes('variant') || raw.includes('detected') || raw.includes('positive')) return 'Variant';
    return 'Normal';
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = items.filter((x: any) => inRange(x.recorded_at || x.created_at || new Date(), timeRange));
    if (category !== 'All') arr = arr.filter((x: any) => String(x.category || '').toLowerCase() === category.toLowerCase());
    if (outcome !== 'All') arr = arr.filter((x: any) => deriveOutcome(x) === outcome);
    if (q) arr = arr.filter((x: any) => `${x.test_name} ${x.trait || ''} ${x.interpretation || ''}`.toLowerCase().includes(q));
    return arr.sort((a: any, b: any) => new Date(b.recorded_at || b.created_at).getTime() - new Date(a.recorded_at || a.created_at).getTime());
  }, [items, query, timeRange, category, outcome]);

  const kpiTotal = filtered.length;
  const kpiVariants = useMemo(() => filtered.filter((x: any) => deriveOutcome(x) === 'Variant').length, [filtered]);
  const kpiVUS = useMemo(() => filtered.filter((x: any) => deriveOutcome(x) === 'VUS').length, [filtered]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={22} color="#0F8A83" /></TouchableOpacity>
        <Text style={styles.title}>DNA Tests</Text>
        {role === 'doctor' ? (
          <TouchableOpacity onPress={() => setShowAdd(s => !s)}>
            <Ionicons name={showAdd ? 'close' : 'add'} size={22} color="#0F8A83" />
          </TouchableOpacity>
        ) : (<View style={{ width: 22 }} />)}
      </View>

      {role === 'doctor' && showAdd && (
        <View style={styles.formCard}>
          <TextInput placeholder="Test name" placeholderTextColor="#7B8F8C" style={styles.input} value={form.test_name} onChangeText={(t) => setForm({ ...form, test_name: t })} />
          <TextInput placeholder="Trait" placeholderTextColor="#7B8F8C" style={styles.input} value={form.trait} onChangeText={(t) => setForm({ ...form, trait: t })} />
          <TextInput placeholder="Interpretation" placeholderTextColor="#7B8F8C" style={styles.input} value={form.interpretation} onChangeText={(t) => setForm({ ...form, interpretation: t })} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['Carrier','PGx','Traits','Ancestry'] as Category[]).filter(c => c !== 'All').map((c) => (
              <TouchableOpacity key={c} onPress={() => setForm({ ...form, category: c })} style={[styles.chip, form.category === c && styles.chipActive]}>
                <Text style={[styles.chipText, form.category === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput placeholder="Date (YYYY-MM-DD)" placeholderTextColor="#7B8F8C" style={styles.input} value={form.recorded_at} onChangeText={(t) => setForm({ ...form, recorded_at: t })} />
          <TouchableOpacity style={styles.addBtn} onPress={onAdd}><Text style={styles.addBtnText}>Add</Text></TouchableOpacity>
        </View>
      )}

      {/* KPIs */}
      <View style={styles.kpiRow}>
        <Kpi title="Total" value={String(kpiTotal)} />
        <Kpi title="Variants" value={String(kpiVariants)} accent="#D9534F" />
        <Kpi title="VUS" value={String(kpiVUS)} accent="#E6A600" />
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        {(['7d','30d','90d','1y','All'] as TimeRange[]).map((t) => (
          <Chip key={t} label={t} active={timeRange === t} onPress={() => setTimeRange(t)} />
        ))}
      </View>
      <View style={styles.filtersRow}>
        {(['All','Carrier','PGx','Traits','Ancestry'] as Category[]).map((c) => (
          <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
        ))}
      </View>
      <View style={styles.filtersRow}>
        {(['All','Normal','Variant','VUS'] as Outcome[]).map((o) => (
          <Chip key={o} label={o} active={outcome === o} onPress={() => setOutcome(o)} />
        ))}
      </View>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#6B8F8C" />
        <TextInput placeholder="Search DNA reports" placeholderTextColor="#6B8F8C" style={styles.searchInput} value={query} onChangeText={setQuery} />
      </View>

      {/* Timeline grouping */}
      <SectionList
        sections={Object.values(groupByDate(filtered))}
        keyExtractor={(it: any) => String(it.dna_test_id)}
        renderSectionHeader={({ section }: any) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }: any) => (
          <View style={{ paddingHorizontal: 16 }}>
            <DnaCard item={item} onPress={() => setDetailItem(item)} outcome={deriveOutcome(item)} />
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#7B8F8C', padding: 16 }}>No DNA tests</Text>}
      />

      {/* Detail Modal */}
      <Modal visible={!!detailItem} animationType="slide" transparent onRequestClose={() => setDetailItem(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{detailItem?.test_name}</Text>
              <TouchableOpacity onPress={() => setDetailItem(null)}><Ionicons name="close" size={22} color="#334B48" /></TouchableOpacity>
            </View>
            <View style={{ padding: 16 }}>
              {detailItem?.trait ? <Row label="Trait" value={detailItem.trait} /> : null}
              <Row label="Outcome" value={deriveOutcome(detailItem)} />
              {detailItem?.category ? <Row label="Category" value={detailItem.category} /> : null}
              <Row label="Date" value={detailItem?.recorded_at || '--'} />
              {detailItem?.interpretation ? <Row label="Interpretation" value={detailItem.interpretation} /> : null}
              {detailItem?.genes ? <Row label="Genes/Variants" value={String(detailItem.genes)} /> : null}
              {detailItem?.sources ? <Row label="Sources" value={String(detailItem.sources)} /> : null}
              <Text style={{ color: '#7B8F8C', marginTop: 10 }}>These reports are informational and not diagnostic. Consult a clinician for medical advice.</Text>
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
  chip: { borderWidth: 1, borderColor: '#B3CBC7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  chipActive: { backgroundColor: '#E5F4F2', borderColor: '#17A196' },
  chipText: { color: '#334B48' },
  chipTextActive: { color: '#0F3330', fontWeight: '700' },
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
    <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
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

function DnaCard({ item, onPress, outcome }: { item: any; onPress: () => void; outcome: 'Normal' | 'Variant' | 'VUS' }) {
  const badgeColor = outcome === 'Variant' ? '#D9534F' : outcome === 'VUS' ? '#E6A600' : '#17A196';
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={styles.name}>{item.test_name}</Text>
        <View style={{ backgroundColor: badgeColor, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
          <Text style={{ color: '#fff', fontSize: 12 }}>{outcome}</Text>
        </View>
      </View>
      <Text style={styles.sub}>{item.category || '—'} • {item.recorded_at}</Text>
      {item.trait ? <Text style={styles.sub}>Trait: {item.trait}</Text> : null}
      {item.interpretation ? <Text style={styles.sub}>{item.interpretation}</Text> : null}
    </TouchableOpacity>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ paddingVertical: 10 }}>
      <Text style={{ color: '#5C7A76' }}>{label}</Text>
      <Text style={{ color: '#334B48', fontWeight: '600' }}>{value}</Text>
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


