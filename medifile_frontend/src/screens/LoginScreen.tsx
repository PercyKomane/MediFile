import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <Image source={require('..//assets/images/icons/MedLogo.png')} style={styles.logo} />
        <Text style={styles.appName}>MediFile</Text>

        <Text style={styles.title}>Let’s get started!</Text>
        <Text style={styles.subtitle}>
          Login to enjoy the features we've
        </Text>
        <Text style={styles.subtitle2}>
          provided, and stay healthy!
        </Text>

        <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" style={styles.textInput} />
        <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.textInput} />

        <TouchableOpacity style={styles.loginButton} onPress={async () => {
          try {
            await login(email, password);
            navigation.navigate('MainApp');
          } catch (e: any) {
            Alert.alert('Login failed', e?.response?.data ? JSON.stringify(e.response.data) : String(e));
          }
        }}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signupButton} onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.signupText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  appName: {
    fontFamily: "Montserrat",
    fontSize: 24,
    fontWeight: 'bold',
    color: '#008080',
    marginBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 10,
  },
  subtitle2: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  loginButton: {
    width: 263,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#199A8E',
    paddingVertical: 15,
    paddingHorizontal: 100,
    borderRadius: 30,
    marginBottom: 15,
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  signupButton: {
    width: 263,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderColor: '#199A8E',
    borderWidth: 2,
    paddingVertical: 15,
    paddingHorizontal: 100,
    borderRadius: 30,
  },
  signupText: {
    color: '#199A8E',
    fontWeight: 'bold',
    fontSize: 16,
  },
  textInput: {
    width: 263,
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
});

export default LoginScreen;
