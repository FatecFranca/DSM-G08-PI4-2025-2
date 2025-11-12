# PI Mobile — Node 20 + Expo 51 pronto

## Como rodar
1. Garanta que sua API está rodando em `http://192.168.0.4:3000` (ajuste em `src/api/api.js` se precisar).
2. Dentro desta pasta, rode:
   ```bash
   npm install
   npx expo start
   ```
3. Abra no celular com o app Expo Go (mesmo Wi‑Fi do PC).

## Sobre
- Sem `bottom-tabs` e sem `reanimated` (evita conflitos).
- Navegação com `@react-navigation/native-stack`.
- Telas: Login, Cadastro, Home, Estatísticas (gráfico).
- Proteção por token (AsyncStorage + Authorization: Bearer).
