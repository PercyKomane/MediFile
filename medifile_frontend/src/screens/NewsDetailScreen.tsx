import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface NewsDetailScreenProps {
  navigation: any;
  route: any;
}

const NewsDetailScreen = ({ navigation, route }: NewsDetailScreenProps) => {
  const { article } = route.params;

  // Handle case where article might not be passed
  if (!article) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#0F8A83" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medical News</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={[styles.articleContent, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.articleTitle}>Article not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openArticle = async () => {
    if (article.url) {
      try {
        await Linking.openURL(article.url);
      } catch (error) {
        console.error('Error opening URL:', error);
      }
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
        <Text style={styles.headerTitle}>Medical News</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Article Image */}
        {article.image && (
          <Image source={{ uri: article.image }} style={styles.articleImage} />
        )}

        {/* Article Content */}
        <View style={styles.articleContent}>
          {/* Title */}
          <Text style={styles.articleTitle}>{article.title}</Text>
          
          {/* Meta Information */}
          <View style={styles.metaInfo}>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{formatDate(article.publishedAt)}</Text>
            </View>
            {article.source?.name && (
              <View style={styles.metaRow}>
                <Ionicons name="newspaper-outline" size={16} color="#666" />
                <Text style={styles.metaText}>{article.source.name}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <Text style={styles.articleDescription}>{article.description}</Text>

          {/* Content */}
          {article.content && (
            <Text style={styles.articleBody}>{article.content}</Text>
          )}

          {/* Read Full Article Button */}
          {article.url && (
            <TouchableOpacity style={styles.readMoreButton} onPress={openArticle}>
              <Ionicons name="open-outline" size={20} color="#fff" />
              <Text style={styles.readMoreText}>Read Full Article</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F3F1',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F8A83',
  },
  content: {
    flex: 1,
  },
  articleImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  articleContent: {
    padding: 20,
  },
  articleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    lineHeight: 32,
  },
  metaInfo: {
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  articleDescription: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    marginBottom: 20,
  },
  articleBody: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    marginBottom: 20,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F8A83',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 20,
    gap: 8,
  },
  readMoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NewsDetailScreen;
