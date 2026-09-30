import { authenticateSocket } from '../shared/auth.js';

export function configureSockets(io) {
  io.use(authenticateSocket);
  io.on('connection', (socket) => {
    console.info(`Cliente Socket.io conectado: ${socket.id} (${socket.user.role})`);

    socket.on('disconnect', (reason) => {
      console.info(`Cliente Socket.io desconectado: ${socket.id} (${reason})`);
    });
  });
}
