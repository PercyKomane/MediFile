import { ImageSourcePropType } from 'react-native';
import { Medicine } from '../api/pharmacy';

// Map medicine names (lowercase) to local asset requires.
// Add images under src/assets/images/medicines and register here, e.g.:
// 'paracetamol': require('../assets/images/medicines/paracetamol.png'),
// 'ibuprofen': require('../assets/images/medicines/ibuprofen.png'),
const localMedicineImages: Record<string, ImageSourcePropType> = {
  // Populate as you add assets. Leave empty if none yet.
};

export function getMedicineImageSource(medicine: Medicine): ImageSourcePropType | null {
  const key = (medicine.name || '').trim().toLowerCase();
  const local = localMedicineImages[key];
  if (local) return local;
  if (medicine.image_url) return { uri: medicine.image_url } as any;
  return null;
}


