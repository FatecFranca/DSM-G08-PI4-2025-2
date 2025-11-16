import axios from 'axios';
import { URL_API } from './variaveis';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = URL_API;
console.log(URL_API);

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000
});

api.interceptors.request.use(async (cfg) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  } catch (e) {}
  return cfg;
});

export default api;
