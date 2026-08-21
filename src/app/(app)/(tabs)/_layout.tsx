import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/constants/design';
const Icon = ({ children, focused }: { children: string; focused: boolean }) => <Text style={{ fontSize: 19, opacity: focused ? 1 : .55 }}>{children}</Text>;
export default function TabsLayout() { return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.forest, tabBarInactiveTintColor: colors.muted, tabBarStyle: { height: 66, paddingTop: 6, backgroundColor: '#FFFEFC', borderTopColor: colors.line }, tabBarLabelStyle: { fontWeight: '700', fontSize: 11 } }}>
  <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ focused }) => <Icon focused={focused}>⌂</Icon> }} />
  <Tabs.Screen name="expenses" options={{ title: 'Expenses', tabBarIcon: ({ focused }) => <Icon focused={focused}>▤</Icon> }} />
  <Tabs.Screen name="budget" options={{ title: 'Budget', tabBarIcon: ({ focused }) => <Icon focused={focused}>◔</Icon> }} />
  <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ focused }) => <Icon focused={focused}>•••</Icon> }} />
</Tabs>; }
