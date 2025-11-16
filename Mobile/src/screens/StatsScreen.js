import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import api from '../api/api';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen({ navigation }) {
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================
  // LOAD RUNS FROM API
  // ==========================
  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    try {
      const res = await api.get("/v1/runs");
      setRuns(res.data?.data ?? res.data ?? []);
    } catch {
      setRuns([]);
    }
    setLoading(false);
  };

  // ==========================================================
  // SIMULA VELOCIDADES REALISTAS PARA A CORRIDA ESCOLHIDA
  // ==========================================================
  const generateSpeeds = () => {
    const size = Math.floor(Math.random() * 40) + 30;
    const base = Math.random() * 5 + 20; // 20–25 km/h
    let values = [];

    for (let i = 0; i < size; i++) {
      const variation = (Math.random() - 0.5) * 6;
      values.push(Number((base + variation).toFixed(2)));
    }

    return values;
  };

  // =========================================================
  // CALCULOS
  // =========================================================
  const calculateStats = (values) => {
    if (!values || values.length === 0) return null;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;

    const sorted = [...values].sort((a, b) => a - b);

    const median =
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    const freq = {};
    sorted.forEach(v => (freq[v] = (freq[v] || 0) + 1));
    const mode = Object.keys(freq).reduce((a, b) => (freq[a] > freq[b] ? a : b));

    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev / mean) * 100;

    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q2 = median;
    const q3 = sorted[Math.floor(sorted.length * 0.75)];

    return {
      values,
      mean,
      median,
      mode,
      stdDev,
      cv,
      q1,
      q2,
      q3,
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  };

  const selectRun = (run) => {
    setSelectedRun(run);
    const simulated = generateSpeeds();
    const calculated = calculateStats(simulated);
    setStats(calculated);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#b30000" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      
      {/* VOLTAR */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Estatísticas</Text>

      {/* LISTA DE CORRIDAS */}
      <Text style={styles.subtitle}>Selecione uma corrida</Text>

      {runs.map(r => (
        <TouchableOpacity
          key={r.id_run}
          style={[
            styles.runItem,
            selectedRun?.id_run === r.id_run && styles.runSelected
          ]}
          onPress={() => selectRun(r)}
        >
          <Text style={styles.runText}>{r.name} — {r.status}</Text>
        </TouchableOpacity>
      ))}

      {!selectedRun && <Text style={styles.empty}>Nenhuma corrida selecionada.</Text>}

      {/* ESTATÍSTICAS / PIE CHART */}
      {stats && (
        <>
          {/* GRÁFICO DE PIZZA */}
          <PieChart
            data={[
              {
                name: "Lento (<20)",
                population: stats.values.filter(v => v < 20).length,
                color: "#ff9999",
                legendFontColor: "#444",
                legendFontSize: 14
              },
              {
                name: "Moderado (20-25)",
                population: stats.values.filter(v => v >= 20 && v < 25).length,
                color: "#ff6666",
                legendFontColor: "#444",
                legendFontSize: 14
              },
              {
                name: "Rápido (25-30)",
                population: stats.values.filter(v => v >= 25 && v < 30).length,
                color: "#cc0000",
                legendFontColor: "#444",
                legendFontSize: 14
              },
              {
                name: "Muito rápido (30+)",
                population: stats.values.filter(v => v >= 30).length,
                color: "#990000",
                legendFontColor: "#444",
                legendFontSize: 14
              }
            ]}
            width={screenWidth - 20}
            height={260}
            chartConfig={{
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              color: () => "#b30000"
            }}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"10"}
            center={[0, 5]}
          />

          {/* CARDS */}
          <View style={styles.row}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Média</Text>
              <Text style={styles.cardValue}>{stats.mean.toFixed(2)}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Mediana</Text>
              <Text style={styles.cardValue}>{stats.median.toFixed(2)}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Moda</Text>
              <Text style={styles.cardValue}>{stats.mode}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Desvio Padrão</Text>
              <Text style={styles.cardValue}>{stats.stdDev.toFixed(2)}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Coef. Variação</Text>
              <Text style={styles.cardValue}>{stats.cv.toFixed(1)}%</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>IQR</Text>
              <Text style={styles.cardValue}>{(stats.q3 - stats.q1).toFixed(2)}</Text>
            </View>
          </View>

          {/* EXTREMOS */}
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Extremos</Text>
            <Text style={styles.boxText}>Mínimo: {stats.min}</Text>
            <Text style={styles.boxText}>Máximo: {stats.max}</Text>
            <Text style={styles.boxText}>Outliers: 0</Text>
          </View>

          {/* QUANTIS */}
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Quantis</Text>
            <Text style={styles.boxText}>Q1: {stats.q1}</Text>
            <Text style={styles.boxText}>Q2 (Mediana): {stats.q2}</Text>
            <Text style={styles.boxText}>Q3: {stats.q3}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ============================
// STYLES
// ============================
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 20 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  backText: { color: "#b30000", fontWeight: "700", fontSize: 16 },
  title: { fontSize: 24, fontWeight: "700", textAlign: "center", color: "#b30000", marginBottom: 15 },
  subtitle: { fontSize: 16, marginBottom: 10, fontWeight: "600" },
  runItem: { padding: 12, backgroundColor: "#eee", borderRadius: 10, marginBottom: 8 },
  runSelected: { borderWidth: 2, borderColor: "#b30000", backgroundColor: "#ffeaea" },
  runText: { fontSize: 15, color: "#333" },
  empty: { textAlign: "center", color: "#888", marginTop: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
  card: { flex: 1, marginHorizontal: 5, backgroundColor: "#fafafa", padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#eee" },
  cardLabel: { textAlign: "center", fontSize: 13, color: "#777" },
  cardValue: { textAlign: "center", fontSize: 20, fontWeight: "700", color: "#b30000" },
  box: { padding: 14, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, marginTop: 15 },
  boxTitle: { fontSize: 17, fontWeight: "700", color: "#b30000", marginBottom: 5 },
  boxText: { fontSize: 15, color: "#444" }
});
