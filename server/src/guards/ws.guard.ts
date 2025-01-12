import { AuthService } from '@/api/auth/auth.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsGuard implements CanActivate {
  constructor(
      private reflector: Reflector,
      private authService: AuthService,
    ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const accessToken = client.handshake?.auth?.token; // Lấy token từ handshake

    console.log('access',client.handshake);

    if (!accessToken) {
      throw new WsException('Unauthorized');
    }

    try {

      client['user'] = await this.authService.verifyAccessToken(accessToken);    
      return true;
      // Xác thực token
      // const decoded = jwt.verify(token, 'your-secret-key'); // Thay 'your-secret-key' bằng key thực tế
      // client.user = decoded; // Lưu thông tin user vào client để sử dụng sau
      // return true;
    } catch (err) {
      console.error('Invalid token:', err.message);
      throw new WsException('Unauthorized');
    }
  }
}
