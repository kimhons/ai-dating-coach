import {Platform, PermissionsAndroid, Alert, Linking} from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  request,
  requestMultiple,
  check,
  openSettings,
} from 'react-native-permissions';

export interface PermissionStatus {
  granted: boolean;
  denied: boolean;
  blocked: boolean;
}

export const REQUIRED_PERMISSIONS = Platform.select({
  ios: [
    PERMISSIONS.IOS.CAMERA,
    PERMISSIONS.IOS.MICROPHONE,
    PERMISSIONS.IOS.PHOTO_LIBRARY,
  ],
  android: [
    PERMISSIONS.ANDROID.CAMERA,
    PERMISSIONS.ANDROID.RECORD_AUDIO,
    PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
    PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
  ],
  default: [],
});

export const requestPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      return await requestAndroidPermissions();
    } else {
      return await requestIOSPermissions();
    }
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
};

const requestAndroidPermissions = async (): Promise<boolean> => {
  try {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    ];

    const granted = await PermissionsAndroid.requestMultiple(permissions);

    const allGranted = Object.values(granted).every(
      permission => permission === PermissionsAndroid.RESULTS.GRANTED,
    );

    if (!allGranted) {
      showPermissionAlert();
    }

    return allGranted;
  } catch (error) {
    console.error('Android permissions error:', error);
    return false;
  }
};

const requestIOSPermissions = async (): Promise<boolean> => {
  try {
    const results = await requestMultiple(REQUIRED_PERMISSIONS as any[]);
    
    const allGranted = Object.values(results).every(
      result => result === RESULTS.GRANTED,
    );

    if (!allGranted) {
      showPermissionAlert();
    }

    return allGranted;
  } catch (error) {
    console.error('iOS permissions error:', error);
    return false;
  }
};

export const checkCameraPermission = async (): Promise<PermissionStatus> => {
  const permission = Platform.select({
    ios: PERMISSIONS.IOS.CAMERA,
    android: PERMISSIONS.ANDROID.CAMERA,
  });

  if (!permission) {
    return {granted: false, denied: true, blocked: false};
  }

  const result = await check(permission);
  
  return {
    granted: result === RESULTS.GRANTED,
    denied: result === RESULTS.DENIED,
    blocked: result === RESULTS.BLOCKED,
  };
};

export const requestCameraPermission = async (): Promise<boolean> => {
  const permission = Platform.select({
    ios: PERMISSIONS.IOS.CAMERA,
    android: PERMISSIONS.ANDROID.CAMERA,
  });

  if (!permission) return false;

  const result = await request(permission);
  return result === RESULTS.GRANTED;
};

export const checkMicrophonePermission = async (): Promise<PermissionStatus> => {
  const permission = Platform.select({
    ios: PERMISSIONS.IOS.MICROPHONE,
    android: PERMISSIONS.ANDROID.RECORD_AUDIO,
  });

  if (!permission) {
    return {granted: false, denied: true, blocked: false};
  }

  const result = await check(permission);
  
  return {
    granted: result === RESULTS.GRANTED,
    denied: result === RESULTS.DENIED,
    blocked: result === RESULTS.BLOCKED,
  };
};

export const requestMicrophonePermission = async (): Promise<boolean> => {
  const permission = Platform.select({
    ios: PERMISSIONS.IOS.MICROPHONE,
    android: PERMISSIONS.ANDROID.RECORD_AUDIO,
  });

  if (!permission) return false;

  const result = await request(permission);
  return result === RESULTS.GRANTED;
};

export const checkStoragePermission = async (): Promise<PermissionStatus> => {
  const permission = Platform.select({
    ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
    android: PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
  });

  if (!permission) {
    return {granted: false, denied: true, blocked: false};
  }

  const result = await check(permission);
  
  return {
    granted: result === RESULTS.GRANTED,
    denied: result === RESULTS.DENIED,
    blocked: result === RESULTS.BLOCKED,
  };
};

export const requestStoragePermission = async (): Promise<boolean> => {
  const permission = Platform.select({
    ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
    android: PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
  });

  if (!permission) return false;

  const result = await request(permission);
  return result === RESULTS.GRANTED;
};

const showPermissionAlert = () => {
  Alert.alert(
    'Permissions Required',
    'AI Dating Coach needs camera, microphone, and storage permissions to provide photo analysis, voice coaching, and conversation screenshots.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: openSettings,
      },
    ],
  );
};

export const showPermissionDeniedAlert = (featureName: string) => {
  Alert.alert(
    'Permission Required',
    `${featureName} requires permission to access your device. Please enable it in settings.`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: openSettings,
      },
    ],
  );
};