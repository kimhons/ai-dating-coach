import { PermissionsAndroid, Platform } from 'react-native';

export const checkCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      return granted;
    } catch (error) {
      console.error('Error checking camera permission:', error);
      return false;
    }
  }
  // iOS permissions are handled by react-native-image-picker
  return true;
};

export const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs access to your camera to take photos.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }
  // iOS permissions are handled by react-native-image-picker
  return true;
};