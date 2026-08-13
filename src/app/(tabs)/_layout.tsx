import { Tabs } from 'expo-router';
import { Dumbbell, History, ListChecks, Settings } from 'lucide-react-native';
import { useSessionStore } from '@/stores/useSessionStore';
import { Redirect } from 'expo-router';

export default function TabsLayout() {
  const hasActive = useSessionStore((s) => s.session?.state === 'Active' || s.session?.state === 'Resting' || s.session?.state === 'WaitingForEquipment' || s.session?.state === 'Paused');

  if (hasActive) {
    return <Redirect href="/workout/active" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { backgroundColor: '#111827', borderTopColor: '#1F2937' },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <Dumbbell size={24} color={color as string} /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'History', tabBarIcon: ({ color }) => <History size={24} color={color as string} /> }}
      />
      <Tabs.Screen
        name="program"
        options={{ title: 'Program', tabBarIcon: ({ color }) => <ListChecks size={24} color={color as string} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: ({ color }) => <Settings size={24} color={color as string} /> }}
      />
    </Tabs>
  );
}
