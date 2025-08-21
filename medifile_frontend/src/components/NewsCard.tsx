import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

interface NewsCardProps {
  title: string;
  image: string;
  description: string;
  date: string;
  article: any; // Full article object for navigation
  onPress: (article: any) => void;
}

const NewsCard = ({ title, image, description, date, article, onPress }: NewsCardProps) => {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(article)}>
      {image ? <Image source={{ uri: image }} style={styles.image} /> : null}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.description} numberOfLines={3}>{description}</Text>
        <Text style={styles.date}>{new Date(date).toDateString()}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  image: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginBottom: 10,
  },
  content: {
    paddingTop: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#199A8E',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
  },
  date: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});


export default NewsCard;
