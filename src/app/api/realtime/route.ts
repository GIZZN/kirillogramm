import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

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
    start(controller) {
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

      // Очистка при закрытии соединения
      request.signal.addEventListener('abort', () => {
        connections.delete(user.id);
        clearInterval(pingInterval);
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
