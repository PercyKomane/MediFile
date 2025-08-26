import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getHospital, getHospitalDoctors, Hospital, Doctor } from '../api/hospitals';

interface HospitalDetailScreenProps {
  navigation: any;
  route: {
    params: {
      hospital: Hospital;
    };
  };
}

const HospitalDetailScreen = ({ navigation, route }: HospitalDetailScreenProps) => {
  const { hospital } = route.params;
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHospitalDoctors();
  }, []);

  const loadHospitalDoctors = async () => {
    try {
      const data = await getHospitalDoctors(hospital.hospital_id);
      setDoctors(data);
    } catch (error) {
      console.error('Failed to load hospital doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (hospital.contact_number) {
      Linking.openURL(`tel:${hospital.contact_number}`);
    } else {
      Alert.alert('No Contact Number', 'Contact number not available for this hospital.');
    }
  };

  const handleDirections = () => {
    // For now, we'll just show an alert. In a real app, you'd integrate with maps
    Alert.alert(
      'Get Directions',
      'This would open your preferred maps app with directions to the hospital.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: () => console.log('Directions requested') }
      ]
    );
  };

  const renderDoctorItem = ({ item }: { item: Doctor }) => (
    <View style={styles.doctorCard}>
      <View style={styles.doctorIcon}>
        <Ionicons name="person" size={24} color="#0F8A83" />
      </View>
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>
          Dr. {item.user.profile.first_name} {item.user.profile.last_name}
        </Text>
        <Text style={styles.doctorSpecialty}>{item.specialization}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#0F8A83" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hospital Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hospital Info Card */}
        <View style={styles.hospitalCard}>
          <View style={styles.hospitalHeader}>
            <View style={styles.hospitalIcon}>
              <Ionicons name="medical" size={32} color="#0F8A83" />
            </View>
            <View style={styles.hospitalInfo}>
              <Text style={styles.hospitalName}>{hospital.name}</Text>
              <Text style={styles.hospitalAddress}>{hospital.address}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Call Hospital</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.directionsButton]} onPress={handleDirections}>
            <Ionicons name="navigate" size={20} color="#0F8A83" />
            <Text style={[styles.actionButtonText, styles.directionsButtonText]}>Get Directions</Text>
          </TouchableOpacity>
        </View>
        
        {/* Map Button */}
        <TouchableOpacity 
          style={styles.mapButton} 
          onPress={() => navigation.navigate('HospitalMap', { selectedHospital: hospital })}
        >
          <Ionicons name="map" size={20} color="#fff" />
          <Text style={styles.mapButtonText}>View on Map</Text>
        </TouchableOpacity>

        {/* Doctors Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Doctors</Text>
          {doctors.length > 0 ? (
            doctors.map((doctor, index) => (
              <View key={doctor.doctor_id} style={styles.doctorCard}>
                <View style={styles.doctorIcon}>
                  <Ionicons name="person" size={24} color="#0F8A83" />
                </View>
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>
                    Dr. {doctor.user.profile.first_name} {doctor.user.profile.last_name}
                  </Text>
                  <Text style={styles.doctorSpecialty}>{doctor.specialization}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyDoctors}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.emptyDoctorsText}>No doctors available</Text>
            </View>
          )}
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={20} color="#666" />
              <Text style={styles.contactText}>
                {hospital.contact_number || 'Not available'}
              </Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.contactText}>{hospital.address}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  content: { flex: 1, paddingHorizontal: 20 },
  hospitalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  hospitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hospitalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F3F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  hospitalInfo: { flex: 1 },
  hospitalName: { fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 4 },
  hospitalAddress: { fontSize: 14, color: '#666' },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F8A83',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  directionsButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#0F8A83',
  },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '500', marginLeft: 8 },
  directionsButtonText: { color: '#0F8A83' },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#199A8E',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  mapButtonText: { color: '#fff', fontSize: 14, fontWeight: '500', marginLeft: 8 },
  section: { marginTop: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 15 },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  doctorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F3F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 16, fontWeight: '500', color: '#333', marginBottom: 2 },
  doctorSpecialty: { fontSize: 14, color: '#666' },
  emptyDoctors: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyDoctorsText: { fontSize: 16, color: '#666', marginTop: 12 },
  contactInfo: { backgroundColor: '#f8f8f8', borderRadius: 12, padding: 16 },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: { fontSize: 14, color: '#333', marginLeft: 12, flex: 1 },
});

export default HospitalDetailScreen;
