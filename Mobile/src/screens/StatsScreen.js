import React,{useEffect,useState} from 'react';
import {
  View,Text,Dimensions,ActivityIndicator,StyleSheet,
  ScrollView,TouchableOpacity,TextInput
} from 'react-native';
import {LineChart} from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import api from '../api/api';

// FUNÇÃO PARA GARANTIR QUE NUNCA VAI TER NaN OU INFINITY
const safeNumber = (n) => {
  const v = Number(n);
  return isFinite(v) ? v : 0;
};

export default function StatsScreen(){

  const navigation = useNavigation();

  const [loading,setLoading]=useState(true);
  const [bikes,setBikes]=useState([]);
  const [labels,setLabels]=useState([]);
  const [data,setData]=useState([]);
  const [runId,setRunId]=useState('');

  const idKeys = ['bike_uuid','uuid','bike_id','id'];
  const nameKeys = ['name','nome','titulo'];

  // CORRIGIDO: "/bikes" (plural)
  useEffect(()=>{
    const load = async()=>{
      try{
        const res = await api.get('/v1/bikes/my-bikes');
        const items = res.data?.data || res.data || [];
        setBikes(Array.isArray(items) ? items : []);
      }catch(e){
        console.log("Erro ao buscar bikes:", e.message);
      }
      setLoading(false);
    };
    load();
  },[]);

  const getKey = (obj,keys) => 
    keys.find(k => obj && Object.prototype.hasOwnProperty.call(obj,k));

  const processSeries = (series) => {
    if (!Array.isArray(series) || !series.length) return { labels: [], data: [] };

    return {
      labels: series.map((s,i) => s.label || `P${i+1}`),
      data: series.map(s => safeNumber(s.value))
    };
  };

  const fetchBikeStats = async(bike)=>{
    const idKey = getKey(bike,idKeys);
    const bikeId = bike[idKey];
    if(!bikeId) return;

    setLoading(true);

    try{
      const res = await api.get(`/v1/estatisticas/bike/${String(bikeId)}`);
      const body = res.data?.data || res.data || {};

      const series = body.series || body.data || body.stats || [];
      const processed = processSeries(series);

      if (processed.labels.length) {
        setLabels(processed.labels);
        setData(processed.data);
      } else {
        setLabels(Object.keys(body).slice(0,10));
        setData(Object.values(body).slice(0,10).map(safeNumber));
      }

    }catch(e){
      console.log("Erro bike stats:", e.message);
    }

    setLoading(false);
  };

  const fetchRunStats = async()=>{
    if(!runId) return;

    setLoading(true);
    try{
      const res = await api.get(`/v1/estatisticas/run/${String(runId)}`);
      const body = res.data?.data || res.data || {};

      const series = body.series || body.data || body.stats || [];
      const processed = processSeries(series);

      if (processed.labels.length){
        setLabels(processed.labels);
        setData(processed.data);
      } else {
        setLabels(Object.keys(body).slice(0,10));
        setData(Object.values(body).slice(0,10).map(safeNumber));
      }

    }catch(e){
      console.log("Erro run stats:", e.message);
    }

    setLoading(false);
  };

  if(loading){
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
        <ActivityIndicator size="large" color="#b30000" />
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;

  return (
    <ScrollView contentContainerStyle={s.container}>

      {/* BOTÃO DE VOLTAR */}
      <TouchableOpacity
        style={s.backBtn}
        onPress={() => {
          if (navigation.canGoBack()) navigation.goBack();
          else navigation.navigate('Home');
        }}
      >
        <Text style={s.backBtnText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={s.title}>Estatísticas</Text>

      <Text style={{alignSelf:'flex-start',marginLeft:10,marginTop:10}}>Minhas bikes:</Text>

      {bikes.map((b,idx)=>{
        const idKey = getKey(b,idKeys);
        const nameKey = getKey(b,nameKeys);
        const label = (nameKey ? b[nameKey] : null) || (idKey ? b[idKey] : `Bike ${idx+1}`);

        return (
          <TouchableOpacity
            key={idx}
            onPress={()=>fetchBikeStats(b)}
            style={{padding:10,alignSelf:'stretch',borderBottomWidth:1,borderColor:'#eee'}}
          >
            <Text>{label}</Text>
          </TouchableOpacity>
        );
      })}

      <View style={{width:'100%',alignItems:'center',marginTop:10}}>
        <TextInput
          placeholder="Buscar run por ID"
          value={runId}
          onChangeText={setRunId}
          style={s.input}
        />
        <TouchableOpacity style={s.btn} onPress={fetchRunStats}>
          <Text style={s.btnText}>Buscar run</Text>
        </TouchableOpacity>
      </View>

      <LineChart
        data={{labels:labels, datasets:[{data:data}]}}
        width={screenWidth-20}
        height={220}
        yAxisLabel=""
        chartConfig={{
          backgroundGradientFrom:'#fff',
          backgroundGradientTo:'#fff',
          decimalPlaces:0,
          color:(opacity=1)=>`rgba(179,0,0,${opacity})`,
          labelColor:(opacity=1)=>`rgba(0,0,0,${opacity})`
        }}
        bezier
        style={{borderRadius:16,marginTop:20}}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:{flexGrow:1,alignItems:'center',padding:10,backgroundColor:'#fff'},
  title:{fontSize:22,color:'#b30000',marginBottom:10},
  input:{borderWidth:1,borderColor:'#ddd',padding:10,borderRadius:8,marginTop:6,alignSelf:'stretch',width:'90%'},
  btn:{backgroundColor:'#b30000',padding:10,borderRadius:8,alignItems:'center',width:'60%',marginTop:8},
  btnText:{color:'#fff',fontWeight:'700'},
  backBtn:{
    alignSelf:'flex-start',
    backgroundColor:'#b30000',
    paddingVertical:8,
    paddingHorizontal:12,
    borderRadius:8,
    marginBottom:8
  },
  backBtnText:{
    color:'#fff',
    fontWeight:'700'
  }
});
