import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';

export default function HomeScreen({ navigation }) {
  const { logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/v1/auth/profile');
        setProfile(res.data?.data || res.data || null);
      } catch (e) {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <View style={s.loadingBox}>
        <ActivityIndicator size="large" color="#b30000" />
      </View>
    );
  }

  return (
    <ScrollView 
      contentContainerStyle={s.container}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <Text style={s.greeting}>Olá{profile?.name ? ' ' + profile.name : ''} 👋</Text>

      <TouchableOpacity style={s.cardBtn} onPress={() => navigation.navigate('Bikes')}>
        <Text style={s.cardTitle}>Minhas Bikes</Text>
        <Text style={s.cardSub}>Gerencie suas bikes cadastradas</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.cardBtn} onPress={() => navigation.navigate('Runs')}>
        <Text style={s.cardTitle}>Minhas Corridas</Text>
        <Text style={s.cardSub}>Iniciar e revisar corridas</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.cardBtn} onPress={() => navigation.navigate('Stats')}>
        <Text style={s.cardTitle}>Estatísticas</Text>
        <Text style={s.cardSub}>Ver métricas por bike ou run</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.logoutBtn} onPress={logout}>
        <Text style={s.logoutText}>Sair</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { 
    padding: 20, 
    backgroundColor: '#fff',
    flexGrow: 1,         // 🟢 cobre 100% da tela
    minHeight: "100%"    // 🟢 impede espaço vazio
  },
  loadingBox: { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#fff' },
  greeting: { fontSize: 22, fontWeight: '700', color: '#b30000', marginBottom: 16 },
  cardBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', padding: 16, borderRadius: 10, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#b30000' },
  cardSub: { fontSize: 13, color: '#666', marginTop: 6 },
  logoutBtn: { marginTop: 18, backgroundColor: '#444', padding: 12, borderRadius: 8, alignItems:'center' },
  logoutText: { color: '#fff', fontWeight: '700' }
});
