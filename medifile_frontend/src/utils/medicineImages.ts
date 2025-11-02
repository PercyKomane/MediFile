import { ImageSourcePropType } from 'react-native';
import { Medicine } from '../api/pharmacy';

// Map medicine names (lowercase) to local asset requires.
// Add images under src/assets/images/medicines and register here, e.g.:
// 'paracetamol': require('../assets/images/medicines/paracetamol.png'),
// 'ibuprofen': require('../assets/images/medicines/ibuprofen.png'),
const localMedicineImages: Record<string, ImageSourcePropType> = {
  'paracetamol': require('../assets/images/medifileMedicines/paracetamol.jpeg'),
  'ibuprofen': require('../assets/images/medifileMedicines/Ibuprofen.jpeg'),
  'amoxicillin': require('../assets/images/medifileMedicines/Amoxicillin.jpeg'),
  'amoxicillin-clavulanate': require('../assets/images/medifileMedicines/Amoxicillin-Clavulanate.jpeg'),
  'azithromycin': require('../assets/images/medifileMedicines/Azithromycin.jpeg'),
  'omeprazole': require('../assets/images/medifileMedicines/Omeprazole.jpeg'),
  'lansoprazole': require('../assets/images/medifileMedicines/Lansoprazole.jpeg'),
  'cetirizine': require('../assets/images/medifileMedicines/Cetirizine.jpeg'),
  'loratadine': require('../assets/images/medifileMedicines/Loratadine.jpeg'),
  'vitamin c': require('../assets/images/medifileMedicines/Vitamin C.jpeg'),
  'vitamin d3': require('../assets/images/medifileMedicines/Vitamin D3.jpeg'),
  'zinc': require('../assets/images/medifileMedicines/Zinc.jpeg'),
  'dextromethorphan': require('../assets/images/medifileMedicines/Dextromethorphan.jpeg'),
  'salbutamol inhaler': require('../assets/images/medifileMedicines/Salbutamol Inhaler.jpeg'),
  'eye drops (lubricant)': require('../assets/images/medifileMedicines/Eye Drops (Lubricant).jpeg'),
  'hydrocortisone cream': require('../assets/images/medifileMedicines/Hydrocortisone Cream.jpeg'),
  'clotrimazole cream': require('../assets/images/medifileMedicines/Clotrimazole Cream.jpeg'),
  'diclofenac gel': require('../assets/images/medifileMedicines/Diclofenac Gel.png'),
  'naproxen': require('../assets/images/medifileMedicines/Naproxen.jpeg'),
  'atorvastatin': require('../assets/images/medifileMedicines/Atorvastatin.jpeg'),
  'amlodipine': require('../assets/images/medifileMedicines/Amlodipine.jpeg'),
  'losartan': require('../assets/images/medifileMedicines/Losartan.jpeg'),
  'captopril': require('../assets/images/medifileMedicines/Captopril.jpeg'),
  'metformin': require('../assets/images/medifileMedicines/Metformin.jpeg'),
  'gliclazide': require('../assets/images/medifileMedicines/Gliclazide.jpeg'),
  'insulin glargine': require('../assets/images/medifileMedicines/Insulin Glargine.jpeg'),
  'folic acid': require('../assets/images/medifileMedicines/Folic Acid.jpeg'),
  'aspirin ec': require('../assets/images/medifileMedicines/Aspirin EC.jpeg'),
  'probiotic capsules': require('../assets/images/medifileMedicines/Probiotic Capsules.jpeg'),
  'oral rehydration salts': require('../assets/images/medifileMedicines/Oral Rehydration Salts.jpeg'),
};

export function getMedicineImageSource(medicine: Medicine): ImageSourcePropType | null {
  const key = (medicine.name || '').trim().toLowerCase();
  const local = localMedicineImages[key];
  if (local) return local;
  if (medicine.image_url) return { uri: medicine.image_url } as any;
  return null;
}


