import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Versão Mobile - DSM G08 PI</Text>
      <Text style={styles.subtitle}>Conectado à API (em breve)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#C62828',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#333',
  },
});
