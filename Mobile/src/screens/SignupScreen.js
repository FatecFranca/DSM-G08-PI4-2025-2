import React,{useState} from 'react';
import {View,Text,TextInput,TouchableOpacity,StyleSheet,Alert} from 'react-native';
import api from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function SignupScreen({navigation}){
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const signup=async()=>{
    try{
      const res=await api.post('/v1/auth/register',{name,email,password});
      const d = res.data || {};
      const token = d.token || d.accessToken || d.jwt || (d.data? d.data.token || d.data.accessToken : null);
      if(token){
        await AsyncStorage.setItem('token',token);
        navigation.reset({index:0,routes:[{name:'Home'}]});
      }else{
        Alert.alert('Sucesso','Cadastro realizado, faça login.');
        navigation.navigate('Login');
      }
    }catch(e){
      const msg=e.response?.data?.message || e.response?.data?.error || e.message || 'Erro';
      Alert.alert('Erro',String(msg));
    }
  };
  return (
    <View style={s.container}>
      <Text style={s.title}>Cadastro</Text>
      <TextInput placeholder="Nome" value={name} onChangeText={setName} style={s.input}/>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={s.input} autoCapitalize="none"/>
      <TextInput placeholder="Senha" value={password} onChangeText={setPassword} secureTextEntry style={s.input}/>
      <TouchableOpacity style={s.btn} onPress={signup}><Text style={s.btnText}>Criar conta</Text></TouchableOpacity>
      <TouchableOpacity onPress={()=>navigation.navigate('Login')}><Text style={s.link}>Já tenho conta</Text></TouchableOpacity>
    </View>
  );
}
const s=StyleSheet.create({
  container:{flex:1,justifyContent:'center',padding:20,backgroundColor:'#fff'},
  title:{fontSize:28,marginBottom:20,color:'#b30000',textAlign:'center'},
  input:{borderWidth:1,borderColor:'#ddd',padding:10,borderRadius:8,marginBottom:12},
  btn:{backgroundColor:'#b30000',padding:12,borderRadius:8,alignItems:'center',marginBottom:10},
  btnText:{color:'#fff',fontWeight:'700'},
  link:{color:'#b30000',textAlign:'center'}
});
