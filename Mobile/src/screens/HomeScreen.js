import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import colors from "../styles/colors";

export default function HomeScreen({ navigation, route }) {
  const { username } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Olá, {username} 👋</Text>
      <Text style={styles.subtitle}>O que deseja fazer hoje?</Text>

      <View style={styles.card}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("KM")}
        >
          <Text style={styles.buttonText}>Ver KM percorridos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Stats")}
        >
          <Text style={styles.buttonText}>Ver Estatísticas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logout}
          onPress={() => navigation.replace("Login")}
        >
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background[50],
    paddingHorizontal: 25,
    paddingTop: 80,
  },

  title: {
    fontSize: 32,
    color: colors.text[900],
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 16,
    color: colors.text[700],
    marginTop: 5,
    marginBottom: 30,
  },

  card: {
    backgroundColor: colors.background[100],
    padding: 25,
    borderRadius: 20,
    elevation: 6,
    gap: 15,
  },

  button: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: colors.text[50],
    fontSize: 18,
    fontWeight: "bold",
  },

  logout: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: colors.background[200],
  },

  logoutText: {
    color: colors.text[800],
    fontSize: 16,
    fontWeight: "bold",
  },
});
