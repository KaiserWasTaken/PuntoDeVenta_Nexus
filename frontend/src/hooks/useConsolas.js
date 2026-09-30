import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAccessToken, getActiveSessions, getConsoles } from '../services/api.js';
import { socket } from '../services/socket.js';

function mergeConsoleState(consoles, sessions) {
  const sessionsByConsole = new Map(
    sessions.map((session) => [session.consola_id, session])
  );

  return consoles.map((consoleRecord) => ({
    ...consoleRecord,
    session: sessionsByConsole.get(consoleRecord.id) || null
  }));
}

export function useConsolas() {
  const [consoles, setConsoles] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expiredSessionId, setExpiredSessionId] = useState(null);
  const [connected, setConnected] = useState(socket.connected);
  const token = getAccessToken();

  const refresh = useCallback(async () => {
    setError('');
    try {
      const [consoleData, sessionData] = await Promise.all([
        getConsoles(),
        getActiveSessions()
      ]);
      setConsoles(consoleData);
      setSessions(sessionData);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Inicia sesión para acceder al monitor.');
      return undefined;
    }
    refresh();
    socket.auth = { token };
    socket.connect();

    const handleConsoleUpdate = (updatedConsole) => {
      setConsoles((current) => current.map((item) => (
        item.id === updatedConsole.id ? { ...item, ...updatedConsole } : item
      )));
    };
    const handleSessionUpdate = (updatedSession) => {
      setSessions((current) => {
        const rest = current.filter((item) => item.id !== updatedSession.id);
        return ['ACTIVA', 'PAUSADA'].includes(updatedSession.estado)
          ? [...rest, updatedSession]
          : rest;
      });
      setConsoles((current) => current.map((item) => (
        item.id === updatedSession.consola_id
          ? { ...item, status: updatedSession.consola_estado, session: updatedSession }
          : item
      )));
    };
    const handleExpired = ({ id }) => setExpiredSessionId(id);
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('consola:actualizada', handleConsoleUpdate);
    socket.on('sesion:actualizada', handleSessionUpdate);
    socket.on('sesion:tiempo_agotado', handleExpired);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('consola:actualizada', handleConsoleUpdate);
      socket.off('sesion:actualizada', handleSessionUpdate);
      socket.off('sesion:tiempo_agotado', handleExpired);
      socket.disconnect();
    };
  }, [refresh, token]);

  const consoleView = useMemo(
    () => mergeConsoleState(consoles, sessions),
    [consoles, sessions]
  );

  return {
    consoles: consoleView,
    loading,
    error,
    connected,
    expiredSessionId,
    dismissExpired: () => setExpiredSessionId(null),
    refresh
  };
}
