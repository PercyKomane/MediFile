import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { listMedicines, getPopularMedicines, getSaleMedicines, getMedicineCategories, Medicine, addToCart, getMyCart, getMedicineById } from '../../api/pharmacy';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PharmacyScreenProps {
  navigation: any;
  route?: any;
}

const PharmacyScreen = ({ navigation, route }: PharmacyScreenProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [popularMedicines, setPopularMedicines] = useState<Medicine[]>([]);
  const [saleMedicines, setSaleMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [badgeScale] = useState(new Animated.Value(0));
  const [recentlyViewed, setRecentlyViewed] = useState<Medicine[]>([]);
  const [recommended, setRecommended] = useState<Medicine[]>([]);
  const [otcOnly, setOtcOnly] = useState(false);
  const [rxOnly, setRxOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_low' | 'price_high'>('relevance');
  const contentOpacity = useState(new Animated.Value(0))[0];
  const { token } = useAuth();

  useEffect(() => {
    loadData();
    if (token) {
      loadCartCount();
    }
  }, [token]);

  useEffect(() => {
    const category = route?.params?.preselectedCategory;
    const prefill = route?.params?.prefillSearch;
    if (category) {
      setSelectedCategory(category);
      handleCategoryFilter(category);
    }
    if (typeof prefill === 'string') {
      setSearchQuery(prefill);
    }
  }, [route?.params]);

  useEffect(() => {
    const loadRecent = async () => {
      try {
        const raw = await AsyncStorage.getItem('recent_medicine_ids');
        const ids: number[] = raw ? JSON.parse(raw) : [];
        if (ids.length === 0) {
          setRecentlyViewed([]);
          setRecommended([]);
          return;
        }
        const uniqueIds = Array.from(new Set(ids)).slice(0, 10);
        const results = await Promise.all(uniqueIds.map((id) => getMedicineById(id).catch(() => null)));
        const filtered = results.filter(Boolean) as Medicine[];
        setRecentlyViewed(filtered);
        const recentCats = Array.from(new Set(filtered.map(m => m.category)));
        const rec = medicines.filter(m => recentCats.includes(m.category) && !filtered.find(r => r.medicine_id === m.medicine_id)).slice(0, 10);
        setRecommended(rec.length ? rec : saleMedicines.slice(0, 10));
      } catch (e) {
        setRecentlyViewed([]);
        setRecommended([]);
      }
    };
    loadRecent();
  }, [medicines, saleMedicines]);

  const loadData = async () => {
    try {
      setLoading(true);
      contentOpacity.setValue(0);
      const [medicinesData, popularData, saleData, categoriesData] = await Promise.all([
        listMedicines(),
        getPopularMedicines(),
        getSaleMedicines(),
        getMedicineCategories(),
      ]);
      setMedicines(medicinesData);
      setPopularMedicines(popularData);
      setSaleMedicines(saleData);
      const uniqueCategories = [...new Set(categoriesData as string[])];
      setCategories(uniqueCategories);
      Animated.timing(contentOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    } catch (error) {
      console.error('Failed to load pharmacy data:', error);
      Alert.alert('Error', 'Failed to load pharmacy data');
    } finally {
      setLoading(false);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await loadData();
      return;
    }
    try {
      const searchResults = await listMedicines({ search: searchQuery });
      setMedicines(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      Alert.alert('Error', 'Search failed');
    }
  };

  const handleClearSearch = async () => {
    setSearchQuery('');
    await loadData();
  };

  const handleCategoryFilter = async (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory('');
      await loadData();
      return;
    }
    setSelectedCategory(category);
    try {
      const filteredResults = await listMedicines({ category });
      setMedicines(filteredResults);
    } catch (error) {
      console.error('Category filter failed:', error);
      Alert.alert('Error', 'Failed to filter by category');
    }
  };

  const handleAddToCart = async (medicine: Medicine) => {
    if (!token) {
      Alert.alert('Login Required', 'Please log in to add items to cart');
      return;
    }
    try {
      await addToCart(medicine.medicine_id, 1);
      Animated.sequence([
        Animated.timing(badgeScale, { toValue: 1.2, duration: 200, useNativeDriver: true }),
        Animated.timing(badgeScale, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      await loadCartCount();
      Alert.alert('Success', `${medicine.name} added to cart!`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  const renderMedicineCard = ({ item, variant = 'rail' }: { item: Medicine; variant?: 'rail' | 'grid' }) => (
    <TouchableOpacity
      style={[styles.medicineCardBase, variant === 'grid' ? styles.medicineCardGrid : styles.medicineCardRail]}
      onPress={() => navigation.navigate('MedicineDetail', { medicine: item })}
    >
      <View style={[styles.medicineImage, styles.placeholderImage]}>
        <Ionicons name="medical" size={40} color="#199A8E" />
        <Text style={styles.placeholderText}>{item.name}</Text>
      </View>
      <View style={styles.medicineInfo}>
        <View style={styles.rowBetween}>
          <Text style={styles.medicineName} numberOfLines={2}>{item.name}</Text>
          <View style={[styles.badge, item.is_prescription_required ? styles.rxBadge : styles.otcBadge]}>
            <Text style={[styles.badgeText, item.is_prescription_required ? styles.rxBadgeText : styles.otcBadgeText]}>
              {item.is_prescription_required ? 'Rx' : 'OTC'}
            </Text>
          </View>
        </View>
        <Text style={styles.medicineStrength}>{item.strength}</Text>
        <View style={styles.priceContainer}>
          {item.original_price && parseFloat(item.original_price) > parseFloat(item.price) ? (
            <>
              <Text style={styles.originalPrice}>R {item.original_price}</Text>
              <Text style={styles.salePrice}>R {item.price}</Text>
              <View style={styles.savingsPill}>
                <Text style={styles.savingsPillText}>
                  -{Math.round(((parseFloat(item.original_price) - parseFloat(item.price)) / parseFloat(item.original_price)) * 100)}%
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.price}>R {item.price}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => handleAddToCart(item)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      style={[styles.categoryItem, selectedCategory === item && styles.selectedCategoryItem]}
      onPress={() => handleCategoryFilter(item)}
    >
      <Text style={[styles.categoryText, selectedCategory === item && styles.selectedCategoryText]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderSectionHeader = (title: string, onSeeAll?: () => void) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAllText}>Clear filter</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const filteredAndSorted = medicines
    .filter(m => (otcOnly ? !m.is_prescription_required : true)
      && (rxOnly ? m.is_prescription_required : true)
      && (inStockOnly ? m.stock_quantity > 0 : true))
    .sort((a, b) => {
      if (sortBy === 'price_low') return parseFloat(a.price) - parseFloat(b.price);
      if (sortBy === 'price_high') return parseFloat(b.price) - parseFloat(a.price);
      return 0;
    });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#0F8A83" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pharmacy</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.cartButton}>
          <Ionicons name="cart-outline" size={24} color="#0F8A83" />
          {cartItemCount > 0 && (
            <Animated.View style={[styles.cartBadge, { transform: [{ scale: badgeScale }] }]}>
              <Text style={styles.cartBadgeText}>{cartItemCount > 99 ? '99+' : cartItemCount}</Text>
            </Animated.View>
          )}
        </TouchableOpacity>
      </View>

      <Animated.ScrollView style={[styles.content, { opacity: contentOpacity }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search drugs, category..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <Ionicons name="close-circle" size={18} color="#aaa" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Filters */}
        <View style={styles.filtersRow}>
          <TouchableOpacity style={[styles.filterChip, otcOnly && styles.filterChipActive]} onPress={() => { setOtcOnly(!otcOnly); if (!otcOnly) setRxOnly(false); }}>
            <Text style={[styles.filterChipText, otcOnly && styles.filterChipTextActive]}>OTC</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, rxOnly && styles.filterChipActive]} onPress={() => { setRxOnly(!rxOnly); if (!rxOnly) setOtcOnly(false); }}>
            <Text style={[styles.filterChipText, rxOnly && styles.filterChipTextActive]}>Prescription</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, inStockOnly && styles.filterChipActive]} onPress={() => setInStockOnly(!inStockOnly)}>
            <Text style={[styles.filterChipText, inStockOnly && styles.filterChipTextActive]}>In stock</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={[styles.filterChip, styles.sortChip]} onPress={() => setSortBy(sortBy === 'price_low' ? 'price_high' : sortBy === 'price_high' ? 'relevance' : 'price_low')}>
            <Text style={styles.sortChipText}>{sortBy === 'relevance' ? 'Sort: Relevance' : sortBy === 'price_low' ? 'Sort: Price ↑' : 'Sort: Price ↓'}</Text>
          </TouchableOpacity>
        </View>

        {/* Prescription Upload Section */}
        <View style={styles.prescriptionCard}>
          <View style={styles.prescriptionContent}>
            <View style={[styles.prescriptionImage, styles.prescriptionIconContainer]}>
              <Ionicons name="document-text" size={30} color="#199A8E" />
            </View>
            <View style={styles.prescriptionText}>
              <Text style={styles.prescriptionTitle}>Order quickly with Prescription</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.uploadButton}>
            <Text style={styles.uploadButtonText}>Upload Prescription</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item, index) => `${item}-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
            scrollEnabled={true}
          />
        </View>

        {/* Recently viewed */}
        {recentlyViewed.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader('Recently viewed')}
            <FlatList
              data={recentlyViewed}
              renderItem={({item}) => renderMedicineCard({ item, variant: 'rail' })}
              keyExtractor={(item) => item.medicine_id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.medicineList}
              scrollEnabled={true}
            />
          </View>
        )}

        {/* For you */}
        {recommended.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader('For you')}
            <FlatList
              data={recommended.slice(0, 10)}
              renderItem={({item}) => renderMedicineCard({ item, variant: 'rail' })}
              keyExtractor={(item) => item.medicine_id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.medicineList}
              scrollEnabled={true}
            />
          </View>
        )}

        {/* Popular Products */}
        {popularMedicines.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader('Popular Product')}
            <FlatList
              data={popularMedicines.slice(0, 3)}
              renderItem={({item}) => renderMedicineCard({ item, variant: 'rail' })}
              keyExtractor={(item) => item.medicine_id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.medicineList}
              scrollEnabled={true}
            />
          </View>
        )}

        {/* Products on Sale */}
        {saleMedicines.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader('Product on Sale')}
            <FlatList
              data={saleMedicines.slice(0, 3)}
              renderItem={({item}) => renderMedicineCard({ item, variant: 'rail' })}
              keyExtractor={(item) => item.medicine_id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.medicineList}
              scrollEnabled={true}
            />
          </View>
        )}

        {/* All Medicines */}
        <View style={styles.section}>
          {renderSectionHeader(
            selectedCategory ? `${selectedCategory} Medicines` : 'All Medicines',
            selectedCategory ? () => { setSelectedCategory(''); loadData(); } : undefined
          )}
          {filteredAndSorted.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 30 }}>
              <Ionicons name="medkit-outline" size={48} color="#ccc" />
              <Text style={{ marginTop: 10, color: '#666' }}>No medicines match your filters.</Text>
              <TouchableOpacity onPress={async () => { setOtcOnly(false); setRxOnly(false); setInStockOnly(false); setSortBy('relevance'); setSelectedCategory(''); setSearchQuery(''); await loadData(); }} style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#199A8E', borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Reset filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.medicineGrid}>
              {filteredAndSorted.map((item) => (
                <View key={item.medicine_id.toString()} style={styles.gridItem}>
                  {renderMedicineCard({ item, variant: 'grid' })}
                </View>
              ))}
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  content: { flex: 1 },
  searchContainer: { paddingHorizontal: 20, paddingVertical: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 12 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#333' },
  filtersRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, backgroundColor: '#f8f8f8', borderRadius: 16, borderWidth: 1, borderColor: '#eee' },
  filterChipActive: { backgroundColor: '#F0F9F8', borderColor: '#199A8E' },
  filterChipText: { fontSize: 12, color: '#666' },
  filterChipTextActive: { color: '#199A8E', fontWeight: '600' },
  sortChip: { backgroundColor: '#fff' },
  sortChipText: { fontSize: 12, color: '#333', fontWeight: '600' },
  prescriptionCard: { marginHorizontal: 20, marginBottom: 20, backgroundColor: '#f8f9fa', borderRadius: 12, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prescriptionContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  prescriptionImage: { width: 60, height: 60, borderRadius: 8, marginRight: 15 },
  prescriptionIconContainer: { backgroundColor: '#f8f9fa', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e9ecef' },
  prescriptionText: { flex: 1 },
  prescriptionTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  uploadButton: { backgroundColor: '#199A8E', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  uploadButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  categoriesContainer: { marginBottom: 20 },
  categoriesList: { paddingHorizontal: 20 },
  categoryItem: { paddingHorizontal: 20, paddingVertical: 10, marginRight: 10, backgroundColor: '#f8f8f8', borderRadius: 20 },
  selectedCategoryItem: { backgroundColor: '#199A8E' },
  categoryText: { fontSize: 14, color: '#666' },
  selectedCategoryText: { color: '#fff', fontWeight: '600' },
  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  seeAllText: { fontSize: 14, color: '#0F8A83', fontWeight: '500' },
  medicineList: { paddingHorizontal: 20 },
  medicineCardBase: { backgroundColor: '#fff', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  medicineCardRail: { width: 160, marginRight: 15 },
  medicineCardGrid: { width: '100%' },
  medicineImage: { width: '100%', height: 120, borderRadius: 8, marginBottom: 10 },
  medicineInfo: { flex: 1 },
  medicineName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4, flex: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  medicineStrength: { fontSize: 12, color: '#666', marginBottom: 8 },
  priceContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  price: { fontSize: 16, fontWeight: '700', color: '#0F8A83' },
  originalPrice: { fontSize: 14, color: '#999', textDecorationLine: 'line-through', marginRight: 8 },
  salePrice: { fontSize: 16, fontWeight: '700', color: '#e74c3c', marginRight: 6 },
  savingsPill: { backgroundColor: '#FDEDEC', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  savingsPillText: { color: '#C0392B', fontSize: 12, fontWeight: '700' },
  addButton: { backgroundColor: '#199A8E', width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  medicineGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
  gridItem: { width: '48%', marginBottom: 15 },
  placeholderImage: { backgroundColor: '#f8f9fa', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e9ecef' },
  placeholderText: { fontSize: 10, color: '#666', textAlign: 'center', marginTop: 8, fontWeight: '500' },
  cartButton: { position: 'relative' },
  cartBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#e74c3c', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  cartBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  rxBadge: { backgroundColor: '#FDEDEC' },
  otcBadge: { backgroundColor: '#E8F8F5' },
  badgeText: { fontSize: 10, fontWeight: '700' },
  rxBadgeText: { color: '#C0392B' },
  otcBadgeText: { color: '#17A589' },
});

export default PharmacyScreen;
