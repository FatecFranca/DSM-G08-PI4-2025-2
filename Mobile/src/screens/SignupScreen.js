import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Alert, 
  TouchableOpacity 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../api/api';

export default function SignupScreen() {
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const register = async () => {
    if (!name || !email || !password)
      return Alert.alert("Erro", "Preencha todos os campos");

    try {
      // faz o cadastro
      await api.post('/v1/auth/register', {
        name,
        email,
        password
      });

      // navega para Login
      Alert.alert(
        "Sucesso",
        "Conta criada com sucesso!",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login")
          }
        ]
      );

    } catch (e) {
      Alert.alert("Erro", e.response?.data?.message || "Falha no cadastro");
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Criar conta</Text>

      <TextInput
        placeholder="Nome"
        placeholderTextColor="#aaa"
        value={name}
        onChangeText={setName}
        style={s.input}
      />

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

      <TouchableOpacity style={s.btn} onPress={register}>
        <Text style={s.btnText}>Cadastrar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={s.link}>Já tenho uma conta</Text>
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
