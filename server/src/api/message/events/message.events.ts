// import { ChatService } from '../chat.service';
// import { CreateMessageDto } from '../dto/create-message.dto';
// import { Server, Socket } from 'socket.io';

// export async function handleMessage(
//   server: Server,
//   client: Socket,
//   messageDto: CreateMessageDto,
//   chatService: ChatService,
// ): Promise<void> {
//   const message = await chatService.saveMessage(messageDto); // Lưu tin nhắn
//   server.emit('receiveMessage', message); // Phát lại tin nhắn tới tất cả client
// }
