import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DOCTORS } from '../data/doctors';
import { MessagesStackParamList } from '../navigation/MessagesNavigator';
import * as MessagesAPI from '../api/messages';
import { getDoctor } from '../api/doctors';
import { useAuth } from '../context/AuthContext';
import { useChatSocket } from '../hooks/useChatSocket';

type Sender = 'doctor' | 'user' | 'system' | 'typing';

type ChatMessage = {
  id: string;
  text?: string;
  sender: Sender;
  time?: string;
  createdAt?: number;
};

const AVATAR_FALLBACK = require('../assets/images/doctors/doctor1.png');

const MessagesScreen = () => {
  const { token } = useAuth();
  const [text, setText] = useState('');
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MessagesStackParamList, 'Chat'>>();
  const insets = useSafeAreaInsets();
  const doctorId = route.params?.doctorId;
  const conversationId = (route.params as any)?.conversationId as number | undefined;
  const [doctorName, setDoctorName] = useState<string | undefined>(undefined);
  const [doctorUserId, setDoctorUserId] = useState<number | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const doctor = DOCTORS.find((d) => d.id === doctorId);

  // Load conversation details (doctor id/name) and messages from backend
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!conversationId) return;
      try {
        const conv = await MessagesAPI.getConversation(conversationId);
        const backendDoctorId = conv?.doctor;
        if (backendDoctorId) {
          const doc = await getDoctor(backendDoctorId);
          const name = doc?.user?.profile ? `Dr. ${doc.user.profile.first_name} ${doc.user.profile.last_name}` : undefined;
          if (mounted) {
            setDoctorName(name);
            setDoctorUserId(doc?.user?.user_id);
          }
        }
      } catch {
        // ignore
      }
    };
    load();
    return () => { mounted = false; };
  }, [conversationId]);

  useEffect(() => {
    let mounted = true;
    const loadMessages = async () => {
      if (!conversationId) return;
      try {
        const data = await MessagesAPI.listMessages(conversationId);
        const transformed: ChatMessage[] = (data || []).map((m: any) => ({
          id: String(m.message_id),
          text: m.text,
          sender: m.sender === doctorUserId ? 'doctor' : 'user',
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date(m.created_at).getTime(),
        }));
        if (mounted) setMessages(transformed);
      } catch {
        // ignore
      }
    };
    loadMessages();
    return () => { mounted = false; };
  }, [conversationId, doctorUserId]);

  // Live socket events: append new messages, show typing indicator
  const typingIdRef = useRef<string | null>(null);
  const { sendTyping } = useChatSocket(conversationId, token, (payload) => {
    if (payload?.type === 'new_message') {
      const m = payload.message;
      const newMsg: ChatMessage = {
        id: String(m.id),
        text: m.text,
        sender: m.sender === doctorUserId ? 'doctor' : 'user',
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date(m.created_at).getTime(),
      };
      setMessages((prev) => [...prev, newMsg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } else if (payload?.type === 'typing') {
      // Add ephemeral typing bubble for doctor
      const tempId = 'typing';
      if (!typingIdRef.current) {
        typingIdRef.current = tempId;
        setMessages((prev) => [...prev, { id: tempId, sender: 'typing' } as any]);
        setTimeout(() => {
          typingIdRef.current = null;
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
        }, 1500);
      }
    }
  });

  const listRef = useRef<FlatList<ChatMessage>>(null);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!conversationId) return;
    try {
      const sent = await MessagesAPI.sendMessage(conversationId, trimmed);
      const newMsg: ChatMessage = {
        id: String(sent?.message_id ?? Date.now()),
        text: sent?.text ?? trimmed,
        sender: 'user',
        time: new Date(sent?.created_at ?? Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date(sent?.created_at ?? Date.now()).getTime(),
      };
      setMessages((prev) => [...prev, newMsg]);
      setText('');
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch {
      // optionally surface error
    }
  };

  // Optional: emit typing when user types (throttled by UI simplicity)
  const handleChangeText = (t: string) => {
    setText(t);
    try { sendTyping(); } catch {}
  };

  const formatRelative = (ts?: number) => {
    if (!ts) return undefined;
    const diffMs = Date.now() - ts;
    const mins = Math.max(0, Math.floor(diffMs / 60000));
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    if (item.sender === 'system') {
      return (
        <View style={styles.systemCard}>
          <Text style={styles.systemTitle}>Consultation Start</Text>
          <Text style={styles.systemSubtitle}>You can consult your problem to the doctor</Text>
        </View>
      );
    }

    if (item.sender === 'typing') {
      return (
        <View style={[styles.row, { marginTop: 6 }]}> 
          <Image source={doctor?.avatar ?? AVATAR_FALLBACK} style={styles.avatar} />
          <View style={[styles.bubble, styles.doctorBubble]}> 
            <View style={styles.typingDots}>
              <View style={styles.dot} />
              <View style={[styles.dot, { opacity: 0.7 }]} />
              <View style={[styles.dot, { opacity: 0.4 }]} />
            </View>
          </View>
        </View>
      );
    }

    const isUser = item.sender === 'user';
    if (!isUser) {
      return (
        <View style={{ marginTop: 12 }}>
          <View style={styles.row}>
            <Image source={doctor?.avatar ?? AVATAR_FALLBACK} style={styles.avatar} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.senderName}>{doctorName ?? 'Doctor'}</Text>
              <Text style={styles.senderSub}>{formatRelative(item.createdAt)}</Text>
              <View style={[styles.bubble, styles.doctorBubble, { marginTop: 8, alignSelf: 'flex-start' }]}>
                <Text style={[styles.messageText, styles.doctorText]}>{item.text}</Text>
              </View>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={{ marginVertical: 8 }}>
        <View style={[styles.row, styles.rowEnd]}>
          <View style={[styles.bubble, styles.userBubble]}>
            <Text style={[styles.messageText, styles.userText]}>{item.text}</Text>
          </View>
        </View>
      </View>
    );
  };

  const keyExtractor = (item: ChatMessage) => item.id;

  return (
    <View style={styles.screen}>
      {/* Header inside top safe area */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: '#fff' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#111" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{doctorName ?? doctor?.name ?? 'Doctor'}</Text>
          </View>
          <View style={styles.headerActions}>
            <Ionicons name="call-outline" size={20} color="#111" style={styles.headerIcon} />
            <Ionicons name="videocam-outline" size={20} color="#111" style={styles.headerIcon} />
            <Ionicons name="ellipsis-vertical" size={20} color="#111" />
          </View>
        </View>
      </SafeAreaView>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom + 10 : 0}
      >
        <View style={[styles.inputBar, { paddingBottom: Math.max(10, 10 - insets.bottom) }]}> 
          <Ionicons name="attach" size={20} color="#8a8a8a" />
          <TextInput
            style={styles.textInput}
            placeholder="Type message ..."
            placeholderTextColor="#9AA0A6"
            value={text}
            onChangeText={handleChangeText}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendLabel}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E8EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'left',
    color: '#111',
    marginLeft: 6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: { marginHorizontal: 2 },

  listContent: {
    padding: 16,
    paddingBottom: 12,
  },
  systemCard: {
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E8EB',
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginVertical: 12,
  },
  systemTitle: {
    color: '#16A085',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  systemSubtitle: {
    color: '#7B8794',
    fontSize: 12,
    textAlign: 'center',
  },
  senderName: { fontWeight: '700', color: '#111' },
  senderSub: { color: '#9AA0A6', fontSize: 12, marginTop: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  rowEnd: { justifyContent: 'flex-end' },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  doctorBubble: {
    backgroundColor: '#F3F3F3',
    borderTopLeftRadius: 6,
  },
  userBubble: {
    backgroundColor: '#199A8E',
    borderTopRightRadius: 6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  doctorText: { color: '#555555' },
  userText: { color: '#fff' },

  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9AA0A6',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E8EB',
    gap: 10,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F3F6F6',
    borderRadius: 28,
    color: '#1F2937',
  },
  sendButton: {
    backgroundColor: '#16A085',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 28,
  },
  sendLabel: { color: '#fff', fontWeight: '700' },
});

export default MessagesScreen;
