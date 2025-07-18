import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {ToastConfig} from 'react-native-toast-message';

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  success: {
    backgroundColor: '#10b981',
  },
  error: {
    backgroundColor: '#ef4444',
  },
  info: {
    backgroundColor: '#3b82f6',
  },
  warning: {
    backgroundColor: '#f59e0b',
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
});

export const toastConfig: ToastConfig = {
  success: ({text1}) => (
    <View style={[styles.container, styles.success]}>
      <Text style={styles.text}>{text1}</Text>
    </View>
  ),
  error: ({text1}) => (
    <View style={[styles.container, styles.error]}>
      <Text style={styles.text}>{text1}</Text>
    </View>
  ),
  info: ({text1}) => (
    <View style={[styles.container, styles.info]}>
      <Text style={styles.text}>{text1}</Text>
    </View>
  ),
  warning: ({text1}) => (
    <View style={[styles.container, styles.warning]}>
      <Text style={styles.text}>{text1}</Text>
    </View>
  ),
};