import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { 
  PaymentMethod as PaymentMethodType, 
  getPaymentMethods, 
  createPaymentMethod, 
  setDefaultPaymentMethod, 
  deactivatePaymentMethod 
} from '../../api/payment';

// Helper functions moved outside component for accessibility
const getPaymentIcon = (type: string) => {
  switch (type) {
    case 'card':
      return 'card-outline';
    case 'bank':
      return 'business-outline';
    case 'wallet':
      return 'wallet-outline';
    default:
      return 'card-outline';
  }
};

const getPaymentColor = (type: string) => {
  switch (type) {
    case 'card':
      return '#4A90E2';
    case 'bank':
      return '#7ED321';
    case 'wallet':
      return '#F5A623';
    default:
      return '#4A90E2';
  }
};

const PaymentMethodScreen = ({ navigation }: any) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'card' as 'card' | 'bank' | 'wallet',
    name: '',
    number: '',
    expiry: '',
  });

  // Load payment methods on component mount
  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const methods = await getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      Alert.alert('Error', 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const refreshPaymentMethods = async () => {
    try {
      setRefreshing(true);
      await loadPaymentMethods();
    } finally {
      setRefreshing(false);
    }
  };

  const addPaymentMethod = async () => {
    if (!newPaymentMethod.name) {
      Alert.alert('Error', 'Please enter the name');
      return;
    }
    
    // Only require number for card type
    if (newPaymentMethod.type === 'card' && !newPaymentMethod.number) {
      Alert.alert('Error', 'Please enter the card number');
      return;
    }

    try {
      const paymentData = {
        type: newPaymentMethod.type,
        name: newPaymentMethod.name,
        encrypted_number: newPaymentMethod.number || '',
        expiry_date: newPaymentMethod.expiry || undefined,
      };

      await createPaymentMethod(paymentData);
      setShowAddModal(false);
      setNewPaymentMethod({ type: 'card', name: '', number: '', expiry: '' });
      Alert.alert('Success', 'Payment method added successfully');
      loadPaymentMethods(); // Refresh the list
    } catch (error) {
      console.error('Failed to add payment method:', error);
      Alert.alert('Error', 'Failed to add payment method');
    }
  };

  const setDefaultPayment = async (id: number) => {
    try {
      await setDefaultPaymentMethod(id);
      Alert.alert('Success', 'Payment method set as default');
      loadPaymentMethods(); // Refresh the list
    } catch (error) {
      console.error('Failed to set default payment method:', error);
      Alert.alert('Error', 'Failed to set default payment method');
    }
  };

  const deletePaymentMethod = (id: number) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to delete this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deactivatePaymentMethod(id);
              Alert.alert('Success', 'Payment method deleted');
              loadPaymentMethods(); // Refresh the list
            } catch (error) {
              console.error('Failed to delete payment method:', error);
              Alert.alert('Error', 'Failed to delete payment method');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#008080" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshPaymentMethods} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#008080" />
            <Text style={styles.loadingText}>Loading payment methods...</Text>
          </View>
        ) : (
          <>
            {/* Default Payment Method */}
            {paymentMethods.filter(m => m.is_default).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Default Payment Method</Text>
                {paymentMethods
                  .filter((method) => method.is_default)
                  .map((method) => (
                    <PaymentMethodCard
                      key={method.payment_method_id}
                      method={method}
                      onSetDefault={setDefaultPayment}
                      onDelete={deletePaymentMethod}
                      isDefault={true}
                    />
                  ))}
              </View>
            )}

            {/* Other Payment Methods */}
            {paymentMethods.filter(m => !m.is_default).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Other Payment Methods</Text>
                {paymentMethods
                  .filter((method) => !method.is_default)
                  .map((method) => (
                    <PaymentMethodCard
                      key={method.payment_method_id}
                      method={method}
                      onSetDefault={setDefaultPayment}
                      onDelete={deletePaymentMethod}
                      isDefault={false}
                    />
                  ))}
              </View>
            )}

            {/* Add New Payment Method */}
            <TouchableOpacity
              style={styles.addNewCard}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add-circle-outline" size={24} color="#008080" />
              <Text style={styles.addNewText}>Add New Payment Method</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Add Payment Method Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Payment Method</Text>
            <TouchableOpacity onPress={addPaymentMethod}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Payment Type Selection */}
            <View style={styles.typeSelector}>
              <Text style={styles.inputLabel}>Payment Type</Text>
              <View style={styles.typeButtons}>
                {[
                  { type: 'card', label: 'Card', icon: 'card-outline' },
                  { type: 'bank', label: 'Bank', icon: 'business-outline' },
                  { type: 'wallet', label: 'Wallet', icon: 'wallet-outline' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.type}
                    style={[
                      styles.typeButton,
                      newPaymentMethod.type === option.type && styles.typeButtonActive,
                    ]}
                    onPress={() => setNewPaymentMethod({ ...newPaymentMethod, type: option.type as any })}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={newPaymentMethod.type === option.type ? 'white' : '#008080'}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        newPaymentMethod.type === option.type && styles.typeButtonTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Payment Method Details */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name on {newPaymentMethod.type}</Text>
              <TextInput
                style={styles.input}
                value={newPaymentMethod.name}
                onChangeText={(text) => setNewPaymentMethod({ ...newPaymentMethod, name: text })}
                placeholder={`Enter name on ${newPaymentMethod.type}`}
              />
            </View>

             <View style={styles.inputGroup}>
               <Text style={styles.inputLabel}>
                 {newPaymentMethod.type === 'card' ? 'Card Number' : 
                  newPaymentMethod.type === 'bank' ? 'Account Number' : 'Wallet ID'}
                 {newPaymentMethod.type === 'card' ? ' *' : ' (Optional)'}
               </Text>
               <TextInput
                 style={styles.input}
                 value={newPaymentMethod.number}
                 onChangeText={(text) => setNewPaymentMethod({ ...newPaymentMethod, number: text })}
                 placeholder={`Enter ${newPaymentMethod.type === 'card' ? 'card' : 
                            newPaymentMethod.type === 'bank' ? 'account' : 'wallet'} number`}
                 keyboardType="numeric"
               />
             </View>

            {newPaymentMethod.type === 'card' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Expiry Date</Text>
                <TextInput
                  style={styles.input}
                  value={newPaymentMethod.expiry}
                  onChangeText={(text) => setNewPaymentMethod({ ...newPaymentMethod, expiry: text })}
                  placeholder="MM/YY"
                />
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const PaymentMethodCard = ({
  method,
  onSetDefault,
  onDelete,
  isDefault,
}: {
  method: PaymentMethodType;
  onSetDefault: (id: number) => void;
  onDelete: (id: number) => void;
  isDefault: boolean;
}) => (
  <View style={[styles.paymentCard, { borderColor: getPaymentColor(method.type) }]}>
    <View style={styles.cardHeader}>
      <View style={styles.cardInfo}>
        <View style={[styles.cardIcon, { backgroundColor: getPaymentColor(method.type) }]}>
          <Ionicons name={getPaymentIcon(method.type) as any} size={20} color="white" />
        </View>
        <View style={styles.cardDetails}>
          <Text style={styles.cardName}>{method.name}</Text>
          <Text style={styles.cardNumber}>{method.masked_number}</Text>
          {method.expiry_date && <Text style={styles.cardExpiry}>Expires: {method.expiry_date}</Text>}
        </View>
      </View>
      {isDefault && (
        <View style={styles.defaultBadge}>
          <Text style={styles.defaultText}>Default</Text>
        </View>
      )}
    </View>
    
    <View style={styles.cardActions}>
      {!isDefault && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onSetDefault(method.payment_method_id)}
        >
          <Ionicons name="star-outline" size={16} color="#008080" />
          <Text style={styles.actionText}>Set as Default</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.actionButton, styles.deleteButton]}
        onPress={() => onDelete(method.payment_method_id)}
      >
        <Ionicons name="trash-outline" size={16} color="red" />
        <Text style={[styles.actionText, { color: 'red' }]}>Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
 );

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#008080',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  paymentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  cardExpiry: {
    fontSize: 12,
    color: '#999',
  },
  defaultBadge: {
    backgroundColor: '#008080',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
  },
  deleteButton: {
    marginLeft: 15,
  },
  actionText: {
    fontSize: 12,
    color: '#008080',
    marginLeft: 4,
  },
  addNewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#008080',
    borderStyle: 'dashed',
  },
  addNewText: {
    fontSize: 16,
    color: '#008080',
    marginLeft: 10,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    fontSize: 16,
    color: '#008080',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  typeSelector: {
    marginBottom: 30,
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 5,
  },
  typeButtonActive: {
    backgroundColor: '#008080',
    borderColor: '#008080',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#008080',
    marginLeft: 5,
  },
  typeButtonTextActive: {
    color: 'white',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default PaymentMethodScreen;
