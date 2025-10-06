import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { listPatientMedications, addPatientMedication, updatePatientMedication, deletePatientMedication } from '../../api/records';

type StatusFilter = 'All' | 'Active' | 'Inactive';
type SortBy = 'Recent' | 'Name';

export default function MedicationsScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('All');
  const [sortBy, setSortBy] = useState<SortBy>('Recent');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<{ name: string; dosage: string; frequency: string; is_active?: boolean; start_date?: string }>({ name: '', dosage: '', frequency: '', is_active: true, start_date: '' });
  const [detailItem, setDetailItem] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<{ name?: string; dosage?: string; frequency?: string; is_active?: boolean } | null>(null);
  const [adherence, setAdherence] = useState<Record<string, 'taken' | 'skipped' | 'snoozed' | undefined>>({});

  const load = async () => {
    const data = await listPatientMedications();
    setItems(data);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = items.filter((m: any) => (status === 'All' ? true : status === 'Active' ? !!m.is_active : !m.is_active));
    if (q) arr = arr.filter((m: any) => `${m.name} ${m.dosage || ''} ${m.frequency || ''}`.toLowerCase().includes(q));
    if (sortBy === 'Name') arr = arr.slice().sort((a: any, b: any) => String(a.name || '').localeCompare(String(b.name || '')));
    else arr = arr.slice().sort((a: any, b: any) => Number(b.med_record_id || 0) - Number(a.med_record_id || 0));
    return arr;
  }, [items, query, status, sortBy]);

  const kpiActive = useMemo(() => items.filter((m: any) => !!m.is_active).length, [items]);
  const kpiTotal = items.length;
  const kpiTakenToday = useMemo(() => Object.values(adherence).filter((s) => s === 'taken').length, [adherence]);

  const onAdd = async () => {
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Name is required');
      return;
    }
    try {
      await addPatientMedication({
        name: form.name,
        dosage: form.dosage,
        frequency: form.frequency,
        start_date: form.start_date || new Date().toISOString().slice(0, 10),
        is_active: form.is_active !== false,
      });
      setForm({ name: '', dosage: '', frequency: '', is_active: true, start_date: '' });
      setShowAdd(false);
      load();
    } catch (e) {
      Alert.alert('Error', 'Failed to add medication');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={22} color="#0F8A83" /></TouchableOpacity>
        <Text style={styles.title}>Medications & Supplements</Text>
        <TouchableOpacity onPress={() => setShowAdd(s => !s)}>
          <Ionicons name={showAdd ? 'close' : 'add'} size={22} color="#0F8A83" />
        </TouchableOpacity>
      </View>
      {/* KPIs */}
      <View style={styles.kpiRow}>
        <Kpi title="Active" value={String(kpiActive)} />
        <Kpi title="Total" value={String(kpiTotal)} />
        <Kpi title="Taken today" value={String(kpiTakenToday)} accent="#17A196" />
      </View>

      {/* Filters & Search */}
      <View style={styles.filtersRow}>
        <Chip label="All" active={status === 'All'} onPress={() => setStatus('All')} />
        <Chip label="Active" active={status === 'Active'} onPress={() => setStatus('Active')} />
        <Chip label="Inactive" active={status === 'Inactive'} onPress={() => setStatus('Inactive')} />
        <View style={{ flex: 1 }} />
        <Chip label="Recent" active={sortBy === 'Recent'} onPress={() => setSortBy('Recent')} />
        <Chip label="Name" active={sortBy === 'Name'} onPress={() => setSortBy('Name')} />
      </View>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#6B8F8C" />
        <TextInput
          placeholder="Search medications"
          placeholderTextColor="#6B8F8C"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {showAdd && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add medication</Text>
          <TextInput placeholder="Name" placeholderTextColor="#7B8F8C" style={styles.input} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
          <TextInput placeholder="Dosage (e.g., 500mg)" placeholderTextColor="#7B8F8C" style={styles.input} value={form.dosage} onChangeText={(t) => setForm({ ...form, dosage: t })} />
          <TextInput placeholder="Frequency (e.g., 2x/day)" placeholderTextColor="#7B8F8C" style={styles.input} value={form.frequency} onChangeText={(t) => setForm({ ...form, frequency: t })} />
          <View style={styles.rowBetween}>
            <Text style={styles.formLabel}>Active</Text>
            <TouchableOpacity onPress={() => setForm({ ...form, is_active: !form.is_active })}><Text style={[styles.toggle, form.is_active ? styles.toggleOn : styles.toggleOff]}>{form.is_active ? 'Yes' : 'No'}</Text></TouchableOpacity>
          </View>
          <TextInput placeholder="Start date (YYYY-MM-DD)" placeholderTextColor="#7B8F8C" style={styles.input} value={form.start_date} onChangeText={(t) => setForm({ ...form, start_date: t })} />
          <TouchableOpacity style={styles.addBtn} onPress={onAdd}><Text style={styles.addBtnText}>Add</Text></TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(it) => String(it.med_record_id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setDetailItem(item)}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{item.name}</Text>
              <StatusChip active={!!item.is_active} />
            </View>
            <Text style={styles.sub}>{[item.dosage, item.frequency].filter(Boolean).join(' • ')}</Text>
            <View style={styles.actionsRow}>
              <QuickBtn label="Taken" icon="checkmark" color="#17A196" onPress={() => setAdherence((m) => ({ ...m, [String(item.med_record_id)]: 'taken' }))} active={adherence[String(item.med_record_id)] === 'taken'} />
              <QuickBtn label="Skip" icon="close" color="#D9534F" onPress={() => setAdherence((m) => ({ ...m, [String(item.med_record_id)]: 'skipped' }))} active={adherence[String(item.med_record_id)] === 'skipped'} />
              <QuickBtn label="Snooze" icon="time" color="#E6A600" onPress={() => setAdherence((m) => ({ ...m, [String(item.med_record_id)]: 'snoozed' }))} active={adherence[String(item.med_record_id)] === 'snoozed'} />
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => navigation.navigate('Pharmacy', { search: item.name })}>
                <Text style={styles.link}>Refill</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color: '#7B8F8C', padding: 16 }}>No medications</Text>}
      />

      {/* Detail Modal */}
      <Modal visible={!!detailItem} animationType="slide" transparent onRequestClose={() => setDetailItem(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{detailItem?.name}</Text>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <TouchableOpacity onPress={() => setEditForm({ name: detailItem?.name, dosage: detailItem?.dosage, frequency: detailItem?.frequency, is_active: !!detailItem?.is_active })}>
                  <Ionicons name="pencil" size={20} color="#0F8A83" />
                </TouchableOpacity>
                <TouchableOpacity onPress={async () => { try { await deletePatientMedication(detailItem.med_record_id); setDetailItem(null); load(); } catch { Alert.alert('Error', 'Failed to delete'); } }}>
                  <Ionicons name="trash" size={20} color="#D9534F" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDetailItem(null)}><Ionicons name="close" size={22} color="#334B48" /></TouchableOpacity>
              </View>
            </View>
            <ScrollView>
              <Row label="Dosage" value={detailItem?.dosage || '--'} />
              <Row label="Frequency" value={detailItem?.frequency || '--'} />
              <Row label="Status" value={detailItem?.is_active ? 'Active' : 'Inactive'} />
              <Row label="Start date" value={detailItem?.start_date || '--'} />
              {detailItem?.instructions ? <Row label="Instructions" value={detailItem.instructions} /> : null}
              {detailItem?.notes ? <Row label="Notes" value={detailItem.notes} /> : null}
              <View style={{ padding: 16 }}>
                <Text style={{ color: '#5C7A76', marginBottom: 8 }}>Adherence (last 7 days)</Text>
                <AdherenceHeatmap keys={[0,1,2,3,4,5,6].map((d) => String(d))} values={Object.values(adherence)} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={!!editForm} animationType="fade" transparent onRequestClose={() => setEditForm(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: 16 }]}> 
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit medication</Text>
              <TouchableOpacity onPress={() => setEditForm(null)}><Ionicons name="close" size={22} color="#334B48" /></TouchableOpacity>
            </View>
            <View style={{ padding: 16 }}>
              <TextInput placeholder="Name" placeholderTextColor="#7B8F8C" style={styles.input} value={editForm?.name || ''} onChangeText={(t) => setEditForm((f) => ({ ...(f||{}), name: t }))} />
              <TextInput placeholder="Dosage" placeholderTextColor="#7B8F8C" style={styles.input} value={editForm?.dosage || ''} onChangeText={(t) => setEditForm((f) => ({ ...(f||{}), dosage: t }))} />
              <TextInput placeholder="Frequency" placeholderTextColor="#7B8F8C" style={styles.input} value={editForm?.frequency || ''} onChangeText={(t) => setEditForm((f) => ({ ...(f||{}), frequency: t }))} />
              <View style={styles.rowBetween}>
                <Text style={styles.formLabel}>Active</Text>
                <TouchableOpacity onPress={() => setEditForm((f) => ({ ...(f||{}), is_active: !(f?.is_active !== false) }))}><Text style={[styles.toggle, (editForm?.is_active !== false) ? styles.toggleOn : styles.toggleOff]}>{(editForm?.is_active !== false) ? 'Yes' : 'No'}</Text></TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={async () => { if (!detailItem) return; try { await updatePatientMedication(detailItem.med_record_id, editForm); setEditForm(null); setDetailItem(null); load(); } catch { Alert.alert('Error', 'Failed to update'); } }}>
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
  kpiRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  kpiCard: { flex: 1, backgroundColor: '#F4FBFA', borderColor: '#CCE7E3', borderWidth: 1, borderRadius: 10, padding: 10 },
  kpiTitle: { color: '#5C7A76', fontSize: 12 },
  kpiValue: { color: '#0F3330', fontSize: 18, fontWeight: '800', marginTop: 2 },
  filtersRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginTop: 10 },
  chip: { borderWidth: 1, borderColor: '#B3CBC7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  chipActive: { backgroundColor: '#E5F4F2', borderColor: '#17A196' },
  chipText: { color: '#334B48' },
  chipTextActive: { color: '#0F3330', fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3FAF9', borderWidth: 1, borderColor: '#E8F3F1', margin: 16, borderRadius: 24, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, color: '#0F3330', marginLeft: 6 },
  formCard: { backgroundColor: '#F3FAF9', borderWidth: 1, borderColor: '#E8F3F1', marginHorizontal: 16, padding: 12, borderRadius: 12 },
  formTitle: { color: '#334B48', fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#CCE7E3', borderRadius: 8, padding: 10, color: '#334B48', marginBottom: 8, backgroundColor: '#fff' },
  addBtn: { backgroundColor: '#0F8A83', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8F3F1', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontWeight: '700', marginBottom: 2, color: '#334B48' },
  sub: { color: '#7B8F8C' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  quickBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, borderColor: '#CCE7E3' },
  quickBtnActive: { backgroundColor: '#F0FFFD', borderColor: '#17A196' },
  link: { color: '#17A196', fontWeight: '700' },
  statusChip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  statusActive: { borderColor: '#17A196', backgroundColor: '#E5F4F2' },
  statusInactive: { borderColor: '#B3CBC7', backgroundColor: '#F6F8F8' },
  statusText: { color: '#0F3330', fontSize: 12 },
  toggle: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  toggleOn: { borderColor: '#17A196', backgroundColor: '#E5F4F2', color: '#0F3330' },
  toggleOff: { borderColor: '#B3CBC7', backgroundColor: '#F6F8F8', color: '#334B48' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEF4F3' },
  modalTitle: { color: '#0F3330', fontWeight: '800' },
  rowLabel: { color: '#5C7A76' },
  rowValue: { color: '#334B48', fontWeight: '600' },
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

function StatusChip({ active }: { active: boolean }) {
  return (
    <View style={[styles.statusChip, active ? styles.statusActive : styles.statusInactive]}>
      <Text style={styles.statusText}>{active ? 'Active' : 'Inactive'}</Text>
    </View>
  );
}

function QuickBtn({ label, icon, color, onPress, active }: { label: string; icon: any; color: string; onPress: () => void; active?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.quickBtn, active && styles.quickBtnActive]}> 
      <Ionicons name={icon} size={14} color={color} />
      <Text style={{ color: '#334B48', fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F2F5F4' }}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function AdherenceHeatmap({ keys, values }: { keys: string[]; values: (string | undefined)[] }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {keys.map((k, idx) => {
        const v = values[idx];
        const bg = v === 'taken' ? '#17A196' : v === 'snoozed' ? '#E6A600' : v === 'skipped' ? '#D9534F' : '#E8F3F1';
        return <View key={k} style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: bg }} />;
      })}
    </View>
  );
}


