// screens/HomeScreen.tsx
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import BottomNav from '../components/BottomNav';
import NewsCard from '../components/NewsCard';
import axios from 'axios';
import { getMyCart } from '../api/pharmacy';
import { useAuth } from '../context/AuthContext';

// Note to Percy or anyone on the frontend team, replace this with data from the backend
const doctors = [
  {
    id: '1',
    name: 'Dr. Marcus Horiz.',
    specialty: 'Cardiologist',
    rating: 4.7,
    distance: '800m away',
    image: require('../assets/images/doctors/doc1.png'),
  },
  {
    id: '2',
    name: 'Dr. Maria Elena',
    specialty: 'Psychologist',
    rating: 4.9,
    distance: '1.5km away',
    image: require('../assets/images/doctors/doc2.png'),
  },
  {
    id: '3',
    name: 'Dr. Stefi Jessica',
    specialty: 'Orthopedist',
    rating: 4.8,
    distance: '2km away',
    image: require('../assets/images/doctors/doc3.png'),
  },
];

const HomeScreen = ({ navigation }: any) => {

  const [news, setNews] = useState<any[]>([]);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [badgeScale] = useState(new Animated.Value(0));
  const { token } = useAuth();

useEffect(() => {
  const fetchNews = async () => {
    try {
      const res = await axios.get(
        'https://gnews.io/api/v4/search?q=health&lang=en&apikey=4cc17e19799462311134681d88f75616'
      );
      setNews(res.data.articles);
    } catch (err) {
      console.error('Error fetching news:', err);
    }
  };

  const loadCartCount = async () => {
    if (!token) return;
    
    try {
      const cartData = await getMyCart();
      const totalItems = cartData.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCartItemCount(totalItems);
    } catch (error) {
      console.error('Failed to load cart count:', error);
    }
  };

  fetchNews();
  loadCartCount();
}, [token]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Find your desire{'\n'}health solution</Text>
          <Ionicons name="notifications-outline" size={24} color="black" />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="gray" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search doctor, drugs, articles..."
            placeholderTextColor="#999"
            style={styles.searchInput}
          />
        </View>

        {/* Services Menu */}
        <View style={styles.servicesRow}>
          <TouchableOpacity style={styles.serviceIcon} onPress={() => navigation.navigate('DoctorsListForBooking')}>
            <FontAwesome5 name="user-md" size={32} color="#199A8E" />
            <Text style={styles.serviceText}>Doctor</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.serviceIcon} onPress={() => navigation.navigate('Pharmacy')}>
            <View style={styles.serviceIconContainer}>
              <MaterialCommunityIcons name="pill" size={32} color="#199A8E" />
              {cartItemCount > 0 && (
                <Animated.View 
                  style={[
                    styles.cartBadge,
                    { transform: [{ scale: badgeScale }] }
                  ]}
                >
                  <Text style={styles.cartBadgeText}>
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </Text>
                </Animated.View>
              )}
            </View>
            <Text style={styles.serviceText}>Pharmacy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.serviceIcon} onPress={() => navigation.navigate('HospitalList')}>
            <MaterialIcons name="local-hospital" size={32} color="#199A8E" />
            <Text style={styles.serviceText}>Hospital</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.serviceIcon}
            onPress={() => navigation.navigate('EmergencyRequest')}
          >
            <FontAwesome5 name="ambulance" size={32} color="#199A8E" />
            <Text style={styles.serviceText}>Ambulance</Text>
          </TouchableOpacity>
        </View>

        {/* Health Banner */}
        <View style={styles.banner}>
          <View>
            <Text style={styles.bannerTitle}>Early protection for{'\n'} your family health</Text>
            <TouchableOpacity style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>Learn more</Text>
            </TouchableOpacity>
          </View>
          <Image source={require('../assets/images/doctors/banner_doc.png')} style={styles.bannerImage} />
        </View>

        {/* Top Doctor */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Doctors</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={doctors}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 15 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={item.image} style={styles.cardImage} />
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardSpecialty}>{item.specialty}</Text>
              <View style={styles.cardRow}>
                <Text style={styles.rating}><AntDesign name="star" size={12} color="#199A8E" /> {item.rating}</Text>
                
                <Text style={styles.distance}><FontAwesome6 name="location-dot" size={12} color="#A1A8B0" /> {item.distance}</Text>
              </View>
            </View>
          )}
        />

        {/* News Section Header */}
        <View style={styles.newsSectionHeader}>
          <Text style={styles.newsSectionTitle}>Latest Medical News</Text>
        </View>

        {/* News Cards */}
        <View style={styles.newsList}>
          {news.slice(0, 5).map((item, index) => (
            <NewsCard
              key={index}
              title={item.title}
              image={item.image}
              description={item.description}
              date={item.publishedAt}
              article={item}
              onPress={(article) => navigation.navigate('NewsDetail', { article })}
            />
          ))}
        </View>



      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f1f1',
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  servicesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  serviceIcon: {
    alignItems: 'center',
    
  },
  serviceText: {
    marginTop: 6,
    fontSize: 12,
    color: '#A1A8B0',
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: '#E8F3F1',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: "90%",
    height: 135,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#101623',
  },
  bannerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#199A8E',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 6,
    width: 97,
    height: 29,
  },
  bannerButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  bannerImage: {
    width: 121,
    height: 135,
    resizeMode: 'contain',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAll: {
    color: '#008080',
    fontSize: 14,
  },
  card: {
    width: 140,
    borderWidth: 1,
    borderColor: "#E8F3F1",
    backgroundColor: '#fff',
    borderRadius: 10,
    marginRight: 15,
    padding: 10,
    elevation: 2,
  },
  cardImage: {
    width: 71,
    height: 71,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 10,
  },
  cardName: {
    fontWeight: 'bold',
    fontSize: 14,
    // textAlign: 'center',
  },
  cardSpecialty: {
    fontSize: 12,
    // textAlign: 'center',
    color: '#666',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  rating: {
    backgroundColor: "#E8F3F1",
    borderRadius: 2,
    fontSize: 11,
    color: '#199A8E',
    padding: 2,
  },
  distance: {
    fontSize: 11,
    color: '#ADADAD',
    padding: 2,
  },
  newsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  newsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#199A8E',
  },
  newsSeeAll: {
    fontSize: 14,
    color: '#199A8E',
  },
  newsList: {
  paddingHorizontal: 15,
},
  serviceIconContainer: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
