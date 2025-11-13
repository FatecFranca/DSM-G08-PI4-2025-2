import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import colors from "../styles/colors";

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    if (!username || !password) return Alert.alert("Preencha todos os campos.");

    await AsyncStorage.setItem("user", JSON.stringify({ username, password }));

    Alert.alert("Sucesso", "Usuário cadastrado!", [
      { text: "OK", onPress: () => navigation.replace("Login") },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar Conta</Text>
      <Text style={styles.subtitle}>Registre-se para começar</Text>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Nome de usuário"
          placeholderTextColor={colors.text[300]}
          value={username}
          onChangeText={setUsername}
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor={colors.text[300]}
          value={password}
          secureTextEntry
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Cadastrar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>Já tem conta? Faça login</Text>
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
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    color: colors.text[900],
    fontSize: 36,
    fontWeight: "bold",
  },
  subtitle: {
    color: colors.text[700],
    fontSize: 16,
    marginBottom: 40,
  },
  card: {
    width: "100%",
    backgroundColor: colors.background[100],
    padding: 25,
    borderRadius: 20,
    gap: 15,
  },
  input: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    fontSize: 16,
    color: colors.text[900],
  },
  button: {
    backgroundColor: colors.primary[500],
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: colors.text[50],
    fontSize: 18,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    textAlign: "center",
    color: colors.primary[500],
    fontSize: 14,
  },
});
