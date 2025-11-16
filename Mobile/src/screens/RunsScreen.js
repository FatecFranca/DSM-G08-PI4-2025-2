// RunsScreen — versão bonita + travamento completo + histórico corrigido

import React, { useEffect, useState, useRef } from 'react';
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
import io from 'socket.io-client';

export default function RunsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [bikes, setBikes] = useState([]);
  const [runs, setRuns] = useState([]);
  const [activeRun, setActiveRun] = useState(null);

  const [name, setName] = useState('');
  const [bikeId, setBikeId] = useState('');

  const [liveSpeedByBike, setLiveSpeedByBike] = useState({});
  const socketRef = useRef(null);

  const SOCKET_URL = 'http://192.168.0.5:3000';

  useEffect(() => {
    (async () => {
      await load();
      setupSocket();
    })();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // ============================================================
  // SOCKET
  // ============================================================
  const setupSocket = () => {
    try {
      const socket = io(SOCKET_URL, { transports: ['websocket'] });
      socketRef.current = socket;

      socket.on('speed_update', (payload) => {
        if (!payload) return;
        if (typeof payload === 'object' && payload.bike_uuid) {
          const s = Number(payload.speed ?? payload.value ?? 0);

          setLiveSpeedByBike(prev => ({
            ...prev,
            [payload.bike_uuid]: {
              speed: isNaN(s) ? 0 : s,
              updatedAt: Date.now()
            }
          }));
        }
      });
    } catch (err) {}
  };

  // ============================================================
  // LOADS
  // ============================================================
  const loadBikes = async () => {
    try {
      const res = await api.get('/v1/bikes/my-bikes');
      const payload = res.data?.data ?? res.data;
      const arr = Array.isArray(payload) ? payload : [payload];
      setBikes(arr);
    } catch {
      setBikes([]);
    }
  };

  const loadRunsFromAPI = async () => {
    try {
      const res = await api.get('/v1/runs');
      const arr = Array.isArray(res.data) ? res.data : res.data?.data;
      setRuns(arr || []);
    } catch {
      setRuns([]);
    }
  };

  const loadActiveRunFromAPI = async () => {
    try {
      const res = await api.get('/v1/runs', { params: { status: 'active', limit: 1 } });
      const arr = Array.isArray(res.data) ? res.data : res.data?.data;
      const act = arr?.length > 0 ? arr[0] : null;

      setActiveRun(act);

      if (act?.bike_uuid && socketRef.current?.connected) {
        socketRef.current.emit('join_bike', act.bike_uuid);
        fetchLiveForBike(act.bike_uuid);
      }
    } catch {
      setActiveRun(null);
    }
  };

  const fetchLiveForBike = async (uuid) => {
    try {
      const res = await api.get(`/v1/runs/bike/${uuid}/live`);
      if (res.data?.last) {
        const s = res.data.last.speed_kmh ?? res.data.avg_last_n?.avg_kmh;

        setLiveSpeedByBike(prev => ({
          ...prev,
          [uuid]: {
            speed: s ?? 0,
            updatedAt: Date.now()
          }
        }));
      }
    } catch {}
  };

  // ============================================================
  // START / STOP
  // ============================================================
  const startRun = async () => {
    if (activeRun) return;
    if (!bikeId) return Alert.alert("Escolha uma bike");
    if (!name) return Alert.alert("Dê um nome à corrida");

    try {
      const bike = bikes.find(b => b.id_bike === bikeId);

      const payload = {
        name,
        bike_uuid: bike?.id_bike
      };

      const res = await api.post('/v1/runs', payload);
      const created = res.data;

      await loadRunsFromAPI();
      await loadActiveRunFromAPI();

      setName('');
      setBikeId('');

      navigation.navigate('RealTimeSpeed', {
        id_run: created.id_run,
        bike_uuid: bike?.id_bike
      });
    } catch (err) {
      Alert.alert("Erro", err.response?.data?.message || "Falha ao iniciar corrida");
    }
  };

  const stopRun = async () => {
    if (!activeRun) return;

    try {
      await api.post(`/v1/runs/${activeRun.id_run}/stop`);
      await loadRunsFromAPI();
      await loadActiveRunFromAPI();
      Alert.alert("Sucesso", "Corrida finalizada");
    } catch (err) {
      Alert.alert("Erro", err.response?.data?.message || "Falha ao finalizar");
    }
  };

  // ============================================================
  // LOAD INICIAL
  // ============================================================
  const loadActiveRun = loadActiveRunFromAPI;

  const load = async () => {
    setLoading(true);
    await loadBikes();
    await loadRunsFromAPI();
    await loadActiveRun();
    setLoading(false);
  };

  const getLiveSpeedFor = (uuid) => {
    return liveSpeedByBike[uuid]?.speed ?? "—";
  };

  // ============================================================
  // UI
  // ============================================================
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#b30000" />
      </View>
    );
  }

  const DISABLED = !!activeRun;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      {/* -------------------------------------------------- */}
      {/* CARD DE INICIAR CORRIDA */}
      {/* -------------------------------------------------- */}
      <View style={[styles.cardStart, DISABLED && styles.cardDisabled]}>
        <Text style={styles.startTitle}>Iniciar nova corrida</Text>
        <Text style={styles.startSubtitle}>
          {DISABLED ? "Finalize a corrida atual para iniciar outra" : "Selecione uma bike disponível"}
        </Text>

        {bikes.map(b => (
          <TouchableOpacity
            key={b.id_bike}
            disabled={DISABLED}
            style={[
              styles.bikeOption,
              bikeId === b.id_bike && styles.bikeOptionSelected,
              DISABLED && styles.optionDisabled
            ]}
            onPress={() => !DISABLED && setBikeId(b.id_bike)}
          >
            <Text style={[styles.bikeOptionText, DISABLED && styles.textDisabled]}>
              {b.name} (UUID: {b.id_bike})
            </Text>
          </TouchableOpacity>
        ))}

        <TextInput
          placeholder="Nome da corrida"
          placeholderTextColor="#aaa"
          value={name}
          editable={!DISABLED}
          onChangeText={!DISABLED ? setName : () => {}}
          style={[styles.input, DISABLED && styles.inputDisabled]}
        />

        <View style={styles.row}>
          <TouchableOpacity
            disabled={DISABLED}
            style={[styles.btnStart, DISABLED && styles.btnDisabled]}
            onPress={startRun}
          >
            <Text style={styles.btnStartText}>Iniciar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={DISABLED}
            style={[styles.btnClear, DISABLED && styles.btnDisabledOutline]}
            onPress={() => { setName(''); setBikeId(''); }}
          >
            <Text style={[styles.btnClearText, DISABLED && styles.textDisabled]}>
              Limpar
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* -------------------------------------------------- */}
      {/* CORRIDA ATIVA */}
      {/* -------------------------------------------------- */}
      <Text style={styles.sectionTitle}>Corrida Ativa</Text>

      {!activeRun && <Text style={styles.empty}>Nenhuma corrida ativa no momento.</Text>}

      {activeRun && (
        <View style={styles.activeCard}>
          <Text style={styles.activeTitle}>{activeRun.name}</Text>
          <Text style={styles.activeInfo}>Bike: <Text style={styles.bold}>{activeRun.bike_uuid}</Text></Text>
          <Text style={styles.activeInfo}>
            Iniciada: <Text style={styles.bold}>{new Date(activeRun.started_at).toLocaleString()}</Text>
          </Text>

          <View style={styles.separator} />

          <Text style={styles.liveLabel}>Velocidade (ao vivo)</Text>
          <Text style={styles.liveValue}>{getLiveSpeedFor(activeRun.bike_uuid)}</Text>

          <View style={styles.row}>
            <TouchableOpacity style={styles.stopBtn} onPress={stopRun}>
              <Text style={styles.stopBtnText}>Encerrar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.panelBtn}
              onPress={() =>
                navigation.navigate('RealTimeSpeed', {
                  id_run: activeRun.id_run,
                  bike_uuid: activeRun.bike_uuid
                })
              }
            >
              <Text style={styles.panelBtnText}>Abrir painel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* -------------------------------------------------- */}
      {/* HISTÓRICO — sem botão de encerrar */}
      {/* -------------------------------------------------- */}
      <Text style={styles.sectionTitle}>Histórico</Text>

      {runs.length === 0 && <Text style={styles.empty}>Nenhuma corrida registrada.</Text>}

      {runs.map(r => (
        <View key={r.id_run} style={styles.historyCard}>
          <Text style={styles.historyTitle}>{r.name || "(sem nome)"}</Text>
          <Text style={styles.historyInfo}>Bike: {r.bike_uuid}</Text>
          <Text style={styles.historyInfo}>Status: {r.status}</Text>
          <Text style={styles.historyInfo}>Início: {new Date(r.started_at).toLocaleString()}</Text>

          {r.ended_at && (
            <Text style={styles.historyInfo}>
              Fim: {new Date(r.ended_at).toLocaleString()}
            </Text>
          )}
        </View>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },

  container: { padding: 20, paddingBottom: 40 },

  loading: { flex: 1, justifyContent: "center", alignItems: "center" },

  backBtn: { marginBottom: 8 },
  backText: { color: "#b30000", fontWeight: "700", fontSize: 16 },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#b30000",
    marginVertical: 12
  },

  empty: { color: "#777", marginBottom: 8 },

  // ------------------------------------------------------
  // CARD START
  // ------------------------------------------------------
  cardStart: {
    backgroundColor: "#fff4f4",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f3c9c9",
    marginBottom: 24
  },

  cardDisabled: { opacity: 0.45 },

  startTitle: {
    fontSize: 18,
    color: "#b30000",
    fontWeight: "700",
    marginBottom: 4
  },

  startSubtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12
  },

  bikeOption: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 8,
    backgroundColor: "#fff"
  },

  bikeOptionSelected: {
    borderColor: "#b30000",
    backgroundColor: "#ffe1e1"
  },

  optionDisabled: { opacity: 0.5 },

  bikeOptionText: { fontSize: 15, color: "#333" },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12
  },

  inputDisabled: { backgroundColor: "#eee", color: "#888" },

  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  btnStart: {
    flex: 1,
    backgroundColor: "#b30000",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 8
  },

  btnDisabled: { opacity: 0.5 },

  btnStartText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  btnClear: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#b30000",
    alignItems: "center"
  },

  btnDisabledOutline: { borderColor: "#aaa", opacity: 0.5 },

  btnClearText: { color: "#b30000", fontWeight: "700", fontSize: 16 },

  textDisabled: { color: "#777" },

  // ------------------------------------------------------
  // ACTIVE RUN
  // ------------------------------------------------------
  activeCard: {
    padding: 18,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ffcccc",
    marginBottom: 24
  },

  activeTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#b30000",
    marginBottom: 6
  },

  activeInfo: { fontSize: 14, color: "#444", marginBottom: 2 },

  bold: { fontWeight: "700", color: "#222" },

  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12
  },

  liveLabel: { textAlign: "center", color: "#777", fontSize: 13 },

  liveValue: {
    fontSize: 38,
    fontWeight: "700",
    color: "#b30000",
    textAlign: "center",
    marginVertical: 4
  },

  stopBtn: {
    flex: 1,
    backgroundColor: "#ff4444",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 8
  },

  stopBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  panelBtn: {
    flex: 1,
    backgroundColor: "#b30000",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginLeft: 8
  },

  panelBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  // ------------------------------------------------------
  // HISTÓRICO — sem botão encerrar
  // ------------------------------------------------------
  historyCard: {
    padding: 16,
    backgroundColor: "#fafafa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 12
  },

  historyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#b30000",
    marginBottom: 4
  },

  historyInfo: { fontSize: 14, color: "#444", marginBottom: 2 }
});
