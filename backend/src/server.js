import http from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { createApp } from './app.js';
import { checkDatabaseConnection, pool } from './config/database.js';
import { env } from './config/env.js';
import { configureSockets } from './sockets/index.js';
import { startExpirationMonitor } from './modules/sessions/session.expiration-monitor.js';

const app = createApp();
const httpServer = http.createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: env.corsOrigins,
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true
  }
});

app.set('io', io);
configureSockets(io);
const stopExpirationMonitor = startExpirationMonitor(io);

async function start() {
  await checkDatabaseConnection();

  await new Promise((resolve, reject) => {
    const handleError = (error) => {
      httpServer.off('listening', handleListening);
      reject(error);
    };
    const handleListening = () => {
      httpServer.off('error', handleError);
      resolve();
    };

    httpServer.once('error', handleError);
    httpServer.once('listening', handleListening);
    httpServer.listen(env.PORT, '0.0.0.0');
  });

  console.info(`Servidor escuchando en http://localhost:${env.PORT}`);
}

function formatStartupError(error) {
  if (error?.code === 'EADDRINUSE') {
    return `El puerto ${env.PORT} ya está en uso. Detén el proceso que lo ocupa o cambia PORT en backend/.env.`;
  }
  if (error?.code === 'ECONNREFUSED' || error?.code === '28P01') {
    return 'No se pudo conectar a PostgreSQL. Verifica que el servicio esté iniciado y que DB_HOST, DB_PORT, DB_NAME, DB_USER y DB_PASSWORD sean correctos.';
  }
  return error?.message || 'Error desconocido al iniciar el servidor.';
}

function closeAfterStartupError() {
  return pool.end().catch((closeError) => {
    console.error('No se pudo cerrar el pool PostgreSQL:', closeError.message);
  });
}

async function shutdown(signal) {
  console.info(`Recibida señal ${signal}. Cerrando servidor...`);
  stopExpirationMonitor();
  io.close();
  httpServer.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

start().catch(async (error) => {
  console.error('No se pudo iniciar el servidor:', formatStartupError(error));
  await closeAfterStartupError();
  process.exit(1);
});
