import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const user = verifyToken(request.cookies.get('auth-token')?.value || '');
    if (!user) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
      );
    }

    const { chatId, content, type = 'text' } = await request.json();

    if (!chatId || !content) {
      return NextResponse.json(
        { error: 'ID чата и содержимое сообщения обязательны' },
        { status: 400 }
      );
    }

    // Проверяем, является ли пользователь участником чата
    const participantCheck = await query(`
      SELECT id FROM chat_participants 
      WHERE chat_id = $1 AND user_id = $2
    `, [chatId, user.id]);

    if (participantCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Вы не являетесь участником этого чата' },
        { status: 403 }
      );
    }

    // Создаем сообщение
    const messageResult = await query(`
      INSERT INTO messages (chat_id, sender_id, content, message_type)
      VALUES ($1, $2, $3, $4)
      RETURNING id, chat_id, sender_id, content, message_type, created_at
    `, [chatId, user.id, content, type]);

    const message = messageResult.rows[0];

    // Обновляем время последнего обновления чата
    await query(`
      UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = $1
    `, [chatId]);

    // Получаем информацию об отправителе
    const senderInfo = await query(`
      SELECT name FROM users WHERE id = $1
    `, [user.id]);

    const messageData = message as {
      id: number;
      chat_id: number;
      sender_id: number;
      content: string;
      message_type: string;
      created_at: string;
    };
    
    const responseMessage = {
      id: messageData.id,
      chatId: messageData.chat_id,
      senderId: messageData.sender_id,
      senderName: (senderInfo.rows[0] as { name: string }).name,
      content: messageData.content,
      messageType: messageData.message_type,
      createdAt: messageData.created_at,
      isRead: false
    };

    return NextResponse.json({
      message: 'Сообщение отправлено',
      data: responseMessage
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
