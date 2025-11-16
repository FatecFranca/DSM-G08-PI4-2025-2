import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import api from '../api/api';

export default function BikesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [bikes, setBikes] = useState([]);
  const [name, setName] = useState('');
  const [uuid, setUuid] = useState('');
  const [circ, setCirc] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/bikes/my-bikes');

      const bikesArray = Array.isArray(res.data)
        ? res.data
        : (res.data?.data || []);

      setBikes(bikesArray);

    } catch (e) {
      console.log('err bikes', e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!uuid || !name || !circ)
      return Alert.alert('Preencha todos os campos');

    const body = { id_bike: uuid, name, circunferencia_m: Number(circ), description: '' };

    try {
      await api.post('/v1/bikes', body);
      setName('');
      setUuid('');
      setCirc('');
      load();
    } catch (e) {
      Alert.alert('Erro', e.response?.data?.message || 'Erro ao cadastrar');
    }
  };

  if (loading)
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color="#b30000" />
      </View>
    );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} contentContainerStyle={s.container}>

      <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
        <Text style={s.backText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={s.title}>Cadastrar Bike</Text>

      <TextInput placeholder="UUID da bike" value={uuid} onChangeText={setUuid} style={s.input} />
      <TextInput placeholder="Nome" value={name} onChangeText={setName} style={s.input} />
      <TextInput placeholder="Circunferência (m)" value={circ} onChangeText={setCirc} keyboardType="numeric" style={s.input} />

      <TouchableOpacity style={s.btn} onPress={create}>
        <Text style={s.btnText}>Cadastrar</Text>
      </TouchableOpacity>

      <Text style={s.title}>Minhas Bikes</Text>

      {bikes.length === 0 && <Text style={s.empty}>Nenhuma bike cadastrada</Text>}

      {bikes.map((b, i) => (
        <View key={i} style={s.card}>
          <Text style={s.cardTitle}>{b.name || `Bike ${i + 1}`}</Text>
          <Text>ID: {b.id_bike}</Text>
          <Text>Circ: {b.circunferencia_m || '—'}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  container: { padding: 20, paddingBottom: 40 },
  backBtn: { marginBottom: 15 },
  backText: { fontSize: 16, color: "#b30000", fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', color: '#b30000', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 8 },
  btn: { backgroundColor: '#b30000', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  btnText: { color: '#fff', fontWeight: '700' },
  empty: { color: '#666', marginBottom: 10 },
  card: { padding: 12, borderRadius: 10, backgroundColor: '#fafafa', borderWidth: 1, borderColor: '#eee', marginBottom: 12 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#b30000' }
});
