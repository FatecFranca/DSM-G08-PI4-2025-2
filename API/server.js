import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { Server as IOServer } from 'socket.io';

dotenv.config();
const PORT = process.env.PORT || 8080;

const server = http.createServer(app);
export const io = new IOServer(server, {
    cors: { origin: '*' } // API pública -> liberar; ou coloque domínios específicos em produção
});

io.on('connection', (socket) => {
    console.log('client connected', socket.id);
    socket.on('join_bike', (bike_uuid) => {
        socket.join(bike_uuid);
        console.log(`${socket.id} joined ${bike_uuid}`);
    });
    socket.on('disconnect', () => console.log('client disconnected', socket.id));
});

server.listen(PORT, () => console.log(`API + Socket.IO rodando na porta ${PORT}`));
