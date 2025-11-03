import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { broadcastToChat } from '../../realtime/route';

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

    const { chatId, content } = await request.json();

    // Валидация
    if (!chatId || !content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Сообщение слишком длинное (максимум 1000 символов)' },
        { status: 400 }
      );
    }

    // Создаем таблицы если не существуют (для совместимости)
    await query(`
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        type VARCHAR(50) DEFAULT 'private',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS chat_participants (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(chat_id, user_id)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        message_type VARCHAR(50) DEFAULT 'text',
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Проверяем, что пользователь участник чата
    const participantCheck = await query(`
      SELECT 1 FROM chat_participants 
      WHERE chat_id = $1 AND user_id = $2
    `, [chatId, user.id]);

    if (participantCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Вы не являетесь участником этого чата' },
        { status: 403 }
      );
    }

    // Добавляем сообщение в базу данных
    const messageResult = await query(`
      INSERT INTO messages (chat_id, sender_id, content, message_type)
      VALUES ($1, $2, $3, 'text')
      RETURNING id, content, message_type, created_at
    `, [chatId, user.id, content.trim()]);

    const message = messageResult.rows[0] as {
      id: number;
      content: string;
      message_type: string;
      created_at: string;
    };

    // Обновляем время последней активности чата
    await query(`
      UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = $1
    `, [chatId]);

    // Получаем информацию о пользователе для сообщения с аватаркой
    const userResult = await query(`
      SELECT u.name, up.avatar_data
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1
    `, [user.id]);

    const userRow = userResult.rows[0] as { name: string; avatar_data?: string };
    const userName = userRow.name;
    const userAvatar = userRow.avatar_data;

    // Получаем всех участников чата
    const participantsResult = await query(`
      SELECT user_id FROM chat_participants WHERE chat_id = $1
    `, [chatId]);

    const participants = participantsResult.rows.map(row => (row as { user_id: number }).user_id);

    // Формируем данные сообщения для отправки
    const messageData = {
      id: message.id,
      chatId: parseInt(chatId),
      senderId: user.id,
      senderName: userName,
      senderAvatar: userAvatar,
      content: message.content,
      messageType: message.message_type,
      createdAt: message.created_at,
      isRead: false
    };

    // Отправляем real-time уведомления через SSE
    broadcastToChat(participants, {
      type: 'new_message',
      message: messageData
    }, user.id); // Исключаем отправителя

    return NextResponse.json({
      message: 'Сообщение отправлено',
      data: messageData
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
