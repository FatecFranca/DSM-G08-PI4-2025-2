import React, { useContext, useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import BikesScreen from './src/screens/BikesScreen';
import RunsScreen from './src/screens/RunsScreen';
import StatsScreen from './src/screens/StatsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RealTimeSpeedScreen from './src/screens/RealTimeSpeedScreen';


const Stack = createNativeStackNavigator();

function Routes() {
  const { token, setToken } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const t = await AsyncStorage.getItem('token');
        setToken(t);
      } catch (e) {
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#fff'}}>
        <ActivityIndicator size="large" color="#b30000" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Bikes" component={BikesScreen} />
            <Stack.Screen name="Runs" component={RunsScreen} />
            <Stack.Screen name="Stats" component={StatsScreen} />
            <Stack.Screen name="RealTimeSpeed" component={RealTimeSpeedScreen} />

          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}
