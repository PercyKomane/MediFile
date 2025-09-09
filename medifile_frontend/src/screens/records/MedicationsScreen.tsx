import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { listPatientMedications, addPatientMedication } from '../../api/records';

export default function MedicationsScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', dosage: '', frequency: '' });

  const load = async () => {
    const data = await listPatientMedications();
    setItems(data);
  };

  useEffect(() => {
    load();
  }, []);

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
        start_date: new Date().toISOString().slice(0, 10),
        is_active: true,
      });
      setForm({ name: '', dosage: '', frequency: '' });
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

      {showAdd && (
        <View style={styles.formCard}>
          <TextInput placeholder="Name" placeholderTextColor="#7B8F8C" style={styles.input} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
          <TextInput placeholder="Dosage (e.g., 500mg)" placeholderTextColor="#7B8F8C" style={styles.input} value={form.dosage} onChangeText={(t) => setForm({ ...form, dosage: t })} />
          <TextInput placeholder="Frequency (e.g., 2x/day)" placeholderTextColor="#7B8F8C" style={styles.input} value={form.frequency} onChangeText={(t) => setForm({ ...form, frequency: t })} />
          <TouchableOpacity style={styles.addBtn} onPress={onAdd}><Text style={styles.addBtnText}>Add</Text></TouchableOpacity>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.med_record_id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sub}>{[item.dosage, item.frequency].filter(Boolean).join(' • ')}</Text>
            <Text style={styles.sub}>{item.is_active ? 'Active' : 'Inactive'}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#7B8F8C', padding: 16 }}>No medications</Text>}
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
  addBtn: { backgroundColor: '#0F8A83', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8F3F1', borderRadius: 12, padding: 14, marginBottom: 10 },
  name: { fontWeight: '700', marginBottom: 2, color: '#334B48' },
  sub: { color: '#7B8F8C' },
});


