import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export const ProgressScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Progress Tracking</Text>
          <Text style={styles.subtitle}>
            Monitor your dating success and improvements over time
          </Text>
        </View>

        <View style={styles.comingSoonCard}>
          <Icon name="trending-up-outline" size={64} color="#6366f1" />
          <Text style={styles.comingSoonTitle}>Progress Tracking</Text>
          <Text style={styles.comingSoonDescription}>
            Track your confidence scores, match rates, and conversation success. 
            This feature is coming soon with detailed analytics and insights.
          </Text>
        </View>

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Coming Features:</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Icon name="checkmark-circle-outline" size={20} color="#10b981" />
              <Text style={styles.featureText}>Confidence score tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="checkmark-circle-outline" size={20} color="#10b981" />
              <Text style={styles.featureText}>Match rate analytics</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="checkmark-circle-outline" size={20} color="#10b981" />
              <Text style={styles.featureText}>Goal achievement milestones</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="checkmark-circle-outline" size={20} color="#10b981" />
              <Text style={styles.featureText}>Weekly progress reports</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 22,
  },
  comingSoonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 24,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 12,
  },
  comingSoonDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  featuresList: {
    space: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
});