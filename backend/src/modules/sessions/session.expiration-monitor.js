import * as repository from './session.repository.js';

export function startExpirationMonitor(io, intervalMs = 5_000) {
  const interval = setInterval(async () => {
    try {
      const expiredSessions = await repository.findExpiringFixed();
      for (const session of expiredSessions) {
        io.emit('sesion:tiempo_agotado', session);
      }
    } catch (error) {
      console.error('Error verificando sesiones expiradas:', error);
    }
  }, intervalMs);

  interval.unref();
  return () => clearInterval(interval);
}
