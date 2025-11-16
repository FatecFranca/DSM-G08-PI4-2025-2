import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import api from "../api/api";

export default function SelectBikeRealTimeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [bikes, setBikes] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/v1/bikes");
        setBikes(res.data?.data || []);
      } catch (e) {
        console.log("Erro ao carregar bikes:", e);
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color="#b30000" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.container}>

      {/* 🔙 Botão de volta */}
      <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
        <Text style={s.backText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={s.title}>Selecione a Bike</Text>

      {bikes.length === 0 && (
        <Text style={s.empty}>Nenhuma bike encontrada.</Text>
      )}

      {bikes.map((bike, index) => (
        <TouchableOpacity
          key={index}
          style={s.card}
          onPress={() =>
            navigation.navigate("RealTimeSpeed", { bikeId: bike.id_bike })
          }
        >
          <Text style={s.cardTitle}>{bike.name || "Bike sem nome"}</Text>
          <Text style={s.cardSub}>UUID: {bike.id_bike}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },

  container: { padding: 20, backgroundColor: "#fff", minHeight: "100%" },

  // 🔙 Botão de voltar (pequeno, estiloso, no topo)
  backBtn: {
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  backText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#b30000",
  },

  title: { fontSize: 22, fontWeight: "700", color: "#b30000", marginBottom: 20 },

  empty: { textAlign: "center", color: "#666", marginTop: 20 },

  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#b30000" },
  cardSub: { fontSize: 13, color: "#666", marginTop: 6 },
});
