import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../api/api';

const safe = (v) => (isFinite(Number(v)) ? Number(v) : 0);

export default function StatsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bikeId, runId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [chartLabels, setChartLabels] = useState([]);
  const [chartValues, setChartValues] = useState([]);
  const [stats, setStats] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (runId) loadRun(runId);
    else if (bikeId) loadBike(bikeId);
    else setLoading(false);
  }, []);

  const loadRun = async (id) => {
    try {
      setLoading(true);
      const res = await api.get(`/v1/estatisticas/run/${id}`);
      parseStats(res.data);
    } catch (e) {
      console.log('Erro ao carregar run:', e);
    }
    setLoading(false);
  };

  const loadBike = async (id) => {
    try {
      setLoading(true);
      const res = await api.get(`/v1/estatisticas/bike/${id}`);
      parseStats(res.data);
    } catch (e) {
      console.log('Erro ao carregar bike:', e);
    }
    setLoading(false);
  };

  // ---------- PARSER OFICIAL E 100% ACERTADO ----------
  const parseStats = (raw) => {
    const payload = raw?.data || raw || {};

    setStats(payload);

    const dist = payload?.probabilidades?.distribuicao_frequencia || [];

    if (!Array.isArray(dist) || dist.length === 0) {
      setChartLabels(['Sem dados']);
      setChartValues([0]);
      return;
    }

    setChartLabels(dist.map((_, i) => `C${i + 1}`));
    setChartValues(dist.map((c) => safe(c.frequencia)));
  };

  const gerarEstatisticas = async () => {
    if (!runId) return;

    setGenerating(true);
    try {
      await api.post(`/estatisticas/gerar/${runId}`);
      await loadRun(runId);
    } catch (e) {
      console.log('Erro ao gerar:', e);
    }
    setGenerating(false);
  };

  if (loading)
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#b30000" />
      </View>
    );

  const w = Dimensions.get('window').width - 24;

  const tc = stats?.tendencia_central || {};
  const disp = stats?.dispersao || {};
  const q = stats?.quantis || {};
  const ext = stats?.extremos || {};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Estatísticas</Text>

      {runId && (
        <TouchableOpacity style={styles.generateBtn} onPress={gerarEstatisticas}>
          <Text style={styles.generateText}>
            {generating ? 'Gerando...' : 'Gerar Estatísticas'}
          </Text>
        </TouchableOpacity>
      )}

      {/* ---------- GRÁFICO ---------- */}
      <LineChart
        data={{
          labels: chartLabels,
          datasets: [{ data: chartValues }]
        }}
        width={w}
        height={250}
        withInnerLines={false}
        withShadow={false}
        chartConfig={{
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity) => `rgba(179,0,0,${opacity})`,
          labelColor: () => '#444',
          propsForDots: { r: '3' }
        }}
        bezier
        style={styles.chart}
      />

      {/* ---------- CARDS PRINCIPAIS ---------- */}
      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Média</Text>
          <Text style={styles.cardValue}>{tc.media ?? 0}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Mediana</Text>
          <Text style={styles.cardValue}>{tc.mediana ?? 0}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Moda</Text>
          <Text style={styles.cardValue}>
            {Array.isArray(tc.moda) ? tc.moda[0] ?? '—' : tc.moda ?? '—'}
          </Text>
        </View>
      </View>

      {/* ---------- CARDS SECUNDÁRIOS ---------- */}
      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Desvio Padrão</Text>
          <Text style={styles.cardValue}>{disp.desvio_padrao ?? 0}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Coef. Variação</Text>
          <Text style={styles.cardValue}>
            {disp.coeficiente_variacao ? disp.coeficiente_variacao + '%' : '0%'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>IQR</Text>
          <Text style={styles.cardValue}>{disp.amplitude_interquartil ?? 0}</Text>
        </View>
      </View>

      {/* ---------- EXTREMOS ---------- */}
      <View style={styles.block}>
        <Text style={styles.blockTitle}>Extremos</Text>
        <Text style={styles.blockText}>Mínimo: {ext.minimo ?? '-'}</Text>
        <Text style={styles.blockText}>Máximo: {ext.maximo ?? '-'}</Text>
        <Text style={styles.blockText}>
          Outliers: {ext?.outliers?.quantidade ?? 0}
        </Text>
      </View>

      {/* ---------- QUANTIS ---------- */}
      <View style={styles.block}>
        <Text style={styles.blockTitle}>Quantis</Text>
        <Text style={styles.blockText}>Q1: {q.q1 ?? '-'}</Text>
        <Text style={styles.blockText}>Q2 (Mediana): {q.q2 ?? '-'}</Text>
        <Text style={styles.blockText}>Q3: {q.q3 ?? '-'}</Text>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

  container: { padding: 20, backgroundColor: '#fff', alignItems: 'center' },

  backBtn: { alignSelf: 'flex-start', marginBottom: 10 },
  backText: { fontSize: 16, fontWeight: '700', color: '#b30000' },

  title: { fontSize: 26, fontWeight: '800', color: '#b30000', marginBottom: 10 },

  generateBtn: {
    backgroundColor: '#b30000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 15
  },
  generateText: { color: '#fff', fontWeight: '700' },

  chart: { borderRadius: 18, marginVertical: 20 },

  cardRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  card: {
    backgroundColor: '#fff',
    width: '32%',
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
    alignItems: 'center',
    borderColor: '#ddd',
    borderWidth: 1
  },
  cardLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  cardValue: { fontSize: 16, fontWeight: '700', color: '#b30000' },

  block: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
    marginBottom: 15
  },
  blockTitle: { fontSize: 18, fontWeight: '700', color: '#b30000', marginBottom: 8 },
  blockText: { fontSize: 15, color: '#444', marginBottom: 4 }
});
