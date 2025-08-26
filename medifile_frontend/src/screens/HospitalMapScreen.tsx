import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { listHospitals, Hospital } from '../api/hospitals';

interface HospitalMapScreenProps {
  navigation: any;
  route?: {
    params?: {
      selectedHospital?: Hospital;
    };
  };
}

// Fallback coordinates for hospitals without coordinates from API
const HOSPITAL_COORDINATES: { [key: string]: { latitude: number; longitude: number } } = {
  'Johannesburg General Hospital': { latitude: -26.2041, longitude: 28.0473 },
  'Cape Town Medical Center': { latitude: -33.9249, longitude: 18.4241 },
  'Durban Regional Hospital': { latitude: -29.8587, longitude: 31.0218 },
  'Pretoria Central Hospital': { latitude: -25.7479, longitude: 28.2293 },
  'Port Elizabeth Medical Complex': { latitude: -33.7139, longitude: 25.5207 },
  'Bloemfontein Health Center': { latitude: -29.0852, longitude: 26.1596 },
  'Nelspruit Regional Hospital': { latitude: -25.4753, longitude: 30.9694 },
  'Polokwane Medical Institute': { latitude: -23.9045, longitude: 29.4698 },
};

const HospitalMapScreen = ({ navigation, route }: HospitalMapScreenProps) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(
    route?.params?.selectedHospital || null
  );
  const defaultCenter = useMemo(() => ({ latitude: -26.2041, longitude: 28.0473 }), []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const hospitalsData = await listHospitals();
      setHospitals(hospitalsData);
      await requestLocationPermission();
    } catch (error) {
      console.error('Failed to load map data:', error);
      Alert.alert('Error', 'Failed to load hospital locations');
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation(location);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const getHospitalCoordinates = (hospital: Hospital) => {
    let latitudeNumber: number | undefined;
    let longitudeNumber: number | undefined;

    if (hospital.latitude != null && hospital.longitude != null) {
      latitudeNumber = typeof hospital.latitude === 'string' ? parseFloat(hospital.latitude) : hospital.latitude;
      longitudeNumber = typeof hospital.longitude === 'string' ? parseFloat(hospital.longitude) : hospital.longitude;
    }

    if (
      typeof latitudeNumber === 'number' && !Number.isNaN(latitudeNumber) &&
      typeof longitudeNumber === 'number' && !Number.isNaN(longitudeNumber)
    ) {
      return { latitude: latitudeNumber, longitude: longitudeNumber };
    }

    // Fallback to hardcoded coordinates if not available from API
    const fallback = HOSPITAL_COORDINATES[hospital.name];
    if (fallback) return fallback;

    return { latitude: NaN as any, longitude: NaN as any };
  };

  const handleHospitalPress = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    const coordinates = getHospitalCoordinates(hospital);
    
    // Open in external maps app if coordinates are valid
    if (typeof coordinates.latitude === 'number' && !Number.isNaN(coordinates.latitude) &&
        typeof coordinates.longitude === 'number' && !Number.isNaN(coordinates.longitude)) {
      const url = `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`;
      Linking.openURL(url);
    } else {
      Alert.alert('Location unavailable', 'This hospital does not have valid coordinates yet.');
    }
  };

  const handleCallHospital = (hospital: Hospital) => {
    if (hospital.contact_number) {
      Alert.alert(
        'Call Hospital',
        `Would you like to call ${hospital.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call', 
            onPress: () => {
              console.log('Calling hospital:', hospital.contact_number);
            }
          }
        ]
      );
    }
  };

  const handleGetDirections = (hospital: Hospital) => {
    const coordinates = getHospitalCoordinates(hospital);
    Alert.alert(
      'Get Directions',
      `Would you like to get directions to ${hospital.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Directions', 
          onPress: () => {
            console.log('Opening directions for:', hospital.name);
          }
        }
      ]
    );
  };

  const centerOnUserLocation = () => {
    if (userLocation) {
      const url = `https://www.google.com/maps?q=${userLocation.coords.latitude},${userLocation.coords.longitude}`;
      Linking.openURL(url);
    } else {
      Alert.alert('Location', 'Unable to get your current location.');
    }
  };

  const renderHospitalItem = (hospital: Hospital) => {
    const coordinates = getHospitalCoordinates(hospital);
    
    return (
      <TouchableOpacity
        key={hospital.hospital_id}
        style={styles.hospitalCard}
        onPress={() => handleHospitalPress(hospital)}
      >
        <View style={styles.hospitalIcon}>
          <Ionicons name="medical" size={24} color="#0F8A83" />
        </View>
        <View style={styles.hospitalInfo}>
          <Text style={styles.hospitalName}>{hospital.name}</Text>
          <Text style={styles.hospitalAddress}>{hospital.address}</Text>
          <Text style={styles.coordinates}>
            {typeof coordinates.latitude === 'number' && !Number.isNaN(coordinates.latitude) &&
             typeof coordinates.longitude === 'number' && !Number.isNaN(coordinates.longitude)
              ? `📍 ${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`
              : '📍 Coords N/A'}
          </Text>
        </View>
        <View style={styles.hospitalActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleCallHospital(hospital)}
          >
            <Ionicons name="call" size={20} color="#0F8A83" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleGetDirections(hospital)}
          >
            <Ionicons name="navigate" size={20} color="#0F8A83" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const center = useMemo(() => {
    if (selectedHospital) {
      const c = getHospitalCoordinates(selectedHospital);
      if (
        typeof c.latitude === 'number' && !Number.isNaN(c.latitude) &&
        typeof c.longitude === 'number' && !Number.isNaN(c.longitude)
      ) {
        return c;
      }
    }
    if (userLocation) {
      return { latitude: userLocation.coords.latitude, longitude: userLocation.coords.longitude };
    }
    return defaultCenter;
  }, [selectedHospital, userLocation, defaultCenter]);

  const mapHtml = useMemo(() => {
    const lat = center.latitude;
    const lon = center.longitude;
    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; }
      .leaflet-popup-content-wrapper { border-radius: 10px; }
      .popup-title { font-weight: 600; margin-bottom: 4px; }
      .popup-actions { display: flex; gap: 8px; margin-top: 8px; }
      .popup-btn { padding: 6px 10px; border-radius: 6px; background: #E8F3F1; color: #0F8A83; font-size: 12px; border: none; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const RN = window.ReactNativeWebView;
      const map = L.map('map').setView([${lat}, ${lon}], 12);
      const centerLat = ${lat};
      const centerLon = ${lon};
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      // Geoapify Places API (free tier) to fetch hospitals near the center
      const geoapifyKey = 'b3ee13e8a3e54871a1f0216ce601b1cd';
      const url = 'https://api.geoapify.com/v2/places' +
        '?categories=healthcare.hospital' +
        '&filter=' + encodeURIComponent('circle:' + centerLon + ',' + centerLat + ',15000') +
        '&bias=' + encodeURIComponent('proximity:' + centerLon + ',' + centerLat) +
        '&limit=50' +
        '&apiKey=' + geoapifyKey;

      fetch(url)
        .then(r => r.json())
        .then(data => {
          (data.features || []).forEach(f => {
            try {
              const coords = f && f.geometry && f.geometry.coordinates;
              if (!coords || coords.length < 2) return;
              const lon = coords[0];
              const lat = coords[1];
              if (typeof lat !== 'number' || typeof lon !== 'number') return;
              const name = (f.properties && (f.properties.name || f.properties.address_line1)) || 'Hospital';
              const marker = L.marker([lat, lon]).addTo(map);
              const popup = document.createElement('div');
              const title = document.createElement('div');
              title.className = 'popup-title';
              title.textContent = name;
              const actions = document.createElement('div');
              actions.className = 'popup-actions';
              const dirBtn = document.createElement('button');
              dirBtn.className = 'popup-btn';
              dirBtn.textContent = 'Directions';
              dirBtn.onclick = () => RN && RN.postMessage(JSON.stringify({ type: 'openDirections', name, lat, lon }));
              actions.appendChild(dirBtn);
              popup.appendChild(title);
              popup.appendChild(actions);
              marker.bindPopup(popup);
            } catch (e) {}
          });
        })
        .catch(err => {
          RN && RN.postMessage(JSON.stringify({ type: 'error', message: String(err) }));
        });
    </script>
  </body>
</html>`;
    return html;
  }, [center]);

  const handleWebMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'openDirections' && typeof data.lat === 'number' && typeof data.lon === 'number') {
        const url = Platform.select({
          ios: `maps://app?daddr=${data.lat},${data.lon}`,
          android: `geo:${data.lat},${data.lon}?q=${encodeURIComponent(data.name || 'Hospital')}`,
          default: `https://www.google.com/maps?q=${data.lat},${data.lon}`,
        }) as string;
        Linking.openURL(url);
      }
    } catch {}
  };
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#0F8A83" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hospital Map</Text>
        <TouchableOpacity onPress={centerOnUserLocation}>
          <Ionicons name="locate" size={24} color="#0F8A83" />
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <WebView
          originWhitelist={["*"]}
          source={{ html: mapHtml }}
          style={styles.webview}
          onMessage={handleWebMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          setSupportMultipleWindows={false}
          startInLoadingState={true}
          onError={(e) => console.log('WebView error:', e.nativeEvent)}
          onHttpError={(e) => console.log('WebView HTTP error:', e.nativeEvent)}
        />
      </View>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  content: { flex: 1, paddingHorizontal: 20 },
  mapContainer: { flex: 1 },
  webview: { flex: 1 },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#333' },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F3F1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  locationButtonText: { fontSize: 14, color: '#0F8A83', marginLeft: 6 },
  hospitalList: { flex: 1 },
  hospitalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  hospitalIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F3F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  hospitalInfo: { flex: 1 },
  hospitalName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  hospitalAddress: { fontSize: 14, color: '#666', marginBottom: 4 },
  coordinates: { fontSize: 12, color: '#0F8A83' },
  hospitalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F3F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HospitalMapScreen;
