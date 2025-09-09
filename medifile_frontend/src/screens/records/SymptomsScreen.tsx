import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { listSymptoms, addSymptom } from '../../api/records';

export default function SymptomsScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ description: '', severity: 'mild' });

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
      });
      setForm({ description: '', severity: 'mild' });
      setShowAdd(false);
      load();
    } catch (e) {
      Alert.alert('Error', 'Failed to add symptom');
    }
  };

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
          <TouchableOpacity style={styles.addBtn} onPress={onAdd}><Text style={styles.addBtnText}>Add</Text></TouchableOpacity>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.symptom_id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.description}</Text>
            <Text style={styles.sub}>{String(item.severity).toUpperCase()} • {item.onset_date}</Text>
            {item.notes ? <Text style={styles.sub}>{item.notes}</Text> : null}
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#7B8F8C', padding: 16 }}>No symptom entries</Text>}
      />
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
});


