import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import cors from 'cors';
import { Server as IOServer } from 'socket.io';

// carregar variáveis antes de tudo
dotenv.config();

const PORT = process.env.PORT || 3000;
const IP = process.env.IP || '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

// ======================
// 🔥 CORS CONFIGURADO 🔥
// ======================
if (isProduction) {
    app.use(cors({
        origin: ['https://seu-dominio.com'],
        credentials: true
    }));
} else {
    app.use(cors({
        origin: (origin, cb) => cb(null, true),
        credentials: true
    }));
}

const server = http.createServer(app);

// ===========================
// 📡 STATUS GLOBAL DO IOT
// ===========================
global.iotOnline = false;

// ==============================
// 🔥 SOCKET.IO CONFIGURADO 🔥
// ==============================
export const io = new IOServer(server, {
    cors: { origin: "*" }
});

io.on('connection', (socket) => {
    console.log('client connected', socket.id);

    // mantém lógica atual de salas (não removi nada)
    socket.on('join_bike', (bike_uuid) => {
        socket.join(bike_uuid);
        console.log(`${socket.id} joined ${bike_uuid}`);
    });

    // ================================
    // 📌 EVENTOS DO IOT (ADICIONADOS)
    // ================================

    socket.on('iot_connected', () => {
        global.iotOnline = true;
        io.emit('iot_status', { online: true });
        console.log('📡 IoT CONECTADO');
    });

    socket.on('iot_disconnected', () => {
        global.iotOnline = false;
        io.emit('iot_status', { online: false });
        console.log('📡 IoT DESCONECTADO');
    });

    socket.on('speed_update', (value) => {
        io.emit('speed_update', value);
    });

    socket.on('disconnect', () => {
        console.log('client disconnected', socket.id);
    });
});

// =========================================
// 🔥 INICIAR SERVIDOR COM LOG BONITO 🔥
// =========================================
server.listen(PORT, IP, () => {
    console.log(`=================================`);
    console.log(`🚴 BIKE IOT API - CONFIGURAÇÃO OK`);
    console.log(`=================================`);
    console.log(`📍 Host: ${IP}`);
    console.log(`🎯 Porta: ${PORT}`);
    console.log(`🌐 URL da Rede: http://${IP}:${PORT}`);
    console.log(`🏠 URL Local: http://localhost:${PORT}`);
    console.log(`📡 ESP32 deve usar: http://${IP}:${PORT}/v1/readings`);
    console.log(`🔧 Ambiente: ${process.env.NODE_ENV}`);
    console.log(`=================================`);
});
