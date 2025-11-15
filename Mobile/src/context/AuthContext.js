import { createContext, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    setToken(null); // <-- VOLTA PARA A TELA DE LOGIN AUTOMATICAMENTE
  };

  return (
    <AuthContext.Provider value={{ token, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
