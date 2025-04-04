import { io, Socket } from "socket.io-client";
import { SOCKET_UR } from "~/utils/enviroment";

// Danh sách socket theo namespace
const sockets: Record<string, Socket> = {}; 

export const connectSocket = (namespace: string, accesstoken: string): Socket => {  
  if (!sockets[namespace]) {   
    sockets[namespace] = io(`${SOCKET_UR}${namespace}`, {
      transports: ["websocket"],
      auth: {
        token: `Bearer ${accesstoken ?? ""}`,
      },
      
    });

    sockets[namespace].on("connect", () => {
      console.log(`✅ Connected to namespace: ${namespace} at ${new Date().toISOString()}`);
    });

    sockets[namespace].on("disconnect", () => {
      console.log(`❌ Disconnected from namespace: ${namespace}`);
    });
  }

  return sockets[namespace];
};

export const disconnectSocket = (namespace: string): void => {
  if (sockets[namespace]) {
    sockets[namespace].removeAllListeners(); 
    sockets[namespace].disconnect();
    delete sockets[namespace];    
  }
};

export const clearSocker = (namespace: string): void => {
  if (sockets[namespace]) {
    sockets[namespace].removeAllListeners(); 
  }
}

export const emitEvent = (namespace: string, event: string, data: any): void => {
  if (sockets[namespace]?.connected) {
    sockets[namespace].emit(event, data);
  }
};

export const onEvent = (namespace: string, event: string, callback: (data: any) => void): void => {
  if (sockets[namespace]?.connected) { 
    sockets[namespace].on(event, callback);
  }
};

export const offEvent = (namespace: string, event: string): void => {
  if (sockets[namespace]) {
    sockets[namespace].off(event);
  }
};

export const isSocketConnected = (namespace: string): boolean => {
  return sockets[namespace]?.connected ?? false;
};
