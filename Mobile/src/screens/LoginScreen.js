import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
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

      await AsyncStorage.setItem("token", token);
      setToken(token);

      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });

    } catch (e) {
      Alert.alert("Erro", e.response?.data?.message || "Falha no login");
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Entrar</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        style={s.input}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Senha"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={s.input}
      />

      <TouchableOpacity style={s.btn} onPress={login}>
        <Text style={s.btnText}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
        <Text style={s.link}>Criar uma conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    padding: 28,
    justifyContent: "center",
    backgroundColor: "#fff"
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 40,
    color: "#b30000"
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
    fontSize: 16,
    color: "#000"
  },
  btn: {
    backgroundColor: "#b30000",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6
  },
  btnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700"
  },
  link: {
    color: "#b30000",
    textAlign: "center",
    marginTop: 16,
    fontSize: 15,
    fontWeight: "600"
  }
});
