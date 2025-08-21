// screens/OnboardingScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Image,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Consult only with a doctor you trust',
    image: require('../assets/images/doctors/doctor1.png'),
  },
  {
    id: '2',
    title: 'Find a lot of specialist doctors in one place',
    image: require('../assets/images/doctors/doctor2.png'),
  },
  {
    id: '3',
    title: 'Get connected to our Online Consultation',
    image: require('../assets/images/doctors/doctor3.png'),
  },
];

const OnboardingScreen = ({ navigation }: any) => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.navigate('Login'); // replace with your login screen name
    }
  };

  const handleSkip = () => {
    flatListRef.current?.scrollToEnd();
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.slide}>
      <Image source={item.image} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>{item.title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={slides}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        ref={flatListRef}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext}>
          <Text style={styles.next}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  image: {
    width: width * 0.7,
    height: height * 0.4,
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    color: '#333',
    paddingHorizontal: 30,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skip: {
    fontSize: 16,
    color: 'gray',
  },
  next: {
    fontSize: 16,
    color: '#008080',
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;
