import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Ajuste para o IP do seu PC na rede (Hudson disse: 192.168.0.4)
export const BASE_URL = 'http://192.168.0.4:3000';
const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });
api.interceptors.request.use(async (cfg)=>{
  const token = await AsyncStorage.getItem('token');
  if(token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
export default api;
