import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import api from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RunsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);

  const [bikes, setBikes] = useState([]);
  const [runs, setRuns] = useState([]);
  const [activeRun, setActiveRun] = useState(null);

  const [name, setName] = useState('');
  const [bikeId, setBikeId] = useState('');

  // ---------------- CARREGA AS BIKES ----------------
  const loadBikes = async () => {
    try {
      const res = await api.get('/v1/bikes/my-bikes');

      const bikesArray = Array.isArray(res.data)
        ? res.data
        : (res.data?.data || []);

      setBikes(bikesArray);
    } catch {
      setBikes([]);
    }
  };

  // ---------------- CARREGA HISTÓRICO LOCAL ----------------
  const loadLocalRuns = async () => {
    const saved = await AsyncStorage.getItem('runs_history');
    const list = saved ? JSON.parse(saved) : [];

    setRuns(list);

    // procura corrida ativa
    const act = list.find(r => r.status === 'active');
    setActiveRun(act || null);
  };

  // ---------------- SALVA HISTÓRICO ----------------
  const saveRuns = async (list) => {
    await AsyncStorage.setItem('runs_history', JSON.stringify(list));
  };

  // ---------------- INICIAR CORRIDA ----------------
  const startRun = async () => {
    if (activeRun) return Alert.alert("Já existe corrida ativa!");
    if (!bikeId) return Alert.alert("Escolha uma bike");
    if (!name) return Alert.alert("Dê um nome à corrida");

    const runData = {
      id: Date.now().toString(),
      name,
      bike_id: bikeId,
      status: "active",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setActiveRun(runData);

    const updatedHistory = [runData, ...runs];
    setRuns(updatedHistory);
    saveRuns(updatedHistory);

    setName('');
    setBikeId('');
  };

  // ---------------- FINALIZAR CORRIDA ----------------
  const stopRun = async () => {
    if (!activeRun) return;

    const finished = {
      ...activeRun,
      status: "completed",
      finished_at: new Date().toISOString(),
    };

    const updatedHistory = runs.map(r => r.id === activeRun.id ? finished : r);

    setRuns(updatedHistory);
    saveRuns(updatedHistory);

    setActiveRun(null);
  };

  // ---------------- LOAD INICIAL ----------------
  const load = async () => {
    setLoading(true);
    await loadBikes();
    await loadLocalRuns();
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color="#b30000" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} contentContainerStyle={s.container}>

      {/* VOLTAR */}
      <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
        <Text style={s.backText}>← Voltar</Text>
      </TouchableOpacity>

      {/* ===================================================== */}
      {/*        BLOCO DE INICIAR NOVA CORRIDA                  */}
      {/* ===================================================== */}
      <View style={s.cardStart}>
        <Text style={s.labelStart}>Iniciar nova corrida</Text>
        <Text style={s.helpText}>Inicie apenas quando não houver corrida ativa.</Text>

        {/* SELETOR DE BIKES */}
        <View style={s.inputSelect}>
          <Text style={s.selectLabel}>Bike</Text>

          {bikes.length === 0 && (
            <Text style={{ color: '#555' }}>Nenhuma bike cadastrada</Text>
          )}

          {bikes.map(b => (
            <TouchableOpacity
              key={b.id_bike}
              style={[s.selectOption, bikeId === b.id_bike && s.selectedOption]}
              onPress={() => setBikeId(b.id_bike)}
            >
              <Text style={s.selectText}>
                {b.name} (UUID: {b.id_bike})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          placeholder="Nome da corrida"
          value={name}
          onChangeText={setName}
          style={s.input}
        />

        {/* BOTÕES */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <TouchableOpacity
            style={[s.btnStart, activeRun && { opacity: 0.5 }]}
            disabled={!!activeRun}
            onPress={startRun}
          >
            <Text style={s.btnStartText}>Iniciar corrida</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.btnClear}
            onPress={() => { setName(''); setBikeId(''); }}
          >
            <Text style={s.btnClearText}>Limpar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ===================================================== */}
      {/*                     CORRIDA ATIVA                     */}
      {/* ===================================================== */}
      <Text style={s.title}>Corrida Ativa</Text>

      {!activeRun && (
        <Text style={s.empty}>Nenhuma corrida ativa</Text>
      )}

      {activeRun && (
        <View style={s.cardRunActive}>
          <Text style={s.cardTitle}>{activeRun.name}</Text>
          <Text style={s.item}>Bike: {activeRun.bike_id}</Text>
          <Text style={s.item}>Iniciada: {new Date(activeRun.started_at).toLocaleString()}</Text>

          <TouchableOpacity style={s.btnStop} onPress={stopRun}>
            <Text style={s.btnStopText}>Encerrar corrida</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ===================================================== */}
      {/*                      HISTÓRICO                        */}
      {/* ===================================================== */}
      <Text style={s.title}>Histórico de Corridas</Text>

      {runs.length === 0 && (
        <Text style={s.empty}>Nenhuma corrida encontrada</Text>
      )}

      {runs.map((r) => (
        <View key={r.id} style={s.cardHistory}>
          <Text style={s.cardTitle}>{r.name}</Text>
          <Text style={s.item}>Bike: {r.bike_id}</Text>
          <Text style={s.item}>Status: {r.status}</Text>
          <Text style={s.item}>Criada: {new Date(r.started_at).toLocaleString()}</Text>

          {r.finished_at && (
            <Text style={s.item}>Finalizada: {new Date(r.finished_at).toLocaleString()}</Text>
          )}
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

  empty: { color: '#666', marginBottom: 10 },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12
  },

  /* --------------------- CARD INICIAR -------------------- */
  cardStart: {
    backgroundColor: "#ffeeee",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#f5d2d2",
    marginBottom: 25
  },
  labelStart: { fontSize: 18, color: "#b30000", fontWeight: "700" },
  helpText: { fontSize: 12, color: "#777", marginTop: -2, marginBottom: 10 },

  inputSelect: { marginBottom: 10 },
  selectLabel: { fontSize: 14, marginBottom: 4, color: '#550000' },
  selectOption: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 6
  },
  selectedOption: { backgroundColor: "#ffcccc", borderColor: "#b30000" },
  selectText: { color: "#333" },

  btnStart: { backgroundColor: '#b30000', padding: 10, borderRadius: 8, flex: 1, marginRight: 5 },
  btnStartText: { color: '#fff', fontWeight: '700', textAlign: "center" },

  btnClear: { backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#b30000', flex: 1, marginLeft: 5 },
  btnClearText: { color: '#b30000', fontWeight: '700', textAlign: "center" },

  /* --------------------- CORRIDA ATIVA -------------------- */
  cardRunActive: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#fff7f7',
    borderWidth: 1,
    borderColor: '#ffb3b3',
    marginBottom: 20
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#b30000', marginBottom: 4 },
  item: { color: '#333', marginBottom: 3 },

  btnStop: { backgroundColor: '#ff4444', padding: 10, borderRadius: 8, marginTop: 10 },
  btnStopText: { color: '#fff', fontWeight: '700', textAlign: 'center' },

  /* --------------------- HISTÓRICO -------------------- */
  cardHistory: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 12
  }
});
