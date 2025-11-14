import React,{useEffect,useState} from 'react';
import {View,Text,Dimensions,ActivityIndicator,StyleSheet,ScrollView,TouchableOpacity,TextInput} from 'react-native';
import {LineChart} from 'react-native-chart-kit';
import api from '../api/api';

export default function StatsScreen(){
  const [loading,setLoading]=useState(true);
  const [bikes,setBikes]=useState([]);
  const [labels,setLabels]=useState([]);
  const [data,setData]=useState([]);
  const [runId,setRunId]=useState('');

  const idKeys = ['bike_uuid','uuid','bike_id','id'];
  const nameKeys = ['name','nome','titulo'];

  useEffect(()=>{
    const load = async()=>{
      try{
        const res = await api.get('/v1/bike/my-bikes');
        const items = res.data?.data || res.data || [];
        setBikes(Array.isArray(items)? items : []);
      }catch(e){}
      setLoading(false);
    };
    load();
  },[]);

  const getKey=(obj,keys)=> keys.find(k=>obj && Object.prototype.hasOwnProperty.call(obj,k));

  const fetchBikeStats = async(bike)=>{
    const idKey = getKey(bike, idKeys);
    const bikeId = bike[idKey];
    if(!bikeId) return;
    setLoading(true);

    try{
      const res = await api.get(`/v1/estatisticas/bike/${String(bikeId)}`);
      const body = res.data?.data || res.data || {};
      const series = body.series || body.data || body.stats || [];

      if(Array.isArray(series) && series.length){
        setLabels(series.map((s,i)=>s.label || `P${i+1}`));
        setData(
          series.map(s =>
            typeof s.value === 'number'
              ? s.value
              : (Number(s.value) || 0)
          )
        );
      }else if(Array.isArray(res.data)){
        setLabels(res.data.map((_,i)=>String(i+1)));
        setData(res.data.map(x=>Number(x)||0));
      }else{
        setLabels(Object.keys(body).slice(0,10));
        setData(Object.values(body).slice(0,10).map(x=>Number(x)||0));
      }
    }catch(e){}
    
    setLoading(false);
  };

  const fetchRunStats = async()=>{
    if(!runId) return;
    setLoading(true);
    try{
      const res = await api.get(`/v1/estatisticas/run/${String(runId)}`);
      const body = res.data?.data || res.data || {};
      const series = body.series || body.data || body.stats || [];

      if(Array.isArray(series) && series.length){
        setLabels(series.map((s,i)=>s.label || `P${i+1}`));
        setData(
          series.map(s =>
            typeof s.value === 'number'
              ? s.value
              : (Number(s.value) || 0)
          )
        );
      }else{
        setLabels(Object.keys(body).slice(0,10));
        setData(Object.values(body).slice(0,10).map(x=>Number(x)||0));
      }
    }catch(e){}

    setLoading(false);
  };

  if(loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator size="large"/></View>;

  const screenWidth = Dimensions.get('window').width;

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.title}>Estatísticas</Text>

      <Text style={{alignSelf:'flex-start',marginLeft:10,marginTop:10}}>Minhas bikes:</Text>

      {bikes.map((b,idx)=>{
        const idKey = idKeys.find(k=>Object.prototype.hasOwnProperty.call(b,k));
        const nameKey = nameKeys.find(k=>Object.prototype.hasOwnProperty.call(b,k));
        const label = (nameKey? b[nameKey]: null) || (idKey? b[idKey]: `Bike ${idx+1}`);

        return (
          <TouchableOpacity key={idx} onPress={()=>fetchBikeStats(b)} style={{padding:10,alignSelf:'stretch',borderBottomWidth:1,borderColor:'#eee'}}>
            <Text>{label}</Text>
          </TouchableOpacity>
        );
      })}

      <View style={{width:'100%',alignItems:'center',marginTop:10}}>
        <TextInput placeholder="Buscar run por ID" value={runId} onChangeText={setRunId} style={s.input}/>
        <TouchableOpacity style={s.btn} onPress={fetchRunStats}><Text style={s.btnText}>Buscar run</Text></TouchableOpacity>
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

const s=StyleSheet.create({
  container:{flexGrow:1,alignItems:'center',padding:10,backgroundColor:'#fff'},
  title:{fontSize:22,color:'#b30000',marginBottom:10},
  input:{borderWidth:1,borderColor:'#ddd',padding:10,borderRadius:8,marginTop:6,alignSelf:'stretch',width:'90%'},
  btn:{backgroundColor:'#b30000',padding:10,borderRadius:8,alignItems:'center',width:'60%',marginTop:8},
  btnText:{color:'#fff',fontWeight:'700'}
});
