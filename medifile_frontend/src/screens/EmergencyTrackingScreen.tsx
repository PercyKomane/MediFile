import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AmbulanceRequest, getAmbulanceRequestStatus, cancelAmbulanceRequest, updateAmbulanceRequest } from '../api/ambulance';
import { API } from '../api/client';
import { Audio } from 'expo-av';

const POLL_MS = 10000;

const EmergencyTrackingScreen = ({ route, navigation }: any) => {
  const { request } = route.params as { request: AmbulanceRequest };
  const [current, setCurrent] = useState<AmbulanceRequest>(request);
  const timerRef = useRef<any>(null);
  const [editingNote, setEditingNote] = useState<string>(request.note || '');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    timerRef.current = setInterval(async () => {
      try {
        const updated = await getAmbulanceRequestStatus(current.request_id);
        setCurrent(updated);
      } catch {}
    }, POLL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      (async () => {
        try {
          if (recording) {
            await recording.stopAndUnloadAsync();
          }
        } catch {}
      })();
    };
  }, []);
  const startVoiceReplace = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission', 'Microphone permission is required.');
        return;
      }
      if (recording) return; // guard: avoid preparing twice
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopVoiceReplaceAndUpload = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setIsRecording(false);
      setRecording(null);
      if (!uri) return;
      setUploading(true);
      const file = { uri, name: 'updated_emergency.m4a', type: 'audio/m4a' } as any;
      const updated = await updateAmbulanceRequest(current.request_id, { audio_file: file });
      setCurrent(updated);
    } catch (e) {
      Alert.alert('Error', 'Failed to upload recording');
    } finally {
      setUploading(false);
    }
  };

  const saveNote = async () => {
    try {
      const updated = await updateAmbulanceRequest(current.request_id, { note: editingNote });
      setCurrent(updated);
      Alert.alert('Saved', 'Your note was updated.');
    } catch (e) {
      Alert.alert('Error', 'Failed to update note.');
    }
  };

  const playAudio = async () => {
    try {
      const raw = (current as any).audio_file_url || (current as any).audio_file;
      let url = raw as string | undefined;
      if (!url) {
        Alert.alert('No audio', 'No voice note attached.');
        return;
      }
      // Normalize relative URLs like /media/... to absolute using API baseURL
      if (url.startsWith('/')) {
        const base = (API.defaults.baseURL || '').replace(/\/api$/, '');
        url = `${base}${url}`;
      }
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: url });
      await sound.playAsync();
    } catch (e) {
      Alert.alert('Error', 'Failed to play audio.');
    }
  };

  const handleCancel = async () => {
    try {
      const updated = await cancelAmbulanceRequest(current.request_id);
      setCurrent(updated);
    } catch {}
  };

  const rawStatus = (current && (current as any).status) || 'pending';
  const statusText = String(rawStatus).replace(/[_-]/g, ' ');
  const hospitalName = (current as any)?.assigned_hospital?.name || 'Assigning…';
  const eta = (current as any)?.eta_minutes != null ? `${(current as any).eta_minutes} min` : 'Calculating…';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#0F8A83" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ambulance Tracking</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{statusText}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>From</Text>
            <Text style={styles.value}>{hospitalName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>ETA</Text>
            <Text style={styles.value}>{eta}</Text>
          </View>
          <View style={styles.block}>
            <Text style={styles.label}>Your note</Text>
            <TextInput
              style={styles.noteInput}
              multiline
              value={editingNote}
              onChangeText={setEditingNote}
              placeholder="Add or edit your emergency note"
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={saveNote}>
              <Text style={styles.primaryBtnText}>Save Note</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.block}>
            <Text style={styles.label}>Voice note</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={playAudio}>
                <Text style={styles.secondaryBtnText}>Play</Text>
              </TouchableOpacity>
              {isRecording ? (
                <TouchableOpacity style={[styles.secondaryBtn, { marginLeft: 10 }]} onPress={stopVoiceReplaceAndUpload} disabled={uploading}>
                  <Text style={styles.secondaryBtnText}>{uploading ? 'Uploading…' : 'Stop & Upload'}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.secondaryBtn, { marginLeft: 10 }]} onPress={startVoiceReplace}>
                  <Text style={styles.secondaryBtnText}>Re-record</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {current.status !== 'arrived' && current.status !== 'cancelled' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel Request</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  content: { padding: 20 },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 16 },
  block: { marginTop: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { color: '#777' },
  value: { fontWeight: '600', color: '#333' },
  noteInput: { borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 10, minHeight: 80, textAlignVertical: 'top', marginTop: 6 },
  primaryBtn: { marginTop: 10, backgroundColor: '#199A8E', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#E8F3F1', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  secondaryBtnText: { color: '#0F8A83', fontWeight: '700' },
  cancelBtn: { marginTop: 20, backgroundColor: '#e53935', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelText: { color: '#fff', fontWeight: '700' },
});

export default EmergencyTrackingScreen;


