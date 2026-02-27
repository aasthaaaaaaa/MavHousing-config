import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export type Message = {
  id: string;
  roomId: string;
  senderId: number;
  content: string;
  createdAt: string;
  sender: {
    fName: string;
    lName: string;
    email: string;
  };
  readReceipts: {
    userId: number;
    user: {
      fName: string;
      lName: string;
    };
  }[];
};

export const useChat = (
  leaseId: number | undefined,
  userId: number | undefined,
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!leaseId || !userId) return;

    const socket = io('http://localhost:3009', {
      query: { userId: userId.toString() },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('joinLeaseChat', { leaseId, userId });
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('chatHistory', (history: Message[]) => {
      setMessages(history);
    });

    socket.on('newMessage', (message: Message) => {
      setMessages((prev) => [...prev, message]);

      // If we are not the sender, mark as read
      if (message.senderId !== userId) {
        socket.emit('markRead', { messageId: message.id, userId, leaseId });
      }
    });

    socket.on('readReceipt', ({ messageId, userId: readerId, user }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                readReceipts: [
                  ...msg.readReceipts.filter((r) => r.userId !== readerId),
                  { userId: readerId, user },
                ],
              }
            : msg,
        ),
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [leaseId, userId]);

  const sendMessage = useCallback(
    (content: string) => {
      if (socketRef.current && leaseId && userId) {
        socketRef.current.emit('sendMessage', {
          leaseId,
          senderId: userId,
          content,
        });
      }
    },
    [leaseId, userId],
  );

  return { messages, isConnected, sendMessage };
};
