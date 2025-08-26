import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { listTickets, createTicket, SupportTicket } from '../api/support';

const HelpSupportScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCategory, setShowCategory] = useState(false);

  const categories = [
    'Account',
    'Billing',
    'Technical',
    'Appointments',
    'Pharmacy',
    'Hospitals',
    'Ambulance',
    'Privacy',
    'Feedback',
    'Other',
  ];

  const load = async () => {
    setLoading(true);
    try {
      const data = await listTickets();
      setTickets(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!subject || !message) {
      Alert.alert('Validation', 'Subject and message are required');
      return;
    }
    setCreating(true);
    try {
      await createTicket({ subject, category: category || undefined, message });
      setSubject('');
      setCategory('');
      setMessage('');
      await load();
      Alert.alert('Created', 'Support ticket submitted');
    } catch (e) {
      Alert.alert('Error', 'Could not create ticket');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Create a new ticket</Text>
        <TextInput placeholder="Subject" value={subject} onChangeText={setSubject} style={styles.input} />
        <TouchableOpacity style={styles.input} onPress={() => setShowCategory(true)}>
          <Text style={{ color: category ? '#333' : '#999' }}>{category || 'Select category (optional)'}</Text>
        </TouchableOpacity>
        <TextInput placeholder="Message" value={message} onChangeText={setMessage} style={[styles.input, { height: 100 }]} multiline />
        <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate} disabled={creating}>
          {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Submit Ticket</Text>}
        </TouchableOpacity>

        <Modal visible={showCategory} transparent animationType="fade" onRequestClose={() => setShowCategory(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCategory(false)}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select category</Text>
              <ScrollView style={{ maxHeight: 300 }}>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={styles.modalRow}
                    onPress={() => { setCategory(c); setShowCategory(false); }}
                  >
                    <Text style={styles.modalRowText}>{c}</Text>
                  </TouchableOpacity>
                ))}
                {!!category && (
                  <TouchableOpacity style={[styles.modalRow, { borderTopWidth: 1, borderTopColor: '#f0f0f0' }]} onPress={() => { setCategory(''); setShowCategory(false); }}>
                    <Text style={[styles.modalRowText, { color: '#b00020' }]}>Clear selection</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        <Text style={[styles.section, { marginTop: 24 }]}>My tickets</Text>
        {loading ? (
          <ActivityIndicator color="#008080" />
        ) : tickets.length === 0 ? (
          <Text style={styles.empty}>No tickets yet.</Text>
        ) : (
          tickets.map((t) => (
            <TouchableOpacity key={t.ticket_id} style={styles.ticketRow} onPress={() => navigation.navigate('TicketDetail', { id: t.ticket_id })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ticketSubject}>{t.subject}</Text>
                <Text style={styles.ticketMeta}>{t.status.toUpperCase()} • {new Date(t.created_at).toLocaleString()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>
          ))
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
  section: { marginVertical: 8, color: '#199A8E', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#eee', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 12 },
  primaryBtn: { backgroundColor: '#199A8E', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  empty: { color: '#777', marginVertical: 8 },
  ticketRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' },
  ticketSubject: { fontWeight: '600', color: '#333' },
  ticketMeta: { color: '#888', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, width: '85%', padding: 16 },
  modalTitle: { fontWeight: '700', color: '#222', marginBottom: 8 },
  modalRow: { paddingVertical: 12 },
  modalRowText: { color: '#333' },
});

export default HelpSupportScreen;


