import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL;

const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('[SOCKET] Connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('[SOCKET] Disconnected');
});

export default socket;