import { IoAdapter } from '@nestjs/platform-socket.io';
import { WsGuard } from './guards/ws.guard';
import { AuthService } from './api/auth/auth.service';

export class WsAdapter extends IoAdapter {
  constructor(private readonly authService: AuthService) {
    super();
  }

  createIOServer(port: number, options?: any) {
    const server = super.createIOServer(port, options);

    // Tạo middleware để xác thực token cho WebSocket
    server.use((socket, next) => {
      const token = socket.handshake.auth.token;
      console.log(token);
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Xác thực token và thêm thông tin người dùng vào socket
      const user = this.authService.verifyAccessToken(token);
      if (!user) {
        console.log('lỗi');
        
        return next(new Error('Authentication error'));
      }

      socket.user = user;  // Thêm user vào socket

      next();
    });

    return server;
  }
}
