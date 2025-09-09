import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { listLabResults, addLabResult } from '../../api/records';

export default function LabTestsScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ test_name: '', result_value: '', units: '', reference_range: '' });

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
        reference_range: form.reference_range,
        recorded_at: new Date().toISOString().slice(0, 10),
      });
      setForm({ test_name: '', result_value: '', units: '', reference_range: '' });
      setShowAdd(false);
      load();
    } catch (e) {
      Alert.alert('Error', 'Failed to add lab result');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={22} color="#0F8A83" /></TouchableOpacity>
        <Text style={styles.title}>Lab Tests</Text>
        <TouchableOpacity onPress={() => setShowAdd(s => !s)}>
          <Ionicons name={showAdd ? 'close' : 'add'} size={22} color="#0F8A83" />
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View style={styles.formCard}>
          <TextInput placeholder="Test name" placeholderTextColor="#7B8F8C" style={styles.input} value={form.test_name} onChangeText={(t) => setForm({ ...form, test_name: t })} />
          <TextInput placeholder="Result" placeholderTextColor="#7B8F8C" style={styles.input} value={form.result_value} onChangeText={(t) => setForm({ ...form, result_value: t })} />
          <TextInput placeholder="Units" placeholderTextColor="#7B8F8C" style={styles.input} value={form.units} onChangeText={(t) => setForm({ ...form, units: t })} />
          <TextInput placeholder="Reference range" placeholderTextColor="#7B8F8C" style={styles.input} value={form.reference_range} onChangeText={(t) => setForm({ ...form, reference_range: t })} />
          <TouchableOpacity style={styles.addBtn} onPress={onAdd}><Text style={styles.addBtnText}>Add</Text></TouchableOpacity>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.lab_result_id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.test_name}</Text>
            <Text style={styles.sub}>{item.result_value} {item.units}</Text>
            {item.reference_range ? <Text style={styles.sub}>Ref: {item.reference_range}</Text> : null}
            <Text style={styles.sub}>{item.recorded_at}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#7B8F8C', padding: 16 }}>No lab results</Text>}
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


