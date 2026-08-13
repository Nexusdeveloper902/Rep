import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { usePreferencesStore } from '@/stores/usePreferencesStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { Card, SecondaryButton, DangerButton } from '@/components/ui';
import { styles } from '@/components/styles';
import { ScrollView, Text, View } from 'react-native';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const units = usePreferencesStore((s) => s.units);
  const setUnits = usePreferencesStore((s) => s.setUnits);
  const discardConfirm = usePreferencesStore((s) => s.discardConfirm);
  const setDiscardConfirm = usePreferencesStore((s) => s.setDiscardConfirm);
  const session = useSessionStore((s) => s.session);
  const discardActive = useSessionStore((s) => s.discardActive);

  const discardActiveSession = () => {
    Alert.alert('Discard active workout?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: async () => { await discardActive(); router.replace('/(tabs)'); } },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>Settings</Text>

      <Text style={[styles.h2, { marginTop: 12 }]}>Units</Text>
      <Card>
        <View style={[styles.row, { gap: 12 }]}>
          <View style={{ flex: 1 }}>
            <SecondaryButton label="Kilograms" onPress={() => setUnits('kg')} />
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton label="Pounds" onPress={() => setUnits('lb')} />
          </View>
        </View>
        <Text style={[styles.muted, { marginTop: 8 }]}>Current: {units}</Text>
      </Card>

      <Text style={[styles.h2, { marginTop: 12 }]}>Safety</Text>
      <Card>
        <Text style={styles.body}>Confirm before discarding workouts</Text>
        <Text style={[styles.muted, { marginVertical: 8 }]}>Current: {discardConfirm ? 'On' : 'Off'}</Text>
        <SecondaryButton label={discardConfirm ? 'Turn Off' : 'Turn On'} onPress={() => setDiscardConfirm(!discardConfirm)} />
      </Card>

      {session && (session.state === 'Active' || session.state === 'Resting' || session.state === 'WaitingForEquipment' || session.state === 'Paused') && (
        <>
          <Text style={[styles.h2, { marginTop: 12 }]}>Active Session</Text>
          <Card>
            <Text style={styles.body}>A workout is in progress.</Text>
            <View style={{ height: 12 }} />
            <DangerButton label="Discard Active Session" onPress={discardActiveSession} />
          </Card>
        </>
      )}

      <Text style={[styles.h2, { marginTop: 12 }]}>About</Text>
      <Card>
        <Text style={styles.body}>Gym Workout Companion</Text>
        <Text style={styles.muted}>Version 1.0.0</Text>
        <Text style={[styles.muted, { marginTop: 8 }]}>All data is stored locally on your device. No account, no cloud, no sync.</Text>
      </Card>
    </ScrollView>
  );
}
