import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMyMedicalHistory } from '../../api/records';

export default function DiagnosesScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const data = await fetchMyMedicalHistory();
      setItems(data);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: '#0F8A83' }}>{'< Back'}</Text></TouchableOpacity>
      <Text style={styles.title}>Diagnoses / Conditions</Text>
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.record_id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.diagnosis}</Text>
            {item.treatment ? <Text style={styles.sub}>{item.treatment}</Text> : null}
            <Text style={styles.sub}>{item.date_recorded}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#7B8F8C' }}>No records yet</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginVertical: 12 },
  card: { backgroundColor: '#F3FAF9', padding: 14, borderRadius: 10, marginBottom: 10 },
  name: { fontWeight: '700', marginBottom: 4 },
  sub: { color: '#7B8F8C' },
});


