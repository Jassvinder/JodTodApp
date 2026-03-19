import { Platform } from 'react-native';
import Constants from 'expo-constants';

export function getDeviceName(): string {
  const deviceName = Constants.deviceName;
  if (deviceName) return deviceName;
  return Platform.OS === 'ios' ? 'iPhone' : 'Android Device';
}
