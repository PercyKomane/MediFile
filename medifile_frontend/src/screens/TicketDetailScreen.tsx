import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTicket, replyToTicket, closeTicket, SupportTicket } from '../api/support';

const TicketDetailScreen = ({ navigation, route }: any) => {
  const { id } = route.params as { id: number };
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const t = await getTicket(id);
      setTicket(t);
    } catch (e) {
      Alert.alert('Error', 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await replyToTicket(id, reply.trim());
      setReply('');
      await load();
    } catch (e) {
      Alert.alert('Error', 'Could not send reply');
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      await closeTicket(id);
      await load();
    } catch (e) {
      Alert.alert('Error', 'Could not close ticket');
    } finally {
      setClosing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Ticket</Text>
        <View style={{ width: 40 }} />
      </View>
      {loading || !ticket ? (
        <View style={styles.loading}><ActivityIndicator color="#008080" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.subject}>{ticket.subject}</Text>
          <Text style={styles.meta}>{ticket.status.toUpperCase()} • {new Date(ticket.created_at).toLocaleString()}</Text>
          <View style={styles.threadBox}>
            <Text style={styles.message}>{ticket.message}</Text>
            {ticket.replies.map(r => (
              <View key={r.reply_id} style={styles.replyRow}>
                <Text style={styles.replyMeta}>{r.sender_email || 'Support'} • {new Date(r.created_at).toLocaleString()}</Text>
                <Text style={styles.replyText}>{r.message}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.section, { marginTop: 12 }]}>Add a reply</Text>
          <TextInput placeholder="Write a message" value={reply} onChangeText={setReply} style={[styles.input, { height: 90 }]} multiline />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleReply} disabled={sending}>
            {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send Reply</Text>}
          </TouchableOpacity>

          {ticket.status !== 'closed' && (
            <TouchableOpacity style={[styles.secondaryBtn, { marginTop: 12 }]} onPress={handleClose} disabled={closing}>
              {closing ? <ActivityIndicator color="#b00020" /> : <Text style={styles.secondaryBtnText}>Close Ticket</Text>}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#199A8E', paddingTop: 50, paddingBottom: 16, alignItems: 'center', justifyContent: 'center' },
  backBtn: { position: 'absolute', left: 16, bottom: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '600' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16 },
  subject: { fontSize: 18, fontWeight: '700', color: '#222' },
  meta: { color: '#888', marginTop: 4 },
  threadBox: { backgroundColor: '#f7f7f7', borderRadius: 10, padding: 12, marginTop: 12 },
  message: { color: '#333' },
  replyRow: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 },
  replyMeta: { color: '#777', marginBottom: 2 },
  replyText: { color: '#333' },
  section: { color: '#199A8E', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#eee', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginTop: 8 },
  primaryBtn: { backgroundColor: '#199A8E', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  secondaryBtn: { backgroundColor: '#ffe8e8', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  secondaryBtnText: { color: '#b00020', fontWeight: '600' },
});

export default TicketDetailScreen;


