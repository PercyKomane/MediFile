import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, SectionList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMyMedicalHistory } from '../../api/records';

type Category = 'All' | 'Food' | 'Drug' | 'Environmental' | 'Other';
type Severity = 'All' | 'Mild' | 'Moderate' | 'Severe';

export default function AllergiesScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [severity, setSeverity] = useState<Severity>('All');
  const [detail, setDetail] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const data = await fetchMyMedicalHistory();
      const allergies = data.filter((r) => String(r.diagnosis || '').toLowerCase().includes('allerg'));
      setItems(allergies);
    })();
  }, []);

  function deriveCategory(name: string): Exclude<Category, 'All'> {
    const n = name.toLowerCase();
    if (/peanut|tree nut|nut|shellfish|fish|milk|egg|soy|wheat|gluten|sesame/.test(n)) return 'Food';
    if (/penicillin|amoxicillin|ibuprofen|aspirin|sulfa|morphine|codeine|drug|medication/.test(n)) return 'Drug';
    if (/pollen|dust|mite|grass|hay|ragweed|mold|animal|cat|dog/.test(n)) return 'Environmental';
    return 'Other';
  }

  function deriveSeverity(text: string): Exclude<Severity, 'All'> {
    const t = text.toLowerCase();
    if (/anaphylaxis|epipen|epi-pen|severe/.test(t)) return 'Severe';
    if (/moderate/.test(t)) return 'Moderate';
    if (/mild/.test(t)) return 'Mild';
    // default: treat unknown as Moderate to avoid underplaying
    return 'Moderate';
  }

  const enriched = useMemo(() => {
    return items.map((it) => {
      const diag = String(it.diagnosis || '');
      const cat = deriveCategory(diag);
      const sev = deriveSeverity(`${diag} ${it.treatment || ''}`);
      return { ...it, _category: cat, _severity: sev };
    });
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = enriched;
    if (category !== 'All') arr = arr.filter((a) => a._category === category);
    if (severity !== 'All') arr = arr.filter((a) => a._severity === severity);
    if (q) arr = arr.filter((a) => `${a.diagnosis} ${a.treatment || ''}`.toLowerCase().includes(q));
    return arr.sort((a, b) => new Date(b.date_recorded || b.created_at).getTime() - new Date(a.date_recorded || a.created_at).getTime());
  }, [enriched, category, severity, query]);

  const kpiTotal = filtered.length;
  const kpiSevere = useMemo(() => filtered.filter((a) => a._severity === 'Severe').length, [filtered]);
  const kpiDrug = useMemo(() => filtered.filter((a) => a._category === 'Drug').length, [filtered]);
  const kpiLast = useMemo(() => (filtered[0]?.date_recorded ? new Date(filtered[0].date_recorded).toLocaleDateString() : '--'), [filtered]);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: '#0F8A83' }}>{'< Back'}</Text></TouchableOpacity>
      <Text style={styles.title}>Allergies</Text>

      {/* KPIs */}
      <View style={styles.kpiRow}>
        <Kpi title="Total" value={String(kpiTotal)} />
        <Kpi title="Severe" value={String(kpiSevere)} accent="#D9534F" />
        <Kpi title="Drug" value={String(kpiDrug)} />
        <Kpi title="Last reaction" value={kpiLast} />
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        {(['All','Food','Drug','Environmental','Other'] as Category[]).map((c) => (
          <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
        ))}
      </View>
      <View style={styles.filtersRow}>
        {(['All','Mild','Moderate','Severe'] as Severity[]).map((s) => (
          <Chip key={s} label={s} active={severity === s} onPress={() => setSeverity(s)} />
        ))}
      </View>
      <View style={styles.searchRow}>
        <TextInput placeholder="Search allergies" placeholderTextColor="#6B8F8C" style={styles.searchInput} value={query} onChangeText={setQuery} />
      </View>

      {/* Grouped timeline */}
      <SectionList
        sections={Object.values(groupByDate(filtered))}
        keyExtractor={(it: any) => String(it.record_id)}
        renderSectionHeader={({ section }: any) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }: any) => (
          <View style={{ paddingHorizontal: 0 }}>
            <AllergyCard item={item} onPress={() => setDetail(item)} />
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#7B8F8C' }}>No allergy records</Text>}
        contentContainerStyle={{ paddingBottom: 12 }}
      />

      {/* Detail */}
      <Modal visible={!!detail} animationType="slide" transparent onRequestClose={() => setDetail(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{detail?.diagnosis}</Text>
              <TouchableOpacity onPress={() => setDetail(null)}><Text style={{ color: '#334B48', fontWeight: '800' }}>✕</Text></TouchableOpacity>
            </View>
            <View style={{ padding: 16 }}>
              <Row label="Category" value={deriveCategory(String(detail?.diagnosis || '') )} />
              <Row label="Severity" value={deriveSeverity(`${detail?.diagnosis || ''} ${detail?.treatment || ''}`)} />
              <Row label="Last reaction" value={detail?.date_recorded || '--'} />
              {detail?.treatment ? <Row label="Notes / Plan" value={detail.treatment} /> : null}
              <Text style={{ color: '#5C7A76', marginTop: 8, marginBottom: 6 }}>Avoidance tips</Text>
              <Text style={{ color: '#334B48' }}>{tipsForCategory(deriveCategory(String(detail?.diagnosis || '')))}</Text>
              <TouchableOpacity onPress={() => Alert.alert('Share', 'Emergency card sharing coming soon')} style={{ marginTop: 12 }}>
                <Text style={{ color: '#17A196', fontWeight: '700' }}>Share emergency card</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginVertical: 12 },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  kpiCard: { flex: 1, backgroundColor: '#F4FBFA', borderColor: '#CCE7E3', borderWidth: 1, borderRadius: 10, padding: 10 },
  kpiTitle: { color: '#5C7A76', fontSize: 12 },
  kpiValue: { color: '#0F3330', fontSize: 18, fontWeight: '800', marginTop: 2 },
  filtersRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  chip: { borderWidth: 1, borderColor: '#B3CBC7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  chipActive: { backgroundColor: '#E5F4F2', borderColor: '#17A196' },
  chipText: { color: '#334B48' },
  chipTextActive: { color: '#0F3330', fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3FAF9', borderWidth: 1, borderColor: '#E8F3F1', borderRadius: 24, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  searchInput: { flex: 1, color: '#0F3330' },
  card: { backgroundColor: '#F3FAF9', padding: 14, borderRadius: 10, marginBottom: 10 },
  name: { fontWeight: '700', marginBottom: 4 },
  sub: { color: '#7B8F8C' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 12 },
  sectionHeader: { color: '#5C7A76', fontWeight: '700', marginTop: 6, marginBottom: 4 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEF4F3' },
  modalTitle: { color: '#0F3330', fontWeight: '800' },
});

function Kpi({ title, value, accent }: { title: string; value: string; accent?: string }) {
  return (
    <View style={[styles.kpiCard, accent ? { borderLeftWidth: 3, borderLeftColor: accent } : null]}>
      <Text style={styles.kpiTitle}>{title}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function AllergyCard({ item, onPress }: { item: any; onPress: () => void }) {
  const badgeColor = item._severity === 'Severe' ? '#D9534F' : item._severity === 'Moderate' ? '#E6A600' : '#17A196';
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={styles.name}>{item.diagnosis}</Text>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}><Text style={styles.badgeText}>{item._severity}</Text></View>
      </View>
      <Text style={styles.sub}>{item._category} • {item.date_recorded}</Text>
      {item.treatment ? <Text style={styles.sub}>{item.treatment}</Text> : null}
    </TouchableOpacity>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ paddingVertical: 8 }}>
      <Text style={{ color: '#5C7A76' }}>{label}</Text>
      <Text style={{ color: '#334B48', fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

function groupByDate(arr: any[]) {
  const map: Record<string, { title: string; data: any[] }> = {};
  arr.forEach((it) => {
    const d = new Date(it.date_recorded || it.created_at);
    const title = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    if (!map[title]) map[title] = { title, data: [] };
    map[title].data.push(it);
  });
  return map;
}

function tipsForCategory(cat: Exclude<Category, 'All'>): string {
  switch (cat) {
    case 'Food': return 'Always read labels, avoid cross-contamination, carry prescribed meds (e.g., epinephrine).';
    case 'Drug': return 'Inform healthcare providers, wear medical ID, confirm alternatives with your doctor.';
    case 'Environmental': return 'Minimize exposure (pollen counts), use protective covers, consider HEPA filtration.';
    default: return 'Avoid known triggers and keep your action plan updated with your clinician.';
  }
}


