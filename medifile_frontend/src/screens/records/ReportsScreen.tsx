import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchMyMedicalHistory, listPatientMedications, listLabResults, listSymptoms } from '../../api/records';

type ReportItem = {
  id: string;
  date: string;
  title: string;
  details: string[];
  counts?: Record<string, string | number>;
};

export default function ReportsScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [reports, setReports] = useState<ReportItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [history, meds, labs, symptoms] = await Promise.all([
          fetchMyMedicalHistory(), listPatientMedications(), listLabResults(), listSymptoms()
        ]);
        const today = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const items: ReportItem[] = [
          {
            id: 'allergies',
            date: today,
            title: 'Allergies',
            details: history.filter((h: any) => String(h.diagnosis || '').toLowerCase().includes('allerg')).map((h: any) => `${h.diagnosis}`),
            counts: { total: history.length },
          },
          {
            id: 'diagnoses',
            date: today,
            title: 'Diagnoses',
            details: history.map((h: any) => `${h.diagnosis}`),
            counts: { total: history.length },
          },
          {
            id: 'medications',
            date: today,
            title: 'Medications',
            details: meds.map((m: any) => `${m.name}${m.dosage ? ' — ' + m.dosage : ''}`),
            counts: { total: meds.length },
          },
          {
            id: 'lab',
            date: today,
            title: 'Lab Tests',
            details: labs.map((l: any) => `${l.test_name} — ${l.result_value} ${l.units || ''}`.trim()),
            counts: { total: labs.length },
          },
          {
            id: 'symptoms',
            date: today,
            title: 'Symptoms',
            details: symptoms.map((s: any) => `${s.description} — ${String(s.severity).toUpperCase()}`),
            counts: { total: symptoms.length },
          },
        ];
        setReports(items);
      } catch {}
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((r) => r.title.toLowerCase().includes(q) || r.details.some((d) => d.toLowerCase().includes(q)));
  }, [query, reports]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={22} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>My health record</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#6B8F8C" />
        <TextInput
          placeholder="Search your report"
          placeholderTextColor="#6B8F8C"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.cardDate}>{item.date}</Text>
              <TouchableOpacity>
                <Text style={{ color: '#D9534F' }}>Delete Record</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.titleRow}>
              <Text style={styles.cardTitle}>{item.title}</Text>
            </TouchableOpacity>
            {item.details.map((d, idx) => (
              <Text key={idx} style={styles.detail}>{d}</Text>
            ))}
            <View style={styles.actions}>
              {item.title === 'Allergies' && (
                <TouchableOpacity style={styles.pill}><Ionicons name="add" size={14} color="#0F8A83" /><Text style={styles.pillText}>Add Allergy</Text></TouchableOpacity>
              )}
              {item.title === 'Diagnoses' && (
                <TouchableOpacity style={styles.pill}><Ionicons name="add" size={14} color="#0F8A83" /><Text style={styles.pillText}>Add Diagnosis</Text></TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F8A83' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { color: '#fff', fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DDF0EE', marginHorizontal: 16, borderRadius: 24, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, color: '#0F3330', marginLeft: 6 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12 },
  cardDate: { color: '#6B8F8C', fontSize: 12 },
  cardTitle: { color: '#0F8A83', fontWeight: '700', marginVertical: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detail: { color: '#334B48', marginBottom: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#0F8A83', borderRadius: 14, paddingHorizontal: 8, paddingVertical: 4 },
  pillText: { color: '#0F8A83', fontWeight: '600' },
});


