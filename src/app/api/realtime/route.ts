import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Хранилище активных SSE соединений
const connections = new Map<number, ReadableStreamDefaultController>();

export async function GET(request: NextRequest) {
  // Проверяем авторизацию
  const token = request.cookies.get('auth-token')?.value || '';
  const user = verifyToken(token);
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Создаем ReadableStream для SSE
  const stream = new ReadableStream({
    async start(controller) {
      // Сохраняем соединение
      connections.set(user.id, controller);
      
      // Отправляем приветственное сообщение
      controller.enqueue(`data: ${JSON.stringify({
        type: 'connected',
        message: 'SSE connection established'
      })}\n\n`);

      // Пинг каждые 30 секунд для поддержания соединения
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({
            type: 'ping'
          })}\n\n`);
        } catch {
          clearInterval(pingInterval);
        }
      }, 30000);

      // Инициализируем значение последнего сообщения и прочтений, чтобы не отправлять историю
      let lastMessageId = 0;
      let lastReadId = 0;

      try {
        const lastMessageResult = await query(`SELECT COALESCE(MAX(id), 0) AS max_id FROM messages`);
        lastMessageId = Number((lastMessageResult.rows[0] as { max_id: number }).max_id ?? 0);
      } catch (error) {
        console.error('Error initializing lastMessageId for SSE:', error);
      }

      try {
        const lastReadResult = await query(`SELECT COALESCE(MAX(id), 0) AS max_id FROM message_reads`);
        lastReadId = Number((lastReadResult.rows[0] as { max_id: number }).max_id ?? 0);
      } catch (error) {
        console.error('Error initializing lastReadId for SSE:', error);
      }

      let pollingMessages = false;
      let pollingReads = false;

      const pollMessages = async () => {
        if (pollingMessages) return;
        pollingMessages = true;
        try {
          const result = await query(`
            SELECT m.id, m.chat_id, m.sender_id, m.content, m.message_type, m.image_data,
                   m.created_at, u.name AS sender_name, up.avatar_data AS sender_avatar
            FROM messages m
            JOIN chat_participants cp ON cp.chat_id = m.chat_id AND cp.user_id = $1
            JOIN users u ON u.id = m.sender_id
            LEFT JOIN user_profiles up ON up.user_id = u.id
            WHERE m.id > $2
            ORDER BY m.id ASC
          `, [user.id, lastMessageId]);

          const rows = result.rows as Array<{
            id: number;
            chat_id: number;
            sender_id: number;
            content: string;
            message_type: string;
            image_data?: string | null;
            created_at: string;
            sender_name: string;
            sender_avatar?: string | null;
          }>;

          if (rows.length > 0) {
            lastMessageId = rows[rows.length - 1].id;
            for (const row of rows) {
              // Избегаем дублирования сообщений для отправителя — у него уже локальная копия
              if (row.sender_id === user.id) {
                continue;
              }

              const messagePayload = {
                id: row.id,
                chatId: row.chat_id,
                senderId: row.sender_id,
                senderName: row.sender_name,
                senderAvatar: row.sender_avatar ?? undefined,
                content: row.content,
                messageType: row.message_type === 'image' ? 'image' : 'text',
                imageData: row.image_data ?? undefined,
                createdAt: row.created_at,
                isRead: false
              };

              controller.enqueue(`data: ${JSON.stringify({
                type: 'new_message',
                message: messagePayload
              })}\n\n`);
            }
          }
        } catch (error) {
          console.error('Error polling new messages for SSE:', error);
        } finally {
          pollingMessages = false;
        }
      };

      const pollReads = async () => {
        if (pollingReads) return;
        pollingReads = true;
        try {
          const result = await query(`
            SELECT mr.id, mr.message_id, mr.user_id
            FROM message_reads mr
            JOIN messages m ON m.id = mr.message_id
            WHERE m.sender_id = $1 AND mr.id > $2
            ORDER BY mr.id ASC
          `, [user.id, lastReadId]);

          const rows = result.rows as Array<{ id: number; message_id: number; user_id: number }>;

          if (rows.length > 0) {
            lastReadId = rows[rows.length - 1].id;
            for (const row of rows) {
              controller.enqueue(`data: ${JSON.stringify({
                type: 'message_read',
                messageId: row.message_id
              })}\n\n`);
            }
          }
        } catch (error) {
          console.error('Error polling message reads for SSE:', error);
        } finally {
          pollingReads = false;
        }
      };

      // Запускаем циклический опрос базы
      const messagesInterval = setInterval(pollMessages, 1500);
      const readsInterval = setInterval(pollReads, 2500);

      // Делаем начальный опрос с небольшой задержкой, чтобы успеть инициализировать max id
      setTimeout(pollMessages, 400);
      setTimeout(pollReads, 800);

      // Очистка при закрытии соединения
      request.signal.addEventListener('abort', () => {
        connections.delete(user.id);
        clearInterval(pingInterval);
        clearInterval(messagesInterval);
        clearInterval(readsInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Функция для отправки сообщения конкретному пользователю
export function sendToUser(userId: number, data: Record<string, unknown>) {
  const controller = connections.get(userId);
  if (controller) {
    try {
      controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      return true;
    } catch {
      // Соединение закрыто, удаляем из списка
      connections.delete(userId);
      return false;
    }
  }
  return false;
}

// Функция для отправки сообщения всем участникам чата
export function broadcastToChat(chatParticipants: number[], data: Record<string, unknown>, excludeUserId?: number) {
  for (const participantId of chatParticipants) {
    if (excludeUserId && participantId === excludeUserId) {
      continue;
    }
    sendToUser(participantId, data);
  }
}

// Получение активных соединений для диагностики
export function getActiveConnections() {
  return Array.from(connections.keys());
}
