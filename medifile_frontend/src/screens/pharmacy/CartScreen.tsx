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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMyCart, updateCartItem, removeCartItem, clearCart, Cart, CartItem } from '../../api/pharmacy';
import { useAuth } from '../../context/AuthContext';

interface CartScreenProps {
  navigation: any;
}

const CartScreen = ({ navigation }: CartScreenProps) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    if (!token) {
      Alert.alert('Login Required', 'Please log in to view your cart');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const cartData = await getMyCart();
      setCart(cartData);
    } catch (error) {
      console.error('Failed to load cart:', error);
      Alert.alert('Error', 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCart();
    setRefreshing(false);
  };

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    try {
      await updateCartItem(itemId, newQuantity);
      await loadCart(); // Reload cart to get updated data
    } catch (error) {
      console.error('Failed to update quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeCartItem(itemId);
              await loadCart();
            } catch (error) {
              console.error('Failed to remove item:', error);
              Alert.alert('Error', 'Failed to remove item');
            }
          },
        },
      ]
    );
  };

  const handleClearCart = async () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to clear your entire cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCart();
              await loadCart();
            } catch (error) {
              console.error('Failed to clear cart:', error);
              Alert.alert('Error', 'Failed to clear cart');
            }
          },
        },
      ]
    );
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty');
      return;
    }

    navigation.navigate('Checkout', {
      items: cart.items.map(item => ({
        medicine: item.medicine,
        quantity: item.quantity,
      })),
      isDirectPurchase: false,
    });
  };

  const renderCartItem = (item: CartItem) => (
    <View key={item.cart_item_id} style={styles.cartItem}>
      {/* Medicine Image */}
      <View style={styles.imageContainer}>
        <View style={[styles.medicineImage, styles.placeholderImage]}>
          <Ionicons name="medical" size={30} color="#199A8E" />
          <Text style={styles.placeholderText}>{item.medicine.name}</Text>
        </View>
      </View>

      {/* Medicine Info */}
      <View style={styles.itemInfo}>
        <Text style={styles.medicineName} numberOfLines={2}>
          {item.medicine.name}
        </Text>
        <Text style={styles.medicineStrength}>{item.medicine.strength}</Text>
        
        {/* Price */}
        <View style={styles.priceContainer}>
          {item.medicine.original_price && item.medicine.original_price > item.medicine.price ? (
            <>
              <Text style={styles.originalPrice}>R {item.medicine.original_price}</Text>
              <Text style={styles.salePrice}>R {item.medicine.price}</Text>
            </>
          ) : (
            <Text style={styles.price}>R {item.medicine.price}</Text>
          )}
        </View>
      </View>

      {/* Quantity Controls */}
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={[styles.quantityButton, item.quantity <= 1 && styles.disabledButton]}
          onPress={() => handleUpdateQuantity(item.cart_item_id, item.quantity - 1)}
          disabled={item.quantity <= 1}
        >
          <Ionicons name="remove" size={16} color={item.quantity <= 1 ? "#ccc" : "#333"} />
        </TouchableOpacity>
        
        <Text style={styles.quantityText}>{item.quantity}</Text>
        
        <TouchableOpacity
          style={[styles.quantityButton, item.quantity >= item.medicine.stock_quantity && styles.disabledButton]}
          onPress={() => handleUpdateQuantity(item.cart_item_id, item.quantity + 1)}
          disabled={item.quantity >= item.medicine.stock_quantity}
        >
          <Ionicons name="add" size={16} color={item.quantity >= item.medicine.stock_quantity ? "#ccc" : "#333"} />
        </TouchableOpacity>
      </View>

      {/* Subtotal */}
      <View style={styles.subtotalContainer}>
        <Text style={styles.subtotalLabel}>Subtotal:</Text>
        <Text style={styles.subtotalPrice}>R {item.subtotal}</Text>
      </View>

      {/* Remove Button */}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveItem(item.cart_item_id)}
      >
        <Ionicons name="trash-outline" size={20} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#0F8A83" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cart</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#0F8A83" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cart</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add some medicines to get started</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('Pharmacy')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#0F8A83" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart ({cart.items.length})</Text>
        <TouchableOpacity onPress={handleClearCart}>
          <Ionicons name="trash-outline" size={24} color="#e74c3c" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Cart Items */}
        <View style={styles.itemsContainer}>
          {cart.items.map(renderCartItem)}
        </View>

        {/* Order Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>R {cart.total_amount}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee:</Text>
            <Text style={styles.summaryValue}>R 50.00</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax:</Text>
            <Text style={styles.summaryValue}>R {(parseFloat(cart.total_amount) * 0.15).toFixed(2)}</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>
              R {(parseFloat(cart.total_amount) + 50 + (parseFloat(cart.total_amount) * 0.15)).toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.checkoutContainer}>
        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
          <Ionicons name="card-outline" size={20} color="#fff" />
          <Text style={styles.checkoutButtonText}>
            Proceed to Checkout - R {(parseFloat(cart.total_amount) + 50 + (parseFloat(cart.total_amount) * 0.15)).toFixed(2)}
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: '#199A8E',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  itemsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    marginRight: 15,
  },
  medicineImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  placeholderText: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  medicineStrength: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 15,
    minWidth: 20,
    textAlign: 'center',
  },
  subtotalContainer: {
    alignItems: 'flex-end',
    marginRight: 15,
  },
  subtotalLabel: {
    fontSize: 12,
    color: '#666',
  },
  subtotalPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F8A83',
  },
  removeButton: {
    padding: 5,
  },
  summaryContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F8A83',
  },
  checkoutContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#199A8E',
    paddingVertical: 15,
    borderRadius: 8,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CartScreen;
