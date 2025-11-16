import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../api/api';

const safeNumber = (n) => {
  const v = Number(n);
  return isFinite(v) ? v : 0;
};

export default function StatsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bikeId, runId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [labels, setLabels] = useState([]);
  const [data, setData] = useState([]);

  useEffect(() => {
    if (bikeId) loadBike(bikeId);
    else if (runId) loadRun(runId);
    else setLoading(false);
  }, []);

  const loadBike = async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/v1/estatisticas/bike/${id}`);
      parseStats(res.data);
    } catch { }
    setLoading(false);
  };

  const loadRun = async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/v1/estatisticas/run/${id}`);
      parseStats(res.data);
    } catch { }
    setLoading(false);
  };

  const parseStats = (raw) => {
    const body = raw?.data || raw || {};
    const series = body.series || body.data || body.stats || [];

    if (Array.isArray(series) && series.length) {
      setLabels(series.map(s => s.label || ''));
      setData(series.map(s => safeNumber(s.value)));
    } else {
      const k = Object.keys(body).slice(0,10);
      setLabels(k);
      setData(Object.values(body).slice(0,10).map(safeNumber));
    }
  };

  if (loading) return (
    <View style={s.loading}>
      <ActivityIndicator size="large" color="#b30000"/>
    </View>
  );

  const screenWidth = Dimensions.get('window').width;

  return (
    <ScrollView contentContainerStyle={s.container}>

      <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
        <Text style={s.backText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={s.title}>Estatísticas</Text>

      <LineChart
        data={{ labels, datasets: [{ data }] }}
        width={screenWidth - 20}
        height={250}
        chartConfig={{
          backgroundGradientFrom:'#fff',
          backgroundGradientTo:'#fff',
          decimalPlaces:0,
          color:(o)=>`rgba(179,0,0,${o})`,
          labelColor:(o)=>`rgba(0,0,0,${o})`,
        }}
        bezier
        style={{borderRadius:16,marginTop:20}}
      />

    </ScrollView>
  );
}

const s = StyleSheet.create({
  loading:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#fff'},
  container:{padding:20,alignItems:'center',backgroundColor:'#fff',paddingBottom:40},
  backBtn:{alignSelf:'flex-start',marginBottom:10},
  backText:{fontSize:16,fontWeight:'700',color:'#b30000'},
  title:{fontSize:22,fontWeight:'700',color:'#b30000'}
});
