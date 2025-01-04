import { io } from 'socket.io-client';

const BASE_URL = 'http://localhost:7777'; // URL của Socket.IO server

// Hàm tạo instance
const createSocketInstance = (namespace = '/') => {
  const socket = io(`${BASE_URL}${namespace}`, {
    transports: ['websocket'], // Ép buộc sử dụng WebSocket
  });

  // socket.on('connect', () => {
  //   console.log(`Connected to namespace ${namespace}`);
  // });

  // socket.on('disconnect', () => {
  //   console.log(`Disconnected from namespace ${namespace}`);
  // });

  return socket;
};

export default createSocketInstance;
