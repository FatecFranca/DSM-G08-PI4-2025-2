import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Armazenamento compatível com web e mobile
import AsyncStorage from '@react-native-async-storage/async-storage';

// Telas
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import StatsScreen from './src/screens/StatsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Wrapper pra evitar crash no web (AsyncStorage)
  const getTokenSafe = async () => {
    try {
      const t = await AsyncStorage.getItem('token');
      setToken(t);
    } catch (err) {
      console.log('AsyncStorage não disponível, ignorando...');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getTokenSafe();
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
        }}
      >
        <ActivityIndicator size="large" color="#b30000" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {token ? (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Stats" component={StatsScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}
