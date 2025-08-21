import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function SignUpScreen({ navigation }: any) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'patient',
    first_name: '',
    last_name: '',
    phone: '',
  });
  const set = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const onSubmit = async () => {
    try {
      await register(form);
      navigation.navigate('MainApp');
    } catch (e: any) {
      Alert.alert('Registration failed', e?.message ?? 'Unknown error');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create account</Text>

        <TextInput placeholder="First name" value={form.first_name} onChangeText={(v) => set('first_name', v)} style={styles.input} />
        <TextInput placeholder="Last name" value={form.last_name} onChangeText={(v) => set('last_name', v)} style={styles.input} />
        <TextInput placeholder="Email" autoCapitalize="none" value={form.email} onChangeText={(v) => set('email', v)} style={styles.input} />
        <TextInput placeholder="Password" secureTextEntry value={form.password} onChangeText={(v) => set('password', v)} style={styles.input} />
        <TextInput placeholder="Role (patient/doctor)" value={form.role} onChangeText={(v) => set('role', v)} style={styles.input} />
        <TextInput placeholder="Phone (optional)" value={form.phone} onChangeText={(v) => set('phone', v)} style={styles.input} />

        <TouchableOpacity style={styles.btn} onPress={onSubmit}>
          <Text style={styles.btnText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
          <Text style={{ color: '#199A8E', fontWeight: '600' }}>Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  btn: { height: 48, backgroundColor: '#199A8E', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
});

 
