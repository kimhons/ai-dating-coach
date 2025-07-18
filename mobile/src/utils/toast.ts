import Toast from 'react-native-toast-message';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export const showToast = (
  message: string,
  type: ToastType = 'info',
  duration: number = 3000,
) => {
  Toast.show({
    type,
    text1: message,
    position: 'top',
    visibilityTime: duration,
    autoHide: true,
    topOffset: 60,
  });
};

export const showSuccessToast = (message: string) => {
  showToast(message, 'success');
};

export const showErrorToast = (message: string) => {
  showToast(message, 'error');
};

export const showInfoToast = (message: string) => {
  showToast(message, 'info');
};

export const showWarningToast = (message: string) => {
  showToast(message, 'warning');
};