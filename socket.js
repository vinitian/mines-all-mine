import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
    autoConnect: true,  // Set to true to auto-connect
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
});

export default socket;