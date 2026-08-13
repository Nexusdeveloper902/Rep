import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { styles } from './styles';

export function PrimaryButton({ label, onPress, style }: { label: string; onPress: () => void; style?: ViewStyle }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }, style]}>
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, style }: { label: string; onPress: () => void; style?: ViewStyle }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }, style]}>
      <Text style={styles.secondaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function DangerButton({ label, onPress, style }: { label: string; onPress: () => void; style?: ViewStyle }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.dangerBtn, pressed && { opacity: 0.85 }, style]}>
      <Text style={[styles.secondaryBtnText, { color: '#FCA5A5' }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Pill({ text, color }: { text: string; color?: string }) {
  return (
    <View style={styles.pill}>
      <Text style={[styles.pillText, color ? { color } : undefined]}>{text}</Text>
    </View>
  );
}
