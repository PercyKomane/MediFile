import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Modal, SectionList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchMyMedicalHistory } from '../../api/records';

export default function DiagnosesScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'chronic' | 'resolved'>('all');
  const [sortKey, setSortKey] = useState<'recent' | 'diagnosed' | 'severity'>('recent');
  const [timeline, setTimeline] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [detail, setDetail] = useState<any | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    (async () => {
      const data = await fetchMyMedicalHistory();
      setItems(data);
    })();
  }, []);

  const classify = (record: any) => {
    const name = String(record?.diagnosis || '').toLowerCase();
    const treatment = String(record?.treatment || '').toLowerCase();
    const dateStr = record?.date_recorded;
    const date = dateStr ? new Date(dateStr) : null;
    const isChronic = /diabetes|hypertension|asthma|copd|hiv|cancer|arthritis|chronic/.test(name);
    const isResolved = /resolve|resolved|recovered|discharge/.test(treatment);
    let status: 'chronic' | 'resolved' | 'active' = 'active';
    if (isChronic) status = 'chronic';
    if (isResolved) status = 'resolved';
    // Heuristic: very old non-chronic may be resolved
    if (!isChronic && !isResolved && date && (Date.now() - date.getTime()) > 365 * 24 * 60 * 60 * 1000) {
      status = 'resolved';
    }
    const severity: 'mild' | 'moderate' | 'severe' = /severe|acute|critical/.test(name + ' ' + treatment)
      ? 'severe'
      : /moderate|flare/.test(name + ' ' + treatment)
      ? 'moderate'
      : 'mild';
    return { status, severity };
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = items
      .map((r) => ({ ...r, _meta: classify(r) }))
      .filter((r) =>
        !q || String(r.diagnosis || '').toLowerCase().includes(q) || String(r.treatment || '').toLowerCase().includes(q)
      );
    if (filter !== 'all') arr = arr.filter((r) => r._meta.status === filter);
    if (sortKey === 'recent') {
      arr.sort((a, b) => new Date(b.date_recorded || 0).getTime() - new Date(a.date_recorded || 0).getTime());
    } else if (sortKey === 'diagnosed') {
      arr.sort((a, b) => new Date(a.date_recorded || 0).getTime() - new Date(b.date_recorded || 0).getTime());
    } else if (sortKey === 'severity') {
      const rank = { severe: 0, moderate: 1, mild: 2 } as any;
      arr.sort((a, b) => rank[a._meta.severity] - rank[b._meta.severity]);
    }
    return arr;
  }, [items, query, filter, sortKey]);

  const sections = useMemo(() => {
    const groups: Record<string, any[]> = { Active: [], Chronic: [], Resolved: [] };
    filtered.forEach((r) => {
      if (r._meta.status === 'chronic') groups['Chronic'].push(r);
      else if (r._meta.status === 'resolved') groups['Resolved'].push(r);
      else groups['Active'].push(r);
    });
    return [
      { key: 'Active', items: groups['Active'] },
      { key: 'Chronic', items: groups['Chronic'] },
      { key: 'Resolved', items: groups['Resolved'] },
    ];
  }, [filtered]);

  const counts = useMemo(() => ({
    total: filtered.length,
    active: filtered.filter((r) => r._meta.status === 'active').length,
    chronic: filtered.filter((r) => r._meta.status === 'chronic').length,
    resolved: filtered.filter((r) => r._meta.status === 'resolved').length,
  }), [filtered]);

  const StatusChip = ({ label, color }: { label: string; color: string }) => (
    <View style={[styles.chip, { backgroundColor: color + '15', borderColor: color }]}> 
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );

  const renderCard = (item: any) => {
    const { status, severity } = item._meta;
    const statusColor = status === 'active' ? '#17A196' : status === 'chronic' ? '#8E44AD' : '#7B8F8C';
    const sevColor = severity === 'severe' ? '#E53935' : severity === 'moderate' ? '#FB8C00' : '#43A047';
    return (
      <TouchableOpacity onPress={() => setDetail(item)} activeOpacity={0.8}>
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.name}>{item.diagnosis}</Text>
            <StatusChip label={status.charAt(0).toUpperCase() + status.slice(1)} color={statusColor} />
          </View>
          {item.treatment ? <Text style={styles.sub}>{item.treatment}</Text> : null}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <Text style={styles.sub}>Since {item.date_recorded || '—'}</Text>
            <View style={styles.severityBarWrap}>
              <View style={[styles.severityBarFill, { backgroundColor: sevColor, width: severity === 'severe' ? '100%' : severity === 'moderate' ? '66%' : '33%' }]} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>Add note</Text></TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>Attach</Text></TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>View meds</Text></TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const displaySections = useMemo(() => sections.map((s) => ({
    title: s.key,
    data: collapsed[s.key] ? [] : s.items,
  })), [sections, collapsed]);

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={displaySections as any}
        keyExtractor={(it: any) => String(it.record_id)}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        ListHeaderComponent={
          <View>
            <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: '#0F8A83' }}>{'< Back'}</Text></TouchableOpacity>
            <Text style={styles.title}>Diagnoses / Conditions</Text>
            <View style={styles.insightsRow}>
              <View style={[styles.insight, { backgroundColor: '#E5F4F2' }]}><Text style={styles.insightNum}>{counts.total}</Text><Text style={styles.insightLabel}>Total</Text></View>
              <View style={[styles.insight, { backgroundColor: '#EAF7F6' }]}><Text style={styles.insightNum}>{counts.active}</Text><Text style={styles.insightLabel}>Active</Text></View>
              <View style={[styles.insight, { backgroundColor: '#F2E9F7' }]}><Text style={styles.insightNum}>{counts.chronic}</Text><Text style={styles.insightLabel}>Chronic</Text></View>
              <View style={[styles.insight, { backgroundColor: '#EEF2F3' }]}><Text style={styles.insightNum}>{counts.resolved}</Text><Text style={styles.insightLabel}>Resolved</Text></View>
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search conditions, treatments..."
              placeholderTextColor="#93A3A0"
              style={styles.search}
            />
            <View style={styles.filterRow}>
              {(['all','active','chronic','resolved'] as const).map((f) => (
                <TouchableOpacity key={f} style={[styles.filterChip, filter===f && styles.filterChipActive]} onPress={() => setFilter(f)}>
                  <Text style={[styles.filterChipText, filter===f && styles.filterChipTextActive]}>{f.charAt(0).toUpperCase()+f.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.filterRow, { marginTop: 6 }]}>
              {(['recent','diagnosed','severity'] as const).map((s) => (
                <TouchableOpacity key={s} style={[styles.smallChip, sortKey===s && styles.smallChipActive]} onPress={() => setSortKey(s)}>
                  <Text style={[styles.smallChipText, sortKey===s && styles.smallChipTextActive]}>Sort: {s}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.smallChip, timeline && styles.smallChipActive]} onPress={() => setTimeline(!timeline)}>
                <Text style={[styles.smallChipText, timeline && styles.smallChipTextActive]}>{timeline ? 'List view' : 'Timeline'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => {
          const secKey = section.title as string;
          const count = sections.find((s) => s.key === secKey)?.items.length || 0;
          return (
            <TouchableOpacity onPress={() => setCollapsed((c) => ({ ...c, [secKey]: !c[secKey] }))} style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{secKey}</Text>
              <Text style={styles.sectionCount}>{count}</Text>
            </TouchableOpacity>
          );
        }}
        renderItem={({ item, index, section }) => (
          timeline ? (
            <View style={styles.timelineWrap}>
              <View style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>{renderCard(item)}</View>
                {index < (section.data as any[]).length - 1 && <View style={styles.timelineLine} />}
              </View>
            </View>
          ) : (
            renderCard(item)
          )
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No diagnoses yet</Text>
            <Text style={styles.emptyText}>Add your first condition to build your health record.</Text>
            <TouchableOpacity style={styles.primaryBtn}><Text style={styles.primaryBtnText}>Add condition</Text></TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 24 }]}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => setDetail(null)}>
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{detail?.diagnosis}</Text>
            {detail?.treatment ? <Text style={styles.sheetSub}>{detail?.treatment}</Text> : null}
            <Text style={styles.sheetMeta}>Diagnosed: {detail?.date_recorded || '—'}</Text>
            <View style={{ height: 10 }} />
            <TouchableOpacity style={styles.primaryBtn}><Text style={styles.primaryBtnText}>Add note</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryBtn, { marginTop: 8 }]} onPress={() => setDetail(null)}><Text style={styles.secondaryBtnText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginVertical: 12, color: '#334B48' },
  search: { backgroundColor: '#F3FAF9', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#334B48' },
  insightsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  insight: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
  insightNum: { fontSize: 18, fontWeight: '700', color: '#334B48' },
  insightLabel: { color: '#5C7A76', fontSize: 12 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  filterChip: { borderWidth: 1, borderColor: '#0F8A83', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  filterChipActive: { backgroundColor: '#0F8A83' },
  filterChipText: { color: '#0F8A83', fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  smallChip: { borderWidth: 1, borderColor: '#CCE7E3', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#F3FAF9' },
  smallChipActive: { borderColor: '#0F8A83', backgroundColor: '#E8F3F1' },
  smallChipText: { color: '#334B48', fontSize: 12, fontWeight: '500' },
  smallChipTextActive: { color: '#0F8A83' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EAF7F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 6 },
  sectionTitle: { color: '#334B48', fontWeight: '700' },
  sectionCount: { color: '#5C7A76', fontSize: 12 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginVertical: 8, borderWidth: 1, borderColor: '#E3EFEF' },
  name: { fontWeight: '700', marginBottom: 4, color: '#334B48' },
  sub: { color: '#7B8F8C' },
  chip: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  chipText: { fontSize: 12, fontWeight: '600' },
  severityBarWrap: { width: 72, height: 6, backgroundColor: '#E7F2F1', borderRadius: 3, overflow: 'hidden' },
  severityBarFill: { height: 6, borderRadius: 3 },
  actionBtn: { backgroundColor: '#EAF7F6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  actionBtnText: { color: '#0F8A83', fontWeight: '600', fontSize: 12 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyTitle: { color: '#334B48', fontWeight: '700', fontSize: 16, marginBottom: 6 },
  emptyText: { color: '#7B8F8C', marginBottom: 10 },
  primaryBtn: { backgroundColor: '#0F8A83', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { borderWidth: 1, borderColor: '#0F8A83', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' },
  secondaryBtnText: { color: '#0F8A83', fontWeight: '700' },
  fab: { position: 'absolute', right: 16, backgroundColor: '#17A196', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 28, marginTop: -2 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 24 },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#DDE9E7', borderRadius: 2, alignSelf: 'center', marginBottom: 10 },
  sheetTitle: { color: '#334B48', fontWeight: '700', fontSize: 18 },
  sheetSub: { color: '#7B8F8C', marginTop: 4 },
  sheetMeta: { color: '#5C7A76', marginTop: 8, fontSize: 12 },
  timelineWrap: { paddingLeft: 10, marginTop: 4 },
  timelineItem: { position: 'relative', paddingLeft: 16 },
  timelineDot: { position: 'absolute', left: 0, top: 20, width: 8, height: 8, borderRadius: 4, backgroundColor: '#17A196' },
  timelineLine: { position: 'absolute', left: 3.5, top: 28, bottom: -12, width: 1, backgroundColor: '#CDE5E2' },
  timelineContent: { marginLeft: 10 },
});


