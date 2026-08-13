import { MD3DarkTheme } from 'react-native-paper';

const colors = {
  bg: '#0B1220',
  surface: '#111827',
  surfaceElevated: '#1F2937',
  border: '#1F2937',
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  accent: '#10B981',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#22C55E',
};

export const AppColors = colors;

export const AppTheme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    background: colors.bg,
    surface: colors.surface,
    onSurface: colors.text,
    onSurfaceVariant: colors.textMuted,
    secondaryContainer: colors.surfaceElevated,
    outline: colors.border,
    error: colors.danger,
    onBackground: colors.text,
  },
  fonts: {
    ...MD3DarkTheme.fonts,
    regular: { fontFamily: 'System', fontWeight: '400' as const },
  },
};
