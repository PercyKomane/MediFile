import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchMyProfile, fetchMyMedicalHistory, listPatientMedications, listLabResults, listSymptoms, listVitals, listDnaTests } from '../../api/records';

export default function RecordsHomeScreen({ navigation }: any) {
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [meds, setMeds] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any[]>([]);
  const [dnaTests, setDnaTests] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [p, h, m, l, s, v, d] = await Promise.all([
          fetchMyProfile(),
          fetchMyMedicalHistory(),
          listPatientMedications(),
          listLabResults(),
          listSymptoms(),
          listVitals(),
          listDnaTests(),
        ]);
        setProfile(p);
        setHistory(h);
        setMeds(m);
        setLabs(l);
        setSymptoms(s);
        setVitals(v);
        setDnaTests(d);
      } catch {}
    })();
  }, []);

  const countBy = (predicate: (x: any) => boolean) => history.filter(predicate).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F8A83' }}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.headerCard}>
        <Image source={require('../../assets/images/avatars/profile_avatar.png')} style={styles.avatar} />
        <Text style={styles.name}>{profile?.profile?.first_name} {profile?.profile?.last_name}</Text>
        <Text style={styles.sub}>ID: {profile?.user_id}</Text>
      </View>

      <View style={styles.list}>
        <RecordItem icon="sparkles-outline" title="Allergies" subtitle={`${countBy(h => h.diagnosis?.toLowerCase().includes('allerg'))} records found`} onPress={() => navigation.navigate('Allergies')} />
        <RecordItem icon="pulse-outline" title="Diagnoses/Conditions" subtitle={`${history.length} records found`} onPress={() => navigation.navigate('Diagnoses')} />
        <RecordItem icon="newspaper-outline" title="Reports" subtitle={`Recent reports`} onPress={() => navigation.navigate('Reports')} />
        <RecordItem icon="stats-chart-outline" title="Charts" subtitle={`7 days`} onPress={() => navigation.navigate('Charts')} />
        <RecordItem icon="medkit-outline" title="Medications & Supplements" subtitle={`${meds.length} records found`} onPress={() => navigation.navigate('Medications')} />
        <RecordItem icon="thermometer-outline" title="Symptoms" subtitle={`${symptoms.length} records found`} onPress={() => navigation.navigate('Symptoms')} />
        <RecordItem icon="flask-outline" title="Lab Tests" subtitle={`${labs.length} records found`} onPress={() => navigation.navigate('LabTests')} />
        <RecordItem icon="finger-print-outline" title="DNA Tests" subtitle={`${dnaTests.length} records found`} onPress={() => navigation.navigate('DnaTests')} />
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const RecordItem = ({ icon, title, subtitle, onPress }: any) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {icon ? <Ionicons name={icon} size={22} color="#0F8A83" /> : null}
        <Text style={styles.itemTitle}>{title}</Text>
      </View>
      <Text style={styles.itemSub}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#8CA3A0" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  headerCard: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: '#BFE5E1',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: { width: 72, height: 72, borderRadius: 36, marginBottom: 8 },
  name: { color: '#0F3330', fontWeight: '700', fontSize: 16 },
  sub: { color: '#4B6B68' },
  list: { marginTop: 16, marginHorizontal: 16 },
  item: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: { fontWeight: '700', marginBottom: 2 },
  itemSub: { color: '#7B8F8C', fontSize: 12 },
});


