import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = "http://192.168.0.5:3000";

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
