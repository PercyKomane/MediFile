export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  avatar: any;
  online?: boolean;
};

export const DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Marcus Horizon',
    specialty: 'General Physician',
    avatar: require('../assets/images/doctors/doctor1.png'),
    online: true,
  },
  {
    id: 'doc-2',
    name: 'Dr. Alicia Rivers',
    specialty: 'Neurologist',
    avatar: require('../assets/images/doctors/doctor2.png'),
    online: true,
  },
  {
    id: 'doc-3',
    name: 'Dr. Ethan Vale',
    specialty: 'Pediatrician',
    avatar: require('../assets/images/doctors/doctor3.png'),
    online: false,
  },
];


