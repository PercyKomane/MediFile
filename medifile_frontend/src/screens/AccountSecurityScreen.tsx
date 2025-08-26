import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { changePassword, getSecurity, beginTotp, confirmTotp, disableTotp, SecurityState } from '../api/security';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const AccountSecurityScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<SecurityState | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changing, setChanging] = useState(false);

  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [totpSaving, setTotpSaving] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await getSecurity();
        if (mounted) setState(s);
      } catch (e) {
        Alert.alert('Error', 'Failed to load security settings');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Validation', 'Enter both current and new password');
      return;
    }
    setChanging(true);
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password updated');
      setCurrentPassword('');
      setNewPassword('');
    } catch (e: any) {
      Alert.alert('Error', 'Could not change password');
    } finally {
      setChanging(false);
    }
  };

  const handleBeginTotp = async () => {
    try {
      const { otpauth_url, secret } = await beginTotp();
      setOtpauthUrl(otpauth_url);
      setTotpSecret(secret);
      Alert.alert('Scan QR', 'Open your authenticator app and add this account. Tap "Open" to launch if supported.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open', onPress: () => Linking.openURL(otpauth_url) }
      ]);
    } catch (e: any) {
      const detail = e?.response?.data?.detail || 'Failed to start 2FA setup';
      Alert.alert('Error', String(detail));
    }
  };

  const handleConfirmTotp = async () => {
    if (!totpCode) {
      Alert.alert('Validation', 'Enter the 6-digit code');
      return;
    }
    setTotpSaving(true);
    try {
      const { backup_codes } = await confirmTotp(totpCode);
      setBackupCodes(backup_codes);
      const s = await getSecurity();
      setState(s);
      Alert.alert('2FA Enabled', 'Save your backup codes in a safe place.');
    } catch (e) {
      Alert.alert('Error', 'Invalid code');
    } finally {
      setTotpSaving(false);
    }
  };

  const handleDisableTotp = async () => {
    try {
      await disableTotp();
      setBackupCodes(null);
      setOtpauthUrl(null);
      const s = await getSecurity();
      setState(s);
      Alert.alert('2FA Disabled', 'Two-factor authentication has been disabled.');
    } catch (e) {
      Alert.alert('Error', 'Could not disable 2FA');
    }
  };

  if (loading || !state) {
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
        <Text style={styles.title}>Account Security</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Change Password">
          <TextInput
            placeholder="Current password"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            style={styles.input}
          />
          <TextInput
            placeholder="New password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            style={styles.input}
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleChangePassword} disabled={changing}>
            {changing ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Update Password</Text>}
          </TouchableOpacity>
        </Section>

        <Section title="Two-Factor Authentication (TOTP)">
          {state.is_totp_enabled ? (
            <>
              <Text style={styles.info}>2FA is enabled for your account.</Text>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleDisableTotp}>
                <Text style={styles.secondaryBtnText}>Disable 2FA</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleBeginTotp}>
                <Text style={styles.primaryBtnText}>Start 2FA Setup</Text>
              </TouchableOpacity>
              {otpauthUrl && (
                <>
                  <Text style={styles.info}>Enter the 6-digit code from your authenticator app:</Text>
                  {totpSecret && (
                    <View style={styles.codesBox}>
                      <Text style={styles.codesTitle}>Manual setup secret</Text>
                      <Text style={styles.codeRow}>{totpSecret}</Text>
                      <Text style={[styles.info, { marginTop: 8 }]}>If the authenticator app did not open, copy this secret and add an account manually. You can also use the URL below:</Text>
                      <Text style={{ color: '#333' }}>{otpauthUrl}</Text>
                    </View>
                  )}
                  <TextInput
                    placeholder="123456"
                    keyboardType="number-pad"
                    value={totpCode}
                    onChangeText={setTotpCode}
                    style={styles.input}
                  />
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmTotp} disabled={totpSaving}>
                    {totpSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Confirm & Enable</Text>}
                  </TouchableOpacity>
                </>
              )}
              {backupCodes && (
                <View style={styles.codesBox}>
                  <Text style={styles.codesTitle}>Backup Codes</Text>
                  {backupCodes.map((c) => (
                    <Text key={c} style={styles.codeRow}>{c}</Text>
                  ))}
                </View>
              )}
            </>
          )}
        </Section>
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
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#199A8E', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#eee', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 12 },
  primaryBtn: { backgroundColor: '#199A8E', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  secondaryBtn: { backgroundColor: '#ffe8e8', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  secondaryBtnText: { color: '#b00020', fontWeight: '600' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  info: { color: '#555', marginVertical: 8 },
  codesBox: { backgroundColor: '#f7f7f7', padding: 12, borderRadius: 10, marginTop: 10 },
  codesTitle: { fontWeight: '600', marginBottom: 6 },
  codeRow: { fontFamily: 'monospace', letterSpacing: 1, marginBottom: 4 },
});

export default AccountSecurityScreen;


