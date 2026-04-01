import { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AuthProvider, AuthContext } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import FeedScreen from './src/screens/FeedScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tema do Navigation para combinar com o Black/Purple Cyberpunk
const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#050816',
    card: 'rgba(5, 8, 22, 0.9)',
    text: '#ffffff',
    border: 'rgba(124, 58, 237, 0.3)',
    primary: '#7c3aed',
  },
};

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#050816' },
        headerTitleStyle: { color: '#fff', fontWeight: 'bold' },
        tabBarStyle: { backgroundColor: '#050816', borderTopColor: 'rgba(124, 58, 237, 0.3)' },
        tabBarActiveTintColor: '#06b6d4',
        tabBarInactiveTintColor: '#4b5563',
      }}
    >
      <Tab.Screen name="Feed" component={FeedScreen} options={{ title: 'Social Feed' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Meu Perfil' }} />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#050816', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Home" component={HomeTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer theme={MyTheme}>
        <MainNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
