import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import api from '../api/api';
import io from 'socket.io-client';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function RealTimeSpeedScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  const initialRunId = route.params?.id_run || null;
  const initialBikeUuid = route.params?.bike_uuid || null;

  const [idRun, setIdRun] = useState(initialRunId);
  const [bikeUuid, setBikeUuid] = useState(initialBikeUuid);

  const [speed, setSpeed] = useState(null);
  const [avg10, setAvg10] = useState(null);
  const [lastTimestamp, setLastTimestamp] = useState(null);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef(null);
  const SOCKET_URL = 'http://192.168.0.5:3000';

  // ----------------------------------------------------------
  // SE NÃO VEIO CORRIDA DA NAVEGAÇÃO → BUSCA AUTOMÁTIICO
  // ----------------------------------------------------------
  useEffect(() => {
    const loadActiveRunIfNeeded = async () => {
      if (idRun && bikeUuid) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/v1/runs', {
          params: { status: 'active', limit: 1 },
        });

        const arr = Array.isArray(res.data) ? res.data : res.data?.data;

        if (!arr || arr.length === 0) {
          Alert.alert('Aviso', 'Nenhuma corrida ativa encontrada.');
          navigation.goBack();
          return;
        }

        setIdRun(arr[0].id_run);
        setBikeUuid(arr[0].bike_uuid);
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar a corrida ativa.');
        navigation.goBack();
      }

      setLoading(false);
    };

    loadActiveRunIfNeeded();
  }, []);

  // ----------------------------------------------------------
  // SOCKET
  // ----------------------------------------------------------
  useEffect(() => {
    if (!bikeUuid) return;

    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_bike', bikeUuid);
    });

    socket.on('speed_update', (payload) => {
      if (!payload || payload.bike_uuid !== bikeUuid) return;

      const s = Number(payload.speed ?? payload.value ?? 0);
      setSpeed(isNaN(s) ? null : s);
      setLastTimestamp(Date.now());
    });

    return () => socket.disconnect();
  }, [bikeUuid]);

  // ----------------------------------------------------------
  // MÉDIA DAS 10 VOLTAS
  // ----------------------------------------------------------
  useEffect(() => {
    if (!bikeUuid) return;

    const fetchLive = async () => {
      try {
        const res = await api.get(`/v1/runs/bike/${bikeUuid}/live`);

        const live = res.data;

        if (live?.last) {
          setSpeed(live.last.speed_kmh ?? null);
          setLastTimestamp(Date.now());
        }

        if (live?.avg_last_n) {
          setAvg10(live.avg_last_n.avg_kmh ?? null);
        }
      } catch {}
    };

    fetchLive();
    const interval = setInterval(fetchLive, 1800);
    return () => clearInterval(interval);
  }, [bikeUuid]);

  // ----------------------------------------------------------

  if (loading || !idRun || !bikeUuid) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#b30000" />
        <Text style={{ marginTop: 10, color: '#555' }}>
          Carregando corrida ativa...
        </Text>
      </View>
    );
  }

  const statusConnected = speed !== null;

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
      >
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Velocidade em Tempo Real</Text>

      <View style={{ alignItems: 'center', marginBottom: 14 }}>
        <Text style={styles.subLabel}>Bike: {bikeUuid}</Text>
        <Text style={styles.subLabel}>Run: {idRun}</Text>
      </View>

      <View style={styles.statusRow}>
        <View
          style={[
            styles.dot,
            { backgroundColor: statusConnected ? '#16c60c' : '#cc0000' },
          ]}
        />
        <Text style={styles.statusText}>
          {statusConnected ? 'Conectado' : 'Desconectado'}
        </Text>
      </View>

      {/* Velocidade grande */}
      <Text style={styles.speedValue}>
        {speed !== null ? speed.toFixed(2) : '--'}{' '}
        <Text style={styles.kmh}>km/h</Text>
      </Text>

      {/* Cartão bonito */}
      <View style={styles.card}>
        <Text style={styles.cardText}>
          Média (últimas 10 voltas):{' '}
          <Text style={styles.bold}>
            {avg10 !== null ? avg10.toFixed(2) : '--'} km/h
          </Text>
        </Text>

        <Text style={styles.cardText}>
          Última atualização:{' '}
          <Text style={styles.bold}>
            {lastTimestamp
              ? new Date(lastTimestamp).toLocaleTimeString()
              : '--'}
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 22,
    backgroundColor: '#ffffff',
    flex: 1,
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backBtn: {
    marginBottom: 15,
  },

  backText: {
    color: '#b30000',
    fontSize: 16,
    fontWeight: '700',
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#b30000',
    textAlign: 'center',
    marginBottom: 14,
  },

  subLabel: {
    fontSize: 14,
    color: '#666',
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 22,
    alignItems: 'center',
  },

  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },

  statusText: {
    fontSize: 15,
    color: '#444',
  },

  speedValue: {
    fontSize: 70,
    fontWeight: '900',
    textAlign: 'center',
    color: '#b30000',
    marginVertical: 6,
    textShadowColor: 'rgba(0,0,0,0.20)',
    textShadowRadius: 8,
  },

  kmh: {
    fontSize: 30,
    fontWeight: '800',
    color: '#b30000',
  },

  card: {
    backgroundColor: '#f3f3f3',
    padding: 18,
    borderRadius: 16,
    marginTop: 25,
    borderWidth: 1,
    borderColor: '#e3e3e3',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  cardText: {
    fontSize: 15,
    color: '#444',
    marginBottom: 6,
  },

  bold: {
    fontWeight: '700',
    color: '#222',
  },
});
