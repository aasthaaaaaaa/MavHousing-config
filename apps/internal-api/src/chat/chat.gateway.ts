import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId;
    console.log(`Client connected: ${client.id}, userId: ${userId}`);
    if (userId) {
      client.join(`user_${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinLeaseChat')
  async handleJoinLeaseChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { leaseId: number; userId: number },
  ) {
    const members = await this.chatService.getLeaseMembers(data.leaseId);
    if (!members.includes(Number(data.userId))) {
      client.emit('error', { message: 'Unauthorized access to this chat.' });
      return;
    }

    const room = await this.chatService.getOrCreateRoom(data.leaseId);
    client.join(`lease_${data.leaseId}`);

    // Send chat history
    const history = await this.chatService.getChatHistory(data.leaseId);
    client.emit('chatHistory', history);

    console.log(`User ${data.userId} joined lease chat: ${data.leaseId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { leaseId: number; senderId: number; content: string },
  ) {
    const room = await this.chatService.getOrCreateRoom(data.leaseId);
    const message = await this.chatService.saveMessage(
      room.id,
      data.senderId,
      data.content,
    );

    // Broadcast to the lease room
    this.server.to(`lease_${data.leaseId}`).emit('newMessage', message);

    console.log(
      `Message sent in lease ${data.leaseId} by user ${data.senderId}`,
    );
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; userId: number; leaseId: number },
  ) {
    const receipt = await this.chatService.markAsRead(
      data.messageId,
      data.userId,
    );

    // Notify others in the room about the read receipt
    this.server.to(`lease_${data.leaseId}`).emit('readReceipt', {
      messageId: data.messageId,
      userId: data.userId,
      user: receipt.user,
      readAt: receipt.readAt,
    });
  }
}
