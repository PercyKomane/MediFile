import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPrivacySettings, updatePrivacySettings, PrivacySettings } from '../api/profile';

const Row = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Switch value={value} onValueChange={onChange} />
  </View>
);

const PrivacySettingsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<PrivacySettings | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getPrivacySettings();
        if (mounted) setPrefs(data);
      } catch (e) {
        Alert.alert('Error', 'Failed to load privacy settings');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleToggle = async (key: keyof PrivacySettings, value: boolean) => {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    try {
      const updated = await updatePrivacySettings({ [key]: value } as Partial<PrivacySettings>);
      setPrefs(prev => ({ ...(prev || updated), ...updated }));
    } catch (e) {
      Alert.alert('Error', 'Could not save change');
      setPrefs(prefs); // revert
    } finally {
      setSaving(false);
    }
  };

  if (loading || !prefs) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#008080" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}> 
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Settings</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Visibility</Text>
        <Row label="Show my profile to doctors" value={prefs.show_profile_to_doctors} onChange={(v) => handleToggle('show_profile_to_doctors', v)} />
        <Row label="Show my contact info to doctors" value={prefs.show_contact_info_to_doctors} onChange={(v) => handleToggle('show_contact_info_to_doctors', v)} />

        <Text style={styles.section}>Usage & Communications</Text>
        <Row label="Allow marketing emails" value={prefs.allow_marketing_emails} onChange={(v) => handleToggle('allow_marketing_emails', v)} />
        <Row label="Share anonymized analytics" value={prefs.share_anonymized_analytics} onChange={(v) => handleToggle('share_anonymized_analytics', v)} />

        <Text style={styles.section}>Interactions</Text>
        <Row label="Allow chat requests" value={prefs.allow_chat_requests} onChange={(v) => handleToggle('allow_chat_requests', v)} />

        {saving && (
          <View style={styles.saving}> 
            <ActivityIndicator size="small" color="#008080" />
            <Text style={styles.savingText}>Saving…</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#199A8E', paddingTop: 50, paddingBottom: 16, alignItems: 'center', justifyContent: 'center' },
  backBtn: { position: 'absolute', left: 16, bottom: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '600' },
  content: { padding: 16 },
  section: { marginTop: 12, marginBottom: 4, color: '#199A8E', fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomColor: '#f0f0f0', borderBottomWidth: 1 },
  label: { fontSize: 16, color: '#333', flex: 1, paddingRight: 12 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  saving: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  savingText: { marginLeft: 8, color: '#666' },
});

export default PrivacySettingsScreen;


