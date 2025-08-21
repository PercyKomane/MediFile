import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { checkout, Medicine } from '../../api/pharmacy';
import { useAuth } from '../../context/AuthContext';

interface CheckoutItem {
  medicine: Medicine;
  quantity: number;
}

interface CheckoutScreenProps {
  navigation: any;
  route: {
    params: {
      items: CheckoutItem[];
      isDirectPurchase: boolean;
    };
  };
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ navigation, route }) => {
  const { items, isDirectPurchase } = route.params;
  const { token, user } = useAuth();
  
  // Form states
  const [shippingDetails, setShippingDetails] = useState({
    fullName: user?.first_name ? `${user.first_name} ${user.last_name}` : '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    province: '',
  });
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });
  
  const [deliveryOption, setDeliveryOption] = useState('standard');
  const [saveAddress, setSaveAddress] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.medicine.price) * item.quantity);
  }, 0);
  
  const deliveryFee = deliveryOption === 'express' ? 100 : 50;
  const tax = subtotal * 0.15;
  const total = subtotal + deliveryFee + tax;

  const handleCheckout = async () => {
    // Validate form
    if (!shippingDetails.fullName || !shippingDetails.phone || !shippingDetails.address) {
      Alert.alert('Error', 'Please fill in all required shipping details');
      return;
    }

    if (paymentMethod === 'card' && (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv)) {
      Alert.alert('Error', 'Please fill in all card details');
      return;
    }

    setProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Process checkout
      const orderData = {
        items: items.map(item => ({
          medicine_id: item.medicine.medicine_id,
          quantity: item.quantity,
        })),
        shipping_address: {
          full_name: shippingDetails.fullName,
          phone: shippingDetails.phone,
          address: shippingDetails.address,
          city: shippingDetails.city,
          postal_code: shippingDetails.postalCode,
          province: shippingDetails.province,
        },
        delivery_option: deliveryOption,
        payment_method: paymentMethod,
        total_amount: total.toFixed(2),
      };

      const order = await checkout(orderData);
      
      Alert.alert(
        'Order Successful!',
        `Your order #${order.order_id} has been placed successfully. You will receive a confirmation email shortly.`,
        [
          {
            text: 'View Orders',
            onPress: () => navigation.navigate('Orders'),
          },
          {
            text: 'Continue Shopping',
            onPress: () => navigation.navigate('Pharmacy'),
          },
        ]
      );
    } catch (error) {
      console.error('Checkout failed:', error);
      Alert.alert('Error', 'Failed to process checkout. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const renderOrderItem = (item: CheckoutItem, index: number) => (
    <View key={index} style={styles.orderItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.medicine.name}</Text>
        <Text style={styles.itemStrength}>{item.medicine.strength}</Text>
        <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
      </View>
      <Text style={styles.itemPrice}>R {(parseFloat(item.medicine.price) * item.quantity).toFixed(2)}</Text>
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
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.orderItems}>
            {items.map(renderOrderItem)}
          </View>
        </View>

        {/* Shipping Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={shippingDetails.fullName}
              onChangeText={(text) => setShippingDetails(prev => ({ ...prev, fullName: text }))}
              placeholder="Enter your full name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={shippingDetails.phone}
              onChangeText={(text) => setShippingDetails(prev => ({ ...prev, phone: text }))}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={shippingDetails.address}
              onChangeText={(text) => setShippingDetails(prev => ({ ...prev, address: text }))}
              placeholder="Enter your full address"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                value={shippingDetails.city}
                onChangeText={(text) => setShippingDetails(prev => ({ ...prev, city: text }))}
                placeholder="City"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.inputLabel}>Postal Code</Text>
              <TextInput
                style={styles.input}
                value={shippingDetails.postalCode}
                onChangeText={(text) => setShippingDetails(prev => ({ ...prev, postalCode: text }))}
                placeholder="Postal Code"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Province</Text>
            <TextInput
              style={styles.input}
              value={shippingDetails.province}
              onChangeText={(text) => setShippingDetails(prev => ({ ...prev, province: text }))}
              placeholder="Province"
            />
          </View>

          <View style={styles.saveAddressContainer}>
            <Switch
              value={saveAddress}
              onValueChange={setSaveAddress}
              trackColor={{ false: '#ddd', true: '#199A8E' }}
              thumbColor={saveAddress ? '#fff' : '#f4f3f4'}
            />
            <Text style={styles.saveAddressText}>Save this address for future orders</Text>
          </View>
        </View>

        {/* Delivery Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Options</Text>
          
          <TouchableOpacity
            style={[styles.deliveryOption, deliveryOption === 'standard' && styles.selectedDelivery]}
            onPress={() => setDeliveryOption('standard')}
          >
            <View style={styles.deliveryInfo}>
              <Text style={styles.deliveryTitle}>Standard Delivery</Text>
              <Text style={styles.deliveryDescription}>3-5 business days</Text>
            </View>
            <Text style={styles.deliveryPrice}>R 50.00</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deliveryOption, deliveryOption === 'express' && styles.selectedDelivery]}
            onPress={() => setDeliveryOption('express')}
          >
            <View style={styles.deliveryInfo}>
              <Text style={styles.deliveryTitle}>Express Delivery</Text>
              <Text style={styles.deliveryDescription}>1-2 business days</Text>
            </View>
            <Text style={styles.deliveryPrice}>R 100.00</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'card' && styles.selectedPayment]}
            onPress={() => setPaymentMethod('card')}
          >
            <Ionicons name="card-outline" size={24} color={paymentMethod === 'card' ? '#199A8E' : '#666'} />
            <Text style={[styles.paymentText, paymentMethod === 'card' && styles.selectedPaymentText]}>
              Credit/Debit Card
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'cash' && styles.selectedPayment]}
            onPress={() => setPaymentMethod('cash')}
          >
            <Ionicons name="cash-outline" size={24} color={paymentMethod === 'cash' ? '#199A8E' : '#666'} />
            <Text style={[styles.paymentText, paymentMethod === 'cash' && styles.selectedPaymentText]}>
              Cash on Delivery
            </Text>
          </TouchableOpacity>

          {paymentMethod === 'card' && (
            <View style={styles.cardDetails}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput
                  style={styles.input}
                  value={cardDetails.cardNumber}
                  onChangeText={(text) => setCardDetails(prev => ({ ...prev, cardNumber: text }))}
                  placeholder="1234 5678 9012 3456"
                  keyboardType="numeric"
                  maxLength={19}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.input}
                    value={cardDetails.expiryDate}
                    onChangeText={(text) => setCardDetails(prev => ({ ...prev, expiryDate: text }))}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    value={cardDetails.cvv}
                    onChangeText={(text) => setCardDetails(prev => ({ ...prev, cvv: text }))}
                    placeholder="123"
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cardholder Name</Text>
                <TextInput
                  style={styles.input}
                  value={cardDetails.cardholderName}
                  onChangeText={(text) => setCardDetails(prev => ({ ...prev, cardholderName: text }))}
                  placeholder="Name on card"
                />
              </View>
            </View>
          )}
        </View>

        {/* Order Total */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Total</Text>
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>R {subtotal.toFixed(2)}</Text>
          </View>
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Delivery Fee:</Text>
            <Text style={styles.totalValue}>R {deliveryFee.toFixed(2)}</Text>
          </View>
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (15%):</Text>
            <Text style={styles.totalValue}>R {tax.toFixed(2)}</Text>
          </View>
          
          <View style={[styles.totalRow, styles.finalTotal]}>
            <Text style={styles.finalTotalLabel}>Total:</Text>
            <Text style={styles.finalTotalValue}>R {total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, processing && styles.processingButton]}
          onPress={handleCheckout}
          disabled={processing}
        >
          {processing ? (
            <Text style={styles.placeOrderText}>Processing...</Text>
          ) : (
            <>
              <Ionicons name="card-outline" size={20} color="#fff" />
              <Text style={styles.placeOrderText}>Place Order - R {total.toFixed(2)}</Text>
            </>
          )}
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
  section: {
    marginHorizontal: 20,
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  orderItems: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemStrength: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F8A83',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  saveAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  saveAddressText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  deliveryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedDelivery: {
    borderColor: '#199A8E',
    backgroundColor: '#f0f9f8',
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deliveryDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  deliveryPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F8A83',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedPayment: {
    borderColor: '#199A8E',
    backgroundColor: '#f0f9f8',
  },
  paymentText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
  selectedPaymentText: {
    color: '#199A8E',
    fontWeight: '600',
  },
  cardDetails: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  finalTotal: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
    marginTop: 10,
  },
  finalTotalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  finalTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F8A83',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  placeOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#199A8E',
    paddingVertical: 15,
    borderRadius: 8,
  },
  processingButton: {
    backgroundColor: '#ccc',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CheckoutScreen;
