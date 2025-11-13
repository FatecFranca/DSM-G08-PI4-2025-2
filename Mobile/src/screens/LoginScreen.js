import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import colors from "../styles/colors";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const userData = await AsyncStorage.getItem("user");
    if (!userData) return alert("Nenhum usuário cadastrado.");

    const { username: savedUser, password: savedPass } = JSON.parse(userData);

    if (username === savedUser && password === savedPass) {
      navigation.replace("Home", { username });
    } else {
      alert("Nome de usuário ou senha incorretos.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo de volta</Text>
      <Text style={styles.subtitle}>Acesse sua conta</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Usuário</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu usuário"
          placeholderTextColor={colors.text[300]}
          value={username}
          onChangeText={setUsername}
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite sua senha"
          placeholderTextColor={colors.text[300]}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.link}>Ainda não tem conta? Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background[50],
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  title: {
    color: colors.text[900],
    fontSize: 38,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },

  subtitle: {
    textAlign: "center",
    color: colors.text[700],
    fontSize: 16,
    marginBottom: 35,
  },

  card: {
    backgroundColor: colors.background[100],
    padding: 30,
    borderRadius: 22,
    shadowColor: "#000",
    elevation: 6,
  },

  label: {
    color: colors.text[900],
    fontSize: 15,
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    height: 52,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.background[200],
    fontSize: 16,
    color: colors.text[900],
  },

  button: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 25,
    alignItems: "center",
  },

  buttonText: {
    color: colors.text[50],
    fontSize: 18,
    fontWeight: "bold",
  },

  link: {
    marginTop: 20,
    textAlign: "center",
    color: colors.primary[500],
    fontSize: 14,
  },
});
