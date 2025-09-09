import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { listDoctors } from '../api/doctors';
import { listMedicines } from '../api/pharmacy';

type Props = {
  navigation: any;
  route: { params?: { query?: string } };
};

export default function SearchResultsScreen({ navigation, route }: Props) {
  const initialQuery = route.params?.query || '';
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const [doctorData, medicineData] = await Promise.all([
        listDoctors({ search: trimmed }),
        listMedicines({ search: trimmed }),
      ]);
      const ql = trimmed.toLowerCase();
      const filteredDoctors = (doctorData || []).filter((d: any) => {
        const first = d?.user?.profile?.first_name || '';
        const last = d?.user?.profile?.last_name || '';
        const name = `${first} ${last}`.toLowerCase();
        const spec = (d?.specialization || '').toLowerCase();
        const hosp = (d?.hospital?.name || '').toLowerCase();
        return name.includes(ql) || spec.includes(ql) || hosp.includes(ql);
      });
      setDoctors(filteredDoctors);
      setMedicines(medicineData?.results || medicineData || []);
    } catch (e) {
      console.log('Search error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    performSearch(query);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctor, drugs, articles..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoFocus={!!initialQuery}
        />
        <TouchableOpacity onPress={handleSubmit}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color="#199A8E" />
        </View>
      )}

      {!loading && (
        <FlatList
          ListHeaderComponent={
            <>
              <Text style={styles.sectionHeader}>Doctors</Text>
              {doctors.length === 0 && <Text style={styles.empty}>No doctors found</Text>}
              {doctors.slice(0, 5).map((d, idx) => (
                <TouchableOpacity 
                  key={`doc-${idx}`} 
                  style={styles.itemRow} 
                  onPress={() => navigation.navigate('DoctorProfile', { doctorId: d.doctor_id || d.id })}
                >
                  <Ionicons name="person-circle" size={22} color="#199A8E" />
                  <Text style={styles.itemText}>{d.user?.profile?.first_name} {d.user?.profile?.last_name} • {d.specialization}</Text>
                </TouchableOpacity>
              ))}

              <Text style={styles.sectionHeader}>Medicines</Text>
              {medicines.length === 0 && <Text style={styles.empty}>No medicines found</Text>}
            </>
          }
          data={medicines}
          keyExtractor={(item, index) => `med-${item.medicine_id || index}`}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.itemRow} onPress={() => navigation.navigate('Pharmacy')}>
              <Ionicons name="medkit" size={20} color="#199A8E" />
              <Text style={styles.itemText}>{item.name} {item.strength ? `• ${item.strength}` : ''}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchBar: {
    marginTop: 8,
    marginHorizontal: 16,
    backgroundColor: '#f1f1f1',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16 },
  searchBtnText: { color: '#199A8E', fontWeight: '600' },
  sectionHeader: { marginTop: 16, marginHorizontal: 16, fontSize: 16, fontWeight: '700', color: '#101623' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  itemText: { fontSize: 14, color: '#222' },
  loading: { padding: 16 },
  empty: { marginHorizontal: 16, color: '#888' },
});


