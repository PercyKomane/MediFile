import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Medicine, addToCart, getMyCart } from '../../api/pharmacy';
import { useAuth } from '../../context/AuthContext';

interface MedicineDetailScreenProps {
  navigation: any;
  route: {
    params: {
      medicine: Medicine;
    };
  };
}

const MedicineDetailScreen: React.FC<MedicineDetailScreenProps> = ({ navigation, route }) => {
  const { medicine } = route.params;
  const [quantity, setQuantity] = useState(1);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [badgeScale] = useState(new Animated.Value(0));
  const { token } = useAuth();

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

  useEffect(() => {
    if (token) {
      loadCartCount();
    }
  }, [token]);

  const handleAddToCart = async () => {
    if (!token) {
      Alert.alert('Login Required', 'Please log in to add items to cart');
      return;
    }

    try {
      await addToCart(medicine.medicine_id, quantity);
      
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
      
      Alert.alert('Success', `${quantity}x ${medicine.name} added to cart!`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  const handleBuyNow = () => {
    if (!token) {
      Alert.alert('Login Required', 'Please log in to purchase items');
      return;
    }
    
    // Navigate to checkout with this single item
    navigation.navigate('Checkout', {
      items: [{ medicine, quantity }],
      isDirectPurchase: true,
    });
  };

  const incrementQuantity = () => {
    if (quantity < medicine.stock_quantity) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
             {/* Header */}
       <View style={styles.header}>
         <TouchableOpacity onPress={() => navigation.goBack()}>
           <Ionicons name="chevron-back" size={24} color="#0F8A83" />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>Medicine Details</Text>
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

      <ScrollView style={styles.content}>
        {/* Medicine Image */}
        <View style={styles.imageContainer}>
          <View style={[styles.medicineImage, styles.placeholderImage]}>
            <Ionicons name="medical" size={80} color="#199A8E" />
            <Text style={styles.placeholderText}>{medicine.name}</Text>
          </View>
        </View>

        {/* Medicine Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.medicineName}>{medicine.name}</Text>
          <Text style={styles.genericName}>{medicine.generic_name}</Text>
          
          {/* Price Section */}
          <View style={styles.priceSection}>
            {medicine.original_price && medicine.original_price > medicine.price ? (
              <View style={styles.priceContainer}>
                <Text style={styles.originalPrice}>R {medicine.original_price}</Text>
                <Text style={styles.salePrice}>R {medicine.price}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    {Math.round(((medicine.original_price - medicine.price) / medicine.original_price) * 100)}% OFF
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.price}>R {medicine.price}</Text>
            )}
          </View>

          {/* Stock Status */}
          <View style={styles.stockContainer}>
            <Ionicons 
              name={medicine.stock_quantity > 0 ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={medicine.stock_quantity > 0 ? "#4CAF50" : "#f44336"} 
            />
            <Text style={[
              styles.stockText,
              { color: medicine.stock_quantity > 0 ? "#4CAF50" : "#f44336" }
            ]}>
              {medicine.stock_quantity > 0 ? `In Stock (${medicine.stock_quantity} available)` : 'Out of Stock'}
            </Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{medicine.description}</Text>
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Strength:</Text>
              <Text style={styles.detailValue}>{medicine.strength}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Form:</Text>
              <Text style={styles.detailValue}>{medicine.dosage_form}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Manufacturer:</Text>
              <Text style={styles.detailValue}>{medicine.manufacturer}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{medicine.category}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Prescription Required:</Text>
              <Text style={styles.detailValue}>
                {medicine.is_prescription_required ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>

          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity 
                style={styles.quantityButton} 
                onPress={decrementQuantity}
                disabled={quantity <= 1}
              >
                <Ionicons name="remove" size={20} color={quantity <= 1 ? "#ccc" : "#333"} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity 
                style={styles.quantityButton} 
                onPress={incrementQuantity}
                disabled={quantity >= medicine.stock_quantity}
              >
                <Ionicons name="add" size={20} color={quantity >= medicine.stock_quantity ? "#ccc" : "#333"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Total Price */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalPrice}>R {(parseFloat(medicine.price) * quantity).toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[styles.addToCartButton, !medicine.stock_quantity && styles.disabledButton]} 
          onPress={handleAddToCart}
          disabled={!medicine.stock_quantity}
        >
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Add to Cart</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.buyNowButton, !medicine.stock_quantity && styles.disabledButton]} 
          onPress={handleBuyNow}
          disabled={!medicine.stock_quantity}
        >
          <Ionicons name="card-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
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
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  medicineImage: {
    width: 250,
    height: 250,
    borderRadius: 12,
  },
  placeholderImage: {
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  placeholderText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  medicineName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  genericName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  priceSection: {
    marginBottom: 15,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F8A83',
  },
  originalPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  salePrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e74c3c',
    marginRight: 10,
  },
  discountBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stockText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  quantityButton: {
    padding: 10,
    backgroundColor: '#f8f8f8',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    minWidth: 40,
    textAlign: 'center',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F8A83',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#199A8E',
    paddingVertical: 15,
    borderRadius: 8,
    marginRight: 10,
  },
  buyNowButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F8A83',
    paddingVertical: 15,
    borderRadius: 8,
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
     buttonText: {
     color: '#fff',
     fontSize: 16,
     fontWeight: '600',
     marginLeft: 8,
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

export default MedicineDetailScreen;
