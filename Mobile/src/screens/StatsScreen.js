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

  // ============================
  // CARREGA AS ESTATÍSTICAS DA API
  // ============================
  const selectRun = async (run) => {
    try {
      setSelectedRun(run);

      const res = await api.get(`/v1/estatisticas/run/${run.id_run}`);
      const dados = res.data?.data ?? {};

      // API já calcula tudo → apenas exibimos
      setStats({
        mean: dados.tendencia_central?.media ?? 0,
        median: dados.tendencia_central?.mediana ?? 0,
        mode: Array.isArray(dados.tendencia_central?.moda)
          ? (dados.tendencia_central.moda[0] ?? 0)
          : 0,

        stdDev: dados.dispersao?.desvio_padrao ?? 0,
        cv: dados.dispersao?.coeficiente_variacao ?? 0,

        q1: dados.quantis?.q1 ?? 0,
        q2: dados.quantis?.q2 ?? 0,
        q3: dados.quantis?.q3 ?? 0,

        min: dados.extremos?.minimo ?? 0,
        max: dados.extremos?.maximo ?? 0
      });

    } catch (err) {
      console.log("Erro ao carregar estatísticas:", err);

      setStats({
        mean: 0,
        median: 0,
        mode: 0,
        stdDev: 0,
        cv: 0,
        q1: 0,
        q2: 0,
        q3: 0,
        min: 0,
        max: 0
      });
    }
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

      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Estatísticas</Text>

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

      {!selectedRun && (
        <Text style={styles.empty}>Nenhuma corrida selecionada.</Text>
      )}

      {/* SE TEM ESTATÍSTICAS, MOSTRA */}
      {stats && (
        <>

          {/* GRÁFICO DE PIZZA */}
          <PieChart
            data={[
              {
                name: "Média",
                population: stats.mean,
                color: "#b30000",
                legendFontColor: "#333",
                legendFontSize: 13
              },
              {
                name: "Mediana",
                population: stats.median,
                color: "#ff7777",
                legendFontColor: "#333",
                legendFontSize: 13
              },
              {
                name: "Moda",
                population: Number(stats.mode),
                color: "#ffb3b3",
                legendFontColor: "#333",
                legendFontSize: 13
              }
            ]}
            width={screenWidth - 20}
            height={220}
            chartConfig={{
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              color: () => "#b30000"
            }}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"10"}
            center={[0, 8]}
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
