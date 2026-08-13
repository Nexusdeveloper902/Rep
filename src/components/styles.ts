import { StyleSheet } from 'react-native';
import { AppColors } from './theme';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppColors.bg },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  cardElevated: {
    backgroundColor: AppColors.surfaceElevated,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  title: { fontSize: 28, fontWeight: '800', color: AppColors.text, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '700', color: AppColors.text },
  h3: { fontSize: 16, fontWeight: '600', color: AppColors.text },
  body: { fontSize: 15, color: AppColors.text, lineHeight: 22 },
  muted: { fontSize: 14, color: AppColors.textMuted },
  bigNumber: { fontSize: 34, fontWeight: '800', color: AppColors.text },
  primaryBtn: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: AppColors.surfaceElevated,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  secondaryBtnText: { color: AppColors.text, fontSize: 16, fontWeight: '600' },
  dangerBtn: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: {
    backgroundColor: AppColors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: { color: AppColors.textMuted, fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: AppColors.border, marginVertical: 12 },
  input: {
    backgroundColor: AppColors.surfaceElevated,
    color: AppColors.text,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    minWidth: 90,
  },
});

export { AppColors };
