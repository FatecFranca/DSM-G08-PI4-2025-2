import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

export default function LoginScreen() {

  const navigation = useNavigation();
  const { setToken } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
    try {
      const res = await api.post('/v1/auth/login', { email, password });
      const token = res.data?.token;

      if (!token) {
        Alert.alert("Erro", "Token ausente na resposta");
        return;
      }

      await AsyncStorage.setItem('token', token);
      setToken(token);

      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });

    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data?.error || "Erro no login";
      Alert.alert("Erro", msg);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Entrar</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={s.input}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={s.input}
      />

      <Pressable style={s.btn} onPress={login}>
        <Text style={s.btnText}>Entrar</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate("Signup")}>
        <Text style={s.link}>Criar conta</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 28, marginBottom: 20, color: "#b30000", textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8, marginBottom: 12 },
  btn: { backgroundColor: "#b30000", padding: 12, borderRadius: 8, alignItems: "center", marginBottom: 10 },
  btnText: { color: "#fff", fontWeight: "700" },
  link: { color: "#b30000", textAlign: "center" },
});
