import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { API } from '../api/client';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const AboutScreen = ({ navigation }: any) => {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const appInfo = useMemo(() => {
    const anyC: any = Constants;
    const name = anyC?.expoConfig?.name || anyC?.manifest?.name || 'MediFile';
    const version = anyC?.expoConfig?.version || anyC?.manifest?.version || '1.0.0';
    const build = anyC?.expoConfig?.runtimeVersion || anyC?.manifest?.revisionId || 'dev';
    const apiBase = API.defaults.baseURL || '';
    return { name, version, build, apiBase };
  }, []);

  const openMail = () => Linking.openURL('mailto:support@medifile.example');
  const openWebsite = () => Linking.openURL('https://www.medifile.example');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>About MediFile</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.appName}>{appInfo.name}</Text>
          <Text style={styles.muted}>Version {appInfo.version} • Build {appInfo.build}</Text>
          <Text style={[styles.muted, { marginTop: 4 }]}>API: {appInfo.apiBase}</Text>
        </View>

        <Section title="Overview">
          <Text style={styles.text}>
            MediFile is your trusted healthcare companion for managing appointments, prescriptions,
            emergency requests and hospital discovery. Seamlessly browse hospitals, book appointments,
            order medicines, track ambulance requests, and manage your profile securely with 2FA.
          </Text>
        </Section>

        <Section title="Key Features">
          <Text style={styles.text}>• Hospital finder and map view</Text>
          <Text style={styles.text}>• Appointments and conversations</Text>
          <Text style={styles.text}>• Pharmacy cart and orders</Text>
          <Text style={styles.text}>• Emergency ambulance requests with voice notes</Text>
          <Text style={styles.text}>• Profile editing, privacy controls and account security (2FA)</Text>
          <Text style={styles.text}>• FAQs, Help & Support tickets</Text>
        </Section>

        <Section title="Legal">
          <TouchableOpacity style={styles.linkRow} onPress={() => setShowPrivacy(true)}>
            <Ionicons name="document-text-outline" size={18} color="#199A8E" />
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => setShowTerms(true)}>
            <Ionicons name="document-text-outline" size={18} color="#199A8E" />
            <Text style={styles.linkText}>Terms of Service</Text>
          </TouchableOpacity>
        </Section>

        <Section title="Contact & Support">
          <TouchableOpacity style={styles.linkRow} onPress={openMail}>
            <Ionicons name="mail-outline" size={18} color="#199A8E" />
            <Text style={styles.linkText}>support@medifile.example</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={openWebsite}>
            <Ionicons name="globe-outline" size={18} color="#199A8E" />
            <Text style={styles.linkText}>Website</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 10 }]} onPress={() => navigation.navigate('HelpSupport')}>
            <Text style={styles.primaryBtnText}>Open Help & Support</Text>
          </TouchableOpacity>
        </Section>

        <Section title="Credits">
          <Text style={styles.text}>Built with React Native (Expo), Django & Django REST Framework.</Text>
          <Text style={styles.text}>Icons by Ionicons. Maps by Leaflet/OpenStreetMap.</Text>
        </Section>
      </ScrollView>

      <Modal visible={showPrivacy} transparent animationType="slide" onRequestClose={() => setShowPrivacy(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy Policy</Text>
              <TouchableOpacity onPress={() => setShowPrivacy(false)}><Ionicons name="close" size={22} color="#666" /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: '70%' }}>
              <Text style={styles.text}>
                We respect your privacy. We collect only necessary information to provide MediFile
                services. Audio notes and files are stored securely and accessed only for your
                emergency requests. You can manage profile visibility and communications under
                Privacy Settings.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showTerms} transparent animationType="slide" onRequestClose={() => setShowTerms(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms of Service</Text>
              <TouchableOpacity onPress={() => setShowTerms(false)}><Ionicons name="close" size={22} color="#666" /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: '70%' }}>
              <Text style={styles.text}>
                By using MediFile, you agree to use the app responsibly and provide accurate
                information. This app is not a substitute for professional medical advice.
                In an emergency, call your local emergency number.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#199A8E', paddingTop: 50, paddingBottom: 16, alignItems: 'center', justifyContent: 'center' },
  backBtn: { position: 'absolute', left: 16, bottom: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '600' },
  content: { padding: 16 },
  card: { backgroundColor: '#f7fafa', borderRadius: 12, padding: 16, marginBottom: 12 },
  appName: { fontSize: 18, fontWeight: '700', color: '#222' },
  muted: { color: '#777' },
  section: { marginTop: 12 },
  sectionTitle: { color: '#199A8E', fontWeight: '600', marginBottom: 6 },
  text: { color: '#333', lineHeight: 20, marginBottom: 6 },
  linkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  linkText: { color: '#199A8E', marginLeft: 8 },
  primaryBtn: { backgroundColor: '#199A8E', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, width: '100%', padding: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalTitle: { fontWeight: '700', color: '#222' },
});

export default AboutScreen;


