import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const colors = {
  primary: '#3D7BFF',
  primaryLight: '#DDEBFF',
  green: '#6BCB77',
  purple: '#B89AF8',
  orange: '#F4A261',
  background: '#FFFFFF',
  lightBackground: '#F8F9FC',
  text: '#222222',
  subtitle: '#777777',
  border: '#E9ECF3',
  white: '#FFFFFF',
  dark: '#111827',
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  soft: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
} as const;

export const typography = {
  title: { fontSize: 24, fontWeight: '700' as const },
  subtitle: { fontSize: 14, fontWeight: '500' as const },
  body: { fontSize: 13, fontWeight: '400' as const },
  heading: { fontSize: 18, fontWeight: '700' as const },
};

export const dimensions = {
  width,
  height,
  screenPaddingHorizontal: width * 0.06,
};
