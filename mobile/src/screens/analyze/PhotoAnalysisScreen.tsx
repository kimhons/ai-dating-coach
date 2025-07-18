import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {checkCameraPermission, requestCameraPermission} from '@/utils/permissions';

export const PhotoAnalysisScreen: React.FC = () => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handlePhotoSelection = () => {
    Alert.alert(
      'Select Photo',
      'Choose how you want to select a photo',
      [
        {text: 'Camera', onPress: openCamera},
        {text: 'Photo Library', onPress: openLibrary},
        {text: 'Cancel', style: 'cancel'},
      ]
    );
  };

  const openCamera = async () => {
    const permission = await checkCameraPermission();
    if (!permission.granted) {
      const granted = await requestCameraPermission();
      if (!granted) return;
    }

    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
      },
      (response) => {
        if (response.assets && response.assets[0]) {
          setSelectedPhoto(response.assets[0].uri!);
        }
      }
    );
  };

  const openLibrary = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
      },
      (response) => {
        if (response.assets && response.assets[0]) {
          setSelectedPhoto(response.assets[0].uri!);
        }
      }
    );
  };

  const analyzePhoto = async () => {
    if (!selectedPhoto) return;
    
    setIsAnalyzing(true);
    // TODO: Implement actual photo analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      Alert.alert('Analysis Complete', 'Photo analysis feature coming soon!');
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Photo Analysis</Text>
          <Text style={styles.subtitle}>
            Get AI-powered feedback on your dating photos
          </Text>
        </View>

        {!selectedPhoto ? (
          <View style={styles.uploadContainer}>
            <TouchableOpacity
              style={styles.uploadCard}
              onPress={handlePhotoSelection}
              activeOpacity={0.7}>
              <Icon name="camera-outline" size={64} color="#6366f1" />
              <Text style={styles.uploadTitle}>Upload a Photo</Text>
              <Text style={styles.uploadDescription}>
                Take a new photo or select from your gallery
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoContainer}>
            <View style={styles.photoPlaceholder}>
              <Icon name="image-outline" size={48} color="#6b7280" />
              <Text style={styles.photoText}>Photo Selected</Text>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setSelectedPhoto(null)}
                activeOpacity={0.8}>
                <Text style={styles.secondaryButtonText}>Choose Different</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.primaryButton, isAnalyzing && styles.disabledButton]}
                onPress={analyzePhoto}
                disabled={isAnalyzing}
                activeOpacity={0.8}>
                <Text style={styles.primaryButtonText}>
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Photo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <Icon name="information-circle-outline" size={24} color="#6366f1" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>What we analyze</Text>
            <Text style={styles.infoDescription}>
              • Photo quality and lighting{'\n'}
              • Facial expression and smile{'\n'}
              • Background and composition{'\n'}
              • Overall attractiveness score{'\n'}
              • Specific improvement suggestions
            </Text>
          </View>
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Photo Tips</Text>
          <Text style={styles.tipsContent}>
            • Use natural lighting when possible{'\n'}
            • Make eye contact with the camera{'\n'}
            • Show a genuine smile{'\n'}
            • Keep the background simple{'\n'}
            • Avoid heavy filters or editing
          </Text>
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
  uploadContainer: {
    marginBottom: 32,
  },
  uploadCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 48,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  uploadDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  photoContainer: {
    marginBottom: 32,
  },
  photoPlaceholder: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  photoText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  disabledButton: {
    opacity: 0.6,
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  tipsCard: {
    backgroundColor: '#fefce8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fde047',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  tipsContent: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
});