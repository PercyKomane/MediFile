import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FAQ, UserQuestion, getFAQs, getFAQCategories, getUserQuestions, createUserQuestion } from '../api/faq';

const FAQScreen = ({ navigation }: any) => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFaqs, setExpandedFaqs] = useState<Set<number>>(new Set());
  const [userQuestions, setUserQuestions] = useState<UserQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAskQuestionModal, setShowAskQuestionModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [faqsData, categoriesData, userQuestionsData] = await Promise.all([
        getFAQs(),
        getFAQCategories(),
        getUserQuestions(),
      ]);
             setFaqs(faqsData);
       // Remove duplicates from categories array
       const uniqueCategories = [...new Set(categoriesData)];
       setCategories(uniqueCategories);
       setUserQuestions(userQuestionsData);
    } catch (error) {
      console.error('Failed to load FAQ data:', error);
      Alert.alert('Error', 'Failed to load FAQ data');
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (faqId: number) => {
    const newExpanded = new Set(expandedFaqs);
    if (newExpanded.has(faqId)) {
      newExpanded.delete(faqId);
    } else {
      newExpanded.add(faqId);
    }
    setExpandedFaqs(newExpanded);
  };

  const getCategoryDisplayName = (category: string) => {
    const displayNames: { [key: string]: string } = {
      'general': 'General',
      'appointments': 'Appointments',
      'pharmacy': 'Pharmacy',
      'medical_records': 'Medical Records',
      'security': 'Security & Privacy',
      'payment': 'Payment & Billing',
      'technical': 'Technical Support',
    };
    return displayNames[category] || category;
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'general': 'help-circle-outline',
      'appointments': 'calendar-outline',
      'pharmacy': 'medical-outline',
      'medical_records': 'document-text-outline',
      'security': 'shield-checkmark-outline',
      'payment': 'card-outline',
      'technical': 'settings-outline',
    };
    return icons[category] || 'help-circle-outline';
  };

  const filteredFaqs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const handleAskQuestion = async () => {
    if (!newQuestion.trim()) {
      Alert.alert('Error', 'Please enter your question');
      return;
    }

    try {
      setSubmittingQuestion(true);
      await createUserQuestion({ question: newQuestion.trim() });
      setNewQuestion('');
      setShowAskQuestionModal(false);
      Alert.alert('Success', 'Your question has been submitted. We\'ll get back to you soon!');
      loadData(); // Refresh user questions
    } catch (error) {
      console.error('Failed to submit question:', error);
      Alert.alert('Error', 'Failed to submit your question. Please try again.');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'closed':
        return '#9E9E9E';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'answered':
        return 'Answered';
      case 'pending':
        return 'Pending';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#0F8A83" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FAQs</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F8A83" />
          <Text style={styles.loadingText}>Loading FAQs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#0F8A83" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQs</Text>
        <TouchableOpacity onPress={() => setShowAskQuestionModal(true)}>
          <Ionicons name="add" size={24} color="#0F8A83" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Category Filter */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <TouchableOpacity
              style={[styles.categoryChip, selectedCategory === 'all' && styles.selectedCategory]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text style={[styles.categoryText, selectedCategory === 'all' && styles.selectedCategoryText]}>
                All
              </Text>
            </TouchableOpacity>
                         {categories.map((category, index) => (
               <TouchableOpacity
                 key={`${category}-${index}`}
                 style={[styles.categoryChip, selectedCategory === category && styles.selectedCategory]}
                 onPress={() => setSelectedCategory(category)}
               >
                <Ionicons 
                  name={getCategoryIcon(category) as any} 
                  size={16} 
                  color={selectedCategory === category ? '#fff' : '#666'} 
                />
                <Text style={[styles.categoryText, selectedCategory === category && styles.selectedCategoryText]}>
                  {getCategoryDisplayName(category)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* FAQ List */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {filteredFaqs.map((faq) => (
            <TouchableOpacity
              key={faq.faq_id}
              style={styles.faqItem}
              onPress={() => toggleFaq(faq.faq_id)}
            >
              <View style={styles.faqHeader}>
                <View style={styles.faqQuestionContainer}>
                  <Ionicons 
                    name={getCategoryIcon(faq.category) as any} 
                    size={20} 
                    color="#0F8A83" 
                    style={styles.categoryIcon}
                  />
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                </View>
                <Ionicons 
                  name={expandedFaqs.has(faq.faq_id) ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color="#666" 
                />
              </View>
              {expandedFaqs.has(faq.faq_id) && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.answerText}>{faq.answer}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* User Questions */}
        {userQuestions.length > 0 && (
          <View style={styles.userQuestionsSection}>
            <Text style={styles.sectionTitle}>My Questions</Text>
            {userQuestions.map((userQ) => (
              <View key={userQ.question_id} style={styles.userQuestionItem}>
                <View style={styles.userQuestionHeader}>
                  <Text style={styles.userQuestionText}>{userQ.question}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(userQ.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(userQ.status)}</Text>
                  </View>
                </View>
                {userQ.answer && (
                  <View style={styles.userAnswer}>
                    <Text style={styles.answerLabel}>Answer:</Text>
                    <Text style={styles.answerText}>{userQ.answer}</Text>
                  </View>
                )}
                <Text style={styles.questionDate}>
                  Asked on {new Date(userQ.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Ask Question Button */}
        <TouchableOpacity
          style={styles.askQuestionButton}
          onPress={() => setShowAskQuestionModal(true)}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.askQuestionText}>Ask a Question</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Ask Question Modal */}
      <Modal
        visible={showAskQuestionModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowAskQuestionModal(false)}
              disabled={submittingQuestion}
            >
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Ask a Question</Text>
            <TouchableOpacity 
              onPress={handleAskQuestion}
              disabled={submittingQuestion || !newQuestion.trim()}
            >
              <Text style={[styles.submitButton, (!newQuestion.trim() || submittingQuestion) && styles.disabledButton]}>
                {submittingQuestion ? 'Submitting...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Your Question</Text>
            <TextInput
              style={[styles.textArea, styles.input]}
              value={newQuestion}
              onChangeText={setNewQuestion}
              placeholder="Type your question here..."
              multiline
              numberOfLines={6}
              editable={!submittingQuestion}
            />
            <Text style={styles.helpText}>
              We'll review your question and get back to you as soon as possible.
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
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
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  categorySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedCategory: {
    backgroundColor: '#0F8A83',
    borderColor: '#0F8A83',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  selectedCategoryText: {
    color: '#fff',
  },
  faqSection: {
    marginBottom: 20,
  },
  faqItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  faqQuestionContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  categoryIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    lineHeight: 22,
  },
  faqAnswer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  answerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  userQuestionsSection: {
    marginBottom: 20,
  },
  userQuestionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  userQuestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  userQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  userAnswer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  questionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
  },
  askQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F8A83',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 20,
  },
  askQuestionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  submitButton: {
    fontSize: 16,
    color: '#0F8A83',
    fontWeight: '600',
  },
  disabledButton: {
    color: '#ccc',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
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
  helpText: {
    fontSize: 14,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
});

export default FAQScreen;
