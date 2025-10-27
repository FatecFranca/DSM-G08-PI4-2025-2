import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { Server as IOServer } from 'socket.io';

dotenv.config();
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
export const io = new IOServer(server, {
    cors: { origin: '*' }
});

io.on('connection', (socket) => {
    console.log('client connected', socket.id);
    socket.on('join_bike', (bike_uuid) => {
        socket.join(bike_uuid);
        console.log(`${socket.id} joined ${bike_uuid}`);
    });
    socket.on('disconnect', () => console.log('client disconnected', socket.id));
});

// ⚠️ LINHA CORRIGIDA - escutar no IP específico
server.listen(PORT, '192.168.24.13', () => {
  console.log(`=================================`);
  console.log(`🚴 BIKE IOT API - CONFIGURAÇÃO CORRIGIDA`);
  console.log(`=================================`);
  console.log(`📍 Host: 192.168.24.13`);
  console.log(`🎯 Porta: ${PORT}`);
  console.log(`🌐 URL da Rede: http://192.168.24.13:${PORT}`);
  console.log(`🏠 URL Local: http://localhost:${PORT}`);
  console.log(`📡 ESP32 deve usar: http://192.168.24.13:${PORT}/v1/readings`);
  console.log(`🔧 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`=================================`);
});