import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { payAppointment } from '../../api/appointments';

type AppointmentCheckoutParams = {
  appointmentId: number;
  amount?: number;
  doctorName?: string;
  dateTimeISO?: string;
};

export default function AppointmentCheckoutScreen({ navigation, route }: any) {
  const { appointmentId, amount, doctorName, dateTimeISO } = (route?.params || {}) as AppointmentCheckoutParams;
  const [reference, setReference] = useState<string>(`APPT-${appointmentId}`);
  const [paying, setPaying] = useState(false);

  const totalAmount = useMemo(() => {
    if (typeof amount === 'number' && !isNaN(amount)) return amount;
    // fallback default if not provided
    return 300;
  }, [amount]);

  const onPay = async () => {
    if (!appointmentId) {
      Alert.alert('Error', 'Missing appointment to pay.');
      return;
    }
    setPaying(true);
    try {
      await payAppointment(appointmentId, { amount: totalAmount, reference });
      Alert.alert('Success', 'Payment successful! Your appointment is confirmed.', [
        { text: 'OK', onPress: () => navigation.popToTop() }
      ]);
    } catch (e) {
      console.error('Failed to process payment:', e);
      Alert.alert('Payment Error', 'Failed to process payment. Please try again later or contact support.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#0F8A83" />
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appointment</Text>
        <View style={styles.card}>
          <Text style={styles.rowLabel}>Doctor</Text>
          <Text style={styles.rowValue}>{doctorName || 'Your selected doctor'}</Text>
          <View style={styles.divider} />
          <Text style={styles.rowLabel}>Date & Time</Text>
          <Text style={styles.rowValue}>{dateTimeISO ? new Date(dateTimeISO).toLocaleString() : 'Scheduled time'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <View style={styles.card}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>R {Number(totalAmount).toFixed(2)}</Text>
          </View>
          <View style={{ height: 12 }} />
          <Text style={styles.inputLabel}>Payment Reference (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Reference"
            value={reference}
            onChangeText={setReference}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.payButton, paying && styles.btnDisabled]} onPress={onPay} disabled={paying}>
          <Ionicons name="card-outline" size={18} color="#fff" />
          <Text style={styles.payLabel}>{paying ? 'Processing…' : `Pay R ${Number(totalAmount).toFixed(2)}`}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F3F1',
  },
  title: { fontWeight: '700', color: '#0F8A83', fontSize: 18 },
  section: { marginTop: 16 },
  sectionTitle: { fontWeight: '600', color: '#334B48', marginBottom: 12, paddingHorizontal: 16, fontSize: 16 },
  card: {
    backgroundColor: '#F3FAF9',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E8F3F1',
  },
  rowLabel: { color: '#7B8F8C', fontSize: 12 },
  rowValue: { color: '#334B48', fontWeight: '600', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#E8F3F1', marginVertical: 12 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountLabel: { color: '#334B48', fontWeight: '600' },
  amountValue: { color: '#0F8A83', fontWeight: '700' },
  inputLabel: { color: '#334B48', marginBottom: 6, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#CCE7E3',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#334B48',
    backgroundColor: '#fff',
  },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#E8F3F1', backgroundColor: '#fff' },
  payButton: { backgroundColor: '#0F8A83', paddingVertical: 14, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  btnDisabled: { backgroundColor: '#ccc' },
  payLabel: { color: '#fff', fontWeight: '700', marginLeft: 8 },
});


