import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DOCTORS } from '../data/doctors';
import { useMessages } from '../context/MessagesContext';

const DoctorsListScreen = () => {
  const navigation = useNavigation();
  const { getOrCreateBackendConversation } = useMessages();

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Messages</Text>
      <FlatList
        data={DOCTORS}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={async () => {
              const conversationId = await getOrCreateBackendConversation(item.id);
              navigation.navigate('Chat' as never, { doctorId: item.id, conversationId } as never);
            }}
          >
            <Image source={item.avatar} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>{item.specialty}</Text>
            </View>
            {item.online && <View style={styles.badge}><Text style={styles.badgeText}>Online</Text></View>}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  sep: { height: 1, backgroundColor: '#F0F2F4' },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '600' },
  sub: { fontSize: 12, color: '#6B7280' },
  badge: { backgroundColor: '#E6F7F3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#12876F', fontSize: 12, fontWeight: '600' },
});

export default DoctorsListScreen;


