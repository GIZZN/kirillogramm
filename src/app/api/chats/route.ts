import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const user = verifyToken(request.cookies.get('auth-token')?.value || '');
    if (!user) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
      );
    }

    // Создаем таблицы если они не существуют
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

    await query(`
      CREATE TABLE IF NOT EXISTS message_reads (
        id SERIAL PRIMARY KEY,
        message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(message_id, user_id)
      )
    `);

    // Получаем чаты пользователя с последними сообщениями
    const chatsResult = await query(`
      SELECT DISTINCT
        c.id,
        c.name,
        c.type,
        c.updated_at,
        COALESCE(last_msg.content, 'Нет сообщений') as last_message,
        COALESCE(last_msg.created_at, c.created_at) as last_message_time,
        COALESCE(unread_count.count, 0) as unread_count,
        other_user.id as user_id,
        COALESCE(other_user.name, 'Неизвестный пользователь') as other_user_name,
        other_user_profile.avatar_data as other_user_avatar,
        false as is_online
      FROM chats c
      JOIN chat_participants cp ON c.id = cp.chat_id
      LEFT JOIN chat_participants cp_other ON c.id = cp_other.chat_id AND cp_other.user_id != $1
      LEFT JOIN users other_user ON cp_other.user_id = other_user.id
      LEFT JOIN user_profiles other_user_profile ON other_user.id = other_user_profile.user_id
      LEFT JOIN (
        SELECT DISTINCT ON (chat_id) 
          chat_id, content, created_at, sender_id
        FROM messages 
        ORDER BY chat_id, created_at DESC
      ) last_msg ON c.id = last_msg.chat_id
      LEFT JOIN (
        SELECT 
          m.chat_id,
          COUNT(*) as count
        FROM messages m
        LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = $1
        WHERE mr.id IS NULL AND m.sender_id != $1
        GROUP BY m.chat_id
      ) unread_count ON c.id = unread_count.chat_id
      WHERE cp.user_id = $1
      ORDER BY COALESCE(last_msg.created_at, c.created_at) DESC
    `, [user.id]);

    // Форматируем результат
    const chats = chatsResult.rows.map(row => {
      const chatRow = row as {
        id: number;
        name: string;
        type: string;
        last_message: string;
        last_message_time: string;
        unread_count: string;
        is_online: boolean;
        user_id: number;
        other_user_name: string;
        other_user_avatar?: string;
      };

      return {
        id: chatRow.id,
        name: chatRow.type === 'private' ? chatRow.other_user_name : chatRow.name,
        lastMessage: chatRow.last_message,
        lastMessageTime: chatRow.last_message_time,
        unreadCount: parseInt(chatRow.unread_count),
        isOnline: chatRow.is_online,
        userId: chatRow.user_id || 0,
        avatar: chatRow.other_user_avatar
      };
    });

    return NextResponse.json({ chats });

  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

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

    const { participantId, name } = await request.json();

    if (!participantId) {
      return NextResponse.json(
        { error: 'ID участника обязателен' },
        { status: 400 }
      );
    }

    // Проверяем, существует ли уже чат между этими пользователями
    const existingChatResult = await query(`
      SELECT c.id 
      FROM chats c
      JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = $1
      JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = $2
      WHERE c.type = 'private'
      LIMIT 1
    `, [user.id, participantId]);

    if (existingChatResult.rows.length > 0) {
      return NextResponse.json({
        message: 'Чат уже существует',
        chatId: (existingChatResult.rows[0] as { id: number }).id
      });
    }

    // Создаем новый чат
    const chatResult = await query(`
      INSERT INTO chats (name, type)
      VALUES ($1, 'private')
      RETURNING id
    `, [name || 'Приватный чат']);

    const chatId = (chatResult.rows[0] as { id: number }).id;

    // Добавляем участников
    await query(`
      INSERT INTO chat_participants (chat_id, user_id)
      VALUES ($1, $2), ($1, $3)
    `, [chatId, user.id, participantId]);

    return NextResponse.json({
      message: 'Чат создан успешно',
      chatId: chatId
    });

  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
