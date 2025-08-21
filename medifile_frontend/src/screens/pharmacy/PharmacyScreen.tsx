import React, { useState, useEffect } from 'react';
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
import { listMedicines, getPopularMedicines, getSaleMedicines, getMedicineCategories, Medicine, addToCart, getMyCart } from '../../api/pharmacy';
import { useAuth } from '../../context/AuthContext';

interface PharmacyScreenProps {
  navigation: any;
}

const PharmacyScreen = ({ navigation }: PharmacyScreenProps) => {
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
  const { token } = useAuth();

  useEffect(() => {
    loadData();
    if (token) {
      loadCartCount();
    }
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [medicinesData, popularData, saleData, categoriesData] = await Promise.all([
        listMedicines(),
        getPopularMedicines(),
        getSaleMedicines(),
        getMedicineCategories(),
      ]);
      
      setMedicines(medicinesData);
      setPopularMedicines(popularData);
      setSaleMedicines(saleData);
               // Remove duplicates from categories
         const uniqueCategories = [...new Set(categoriesData as string[])];
         setCategories(uniqueCategories);
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

           const handleCategoryFilter = async (category: string) => {
      console.log('Filtering by category:', category);
      console.log('Current selected category:', selectedCategory);
      
      // If clicking the same category, clear the filter
      if (selectedCategory === category) {
        console.log('Clearing filter - same category clicked');
        setSelectedCategory('');
        await loadData(); // Reload all medicines
        return;
      }
      
      setSelectedCategory(category);
      try {
        console.log('Making API call for category:', category);
        const filteredResults = await listMedicines({ category });
        console.log('Filtered results:', filteredResults.length, 'medicines');
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
      
      // Animate the badge
      Animated.sequence([
        Animated.timing(badgeScale, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(badgeScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Update cart count
      await loadCartCount();
      
      Alert.alert('Success', `${medicine.name} added to cart!`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

           const renderMedicineCard = ({ item }: { item: Medicine }) => (
      <TouchableOpacity
        style={styles.medicineCard}
        onPress={() => navigation.navigate('MedicineDetail', { medicine: item })}
      >
       <View style={[styles.medicineImage, styles.placeholderImage]}>
         <Ionicons name="medical" size={40} color="#199A8E" />
         <Text style={styles.placeholderText}>{item.name}</Text>
       </View>
      <View style={styles.medicineInfo}>
        <Text style={styles.medicineName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.medicineStrength}>{item.strength}</Text>
        <View style={styles.priceContainer}>
          {item.original_price && item.original_price > item.price ? (
            <>
              <Text style={styles.originalPrice}>R {item.original_price}</Text>
              <Text style={styles.salePrice}>R {item.price}</Text>
            </>
          ) : (
            <Text style={styles.price}>R {item.price}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAddToCart(item)}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item && styles.selectedCategoryItem,
      ]}
      onPress={() => handleCategoryFilter(item)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item && styles.selectedCategoryText,
        ]}
      >
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
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
          </View>
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

                 {/* Popular Products */}
         {popularMedicines.length > 0 && (
           <View style={styles.section}>
             {renderSectionHeader('Popular Product')}
                          <FlatList
                data={popularMedicines.slice(0, 3)}
                renderItem={renderMedicineCard}
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
                renderItem={renderMedicineCard}
                keyExtractor={(item) => item.medicine_id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.medicineList}
                scrollEnabled={true}
              />
           </View>
         )}

                                   {/* All Medicines */}
          {medicines.length > 0 && (
            <View style={styles.section}>
              {renderSectionHeader(
                selectedCategory ? `${selectedCategory} Medicines` : 'All Medicines',
                selectedCategory ? () => {
                  setSelectedCategory('');
                  loadData();
                } : undefined
              )}
              <View style={styles.medicineGrid}>
                {medicines.map((item) => (
                  <View key={item.medicine_id.toString()} style={styles.medicineCard}>
                    {renderMedicineCard({ item })}
                  </View>
                ))}
              </View>
            </View>
          )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  prescriptionCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prescriptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
     prescriptionImage: {
     width: 60,
     height: 60,
     borderRadius: 8,
     marginRight: 15,
   },
   prescriptionIconContainer: {
     backgroundColor: '#f8f9fa',
     alignItems: 'center',
     justifyContent: 'center',
     borderWidth: 1,
     borderColor: '#e9ecef',
   },
  prescriptionText: {
    flex: 1,
  },
  prescriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
     uploadButton: {
     backgroundColor: '#199A8E',
     paddingHorizontal: 20,
     paddingVertical: 10,
     borderRadius: 20,
   },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
  },
     selectedCategoryItem: {
     backgroundColor: '#199A8E',
   },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#0F8A83',
    fontWeight: '500',
  },
  medicineList: {
    paddingHorizontal: 20,
  },
  medicineCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicineImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  medicineStrength: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F8A83',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  salePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e74c3c',
  },
     addButton: {
     backgroundColor: '#199A8E',
     width: 30,
     height: 30,
     borderRadius: 15,
     alignItems: 'center',
     justifyContent: 'center',
     alignSelf: 'flex-end',
   },
  medicineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
     placeholderImage: {
     backgroundColor: '#f8f9fa',
     alignItems: 'center',
     justifyContent: 'center',
     borderWidth: 1,
     borderColor: '#e9ecef',
   },
   placeholderText: {
     fontSize: 10,
     color: '#666',
     textAlign: 'center',
     marginTop: 8,
     fontWeight: '500',
   },
   cartButton: {
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

export default PharmacyScreen;
