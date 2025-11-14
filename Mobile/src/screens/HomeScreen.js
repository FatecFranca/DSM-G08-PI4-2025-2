import React, {useEffect, useState} from 'react';
import {View,Text,TouchableOpacity,StyleSheet,ActivityIndicator} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';
export default function HomeScreen({navigation}){
  const [loading,setLoading]=useState(true);
  const [profile,setProfile]=useState(null);
  useEffect(()=>{
    const load = async()=>{
      try{
        const res = await api.get('/v1/auth/profile');
        setProfile(res.data?.data || res.data || null);
      }catch(e){}
      setLoading(false);
    };
    load();
  },[]);
  const logout=async()=>{
    await AsyncStorage.removeItem('token');
    navigation.reset({index:0,routes:[{name:'Login'}]});
  };
  if(loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator size="large"/></View>;
  return (
    <View style={s.container}>
      <Text style={s.title}>Bem-vindo{profile?.name? ' ' + profile.name : ''}</Text>
      <TouchableOpacity style={s.btn} onPress={()=>navigation.navigate('Stats')}><Text style={s.btnText}>Estatísticas</Text></TouchableOpacity>
      <TouchableOpacity style={[s.btn,{backgroundColor:'#777'}]} onPress={logout}><Text style={s.btnText}>Sair</Text></TouchableOpacity>
    </View>
  );
}
const s=StyleSheet.create({
  container:{flex:1,justifyContent:'center',alignItems:'center',padding:20,backgroundColor:'#fff'},
  title:{fontSize:28,marginBottom:20,color:'#b30000'},
  btn:{backgroundColor:'#b30000',padding:12,borderRadius:8,alignItems:'center',width:'70%',marginBottom:10},
  btnText:{color:'#fff',fontWeight:'700'}
});
