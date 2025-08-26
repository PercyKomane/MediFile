import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { createAmbulanceRequest } from '../api/ambulance';
import { getMostRecentActiveAmbulanceRequest } from '../api/ambulance';

const EmergencyRequestScreen = ({ navigation }: any) => {
  const [note, setNote] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isStartingRec, setIsStartingRec] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } else {
        Alert.alert('Permission required', 'Location permission is needed for ambulance dispatch.');
      }
    })();
  }, []);

  useEffect(() => {
    return () => {
      (async () => {
        try {
          if (recording) {
            await recording.stopAndUnloadAsync();
          }
        } catch {}
      })();
    };
  }, [recording]);

  const startRecording = async () => {
    try {
      if (recording || isStartingRec) return;
      setIsStartingRec(true);
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Microphone permission is needed.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      setIsStartingRec(false);
    } catch (e) {
      console.log('Recording error', e);
      Alert.alert('Error', 'Failed to start recording');
      setIsStartingRec(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri || null);
      setRecording(null);
    } catch (e) {
      console.log('Stop recording error', e);
    }
  };

  const handleSubmit = async () => {
    if (!coords) {
      Alert.alert('Location missing', 'Waiting for GPS fix.');
      return;
    }
    try {
      setSubmitting(true);
      const form = new FormData();
      form.append('note', note);
      form.append('latitude', String(coords.latitude));
      form.append('longitude', String(coords.longitude));
      if (audioUri) {
        form.append('audio_file', {
          uri: audioUri,
          name: 'emergency.m4a',
          type: 'audio/m4a',
        } as any);
      }
      const created = await createAmbulanceRequest(form);
      navigation.replace('EmergencyTracking', { request: created });
    } catch (e) {
      console.log('Submit error', e);
      Alert.alert('Error', 'Failed to submit emergency request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrackExisting = async () => {
    try {
      const active = await getMostRecentActiveAmbulanceRequest();
      if (active) {
        navigation.navigate('EmergencyTracking', { request: active });
      } else {
        Alert.alert('No Active Request', 'You have no active ambulance request to track.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not check current requests.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#0F8A83" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Ambulance</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Describe the emergency (optional)</Text>
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder="Type notes..."
          multiline
        />

        <View style={styles.audioRow}>
          {recording ? (
            <TouchableOpacity style={styles.audioBtn} onPress={stopRecording}>
              <Ionicons name="stop" size={20} color="#fff" />
              <Text style={styles.audioBtnText}>Stop</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.audioBtn} onPress={startRecording}>
              <Ionicons name="mic" size={20} color="#fff" />
              <Text style={styles.audioBtnText}>{audioUri ? 'Re-record' : 'Record voice'}</Text>
            </TouchableOpacity>
          )}
          {audioUri ? <Text style={styles.audioHint}>Voice note attached</Text> : null}
        </View>

        <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitText}>{submitting ? 'Requesting…' : 'Request Ambulance'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.trackBtn} onPress={handleTrackExisting}>
          <Text style={styles.trackText}>Track Ambulance</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  content: { padding: 20 },
  label: { fontSize: 14, color: '#555', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, minHeight: 100, textAlignVertical: 'top' },
  audioRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  audioBtn: { backgroundColor: '#199A8E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  audioBtnText: { color: '#fff', marginLeft: 6, fontWeight: '600' },
  audioHint: { marginLeft: 12, color: '#199A8E' },
  submitBtn: { backgroundColor: '#E53935', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#fff', fontWeight: '700' },
  trackBtn: { backgroundColor: '#199A8E', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  trackText: { color: '#fff', fontWeight: '700' },
});

export default EmergencyRequestScreen;


