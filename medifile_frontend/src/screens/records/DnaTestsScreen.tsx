import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { listDnaTests, addDnaTest } from '../../api/records';

export default function DnaTestsScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ test_name: '', trait: '', interpretation: '' });

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
        recorded_at: new Date().toISOString().slice(0, 10),
      });
      setForm({ test_name: '', trait: '', interpretation: '' });
      setShowAdd(false);
      load();
    } catch (e) {
      Alert.alert('Error', 'Failed to add DNA test');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={22} color="#0F8A83" /></TouchableOpacity>
        <Text style={styles.title}>DNA Tests</Text>
        <TouchableOpacity onPress={() => setShowAdd(s => !s)}>
          <Ionicons name={showAdd ? 'close' : 'add'} size={22} color="#0F8A83" />
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View style={styles.formCard}>
          <TextInput placeholder="Test name" placeholderTextColor="#7B8F8C" style={styles.input} value={form.test_name} onChangeText={(t) => setForm({ ...form, test_name: t })} />
          <TextInput placeholder="Trait" placeholderTextColor="#7B8F8C" style={styles.input} value={form.trait} onChangeText={(t) => setForm({ ...form, trait: t })} />
          <TextInput placeholder="Interpretation" placeholderTextColor="#7B8F8C" style={styles.input} value={form.interpretation} onChangeText={(t) => setForm({ ...form, interpretation: t })} />
          <TouchableOpacity style={styles.addBtn} onPress={onAdd}><Text style={styles.addBtnText}>Add</Text></TouchableOpacity>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.dna_test_id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.test_name}</Text>
            {item.trait ? <Text style={styles.sub}>Trait: {item.trait}</Text> : null}
            {item.interpretation ? <Text style={styles.sub}>{item.interpretation}</Text> : null}
            <Text style={styles.sub}>{item.recorded_at}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#7B8F8C', padding: 16 }}>No DNA tests</Text>}
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


