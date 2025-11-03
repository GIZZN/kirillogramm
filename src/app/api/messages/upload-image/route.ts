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

    const formData = await request.formData();
    const chatId = formData.get('chatId') as string;
    const imageFile = formData.get('image') as File;

    if (!chatId || !imageFile) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля' },
        { status: 400 }
      );
    }

    // Проверяем тип файла
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Файл должен быть изображением' },
        { status: 400 }
      );
    }

    // Проверяем размер файла (максимум 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Размер файла не должен превышать 5MB' },
        { status: 400 }
      );
    }

    // Проверяем, что пользователь участник чата
    const participantCheck = await query(`
      SELECT 1 FROM chat_participants 
      WHERE chat_id = $1 AND user_id = $2
    `, [parseInt(chatId), user.id]);

    if (participantCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Вы не являетесь участником этого чата' },
        { status: 403 }
      );
    }

    // Конвертируем изображение в base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const imageDataUrl = `data:${imageFile.type};base64,${base64Image}`;

    // Создаем таблицы если не существуют
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
        image_data TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Добавляем столбец image_data если его нет
    await query(`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS image_data TEXT
    `);

    // Добавляем сообщение с изображением в базу данных
    const messageResult = await query(`
      INSERT INTO messages (chat_id, sender_id, content, message_type, image_data)
      VALUES ($1, $2, $3, 'image', $4)
      RETURNING id, content, message_type, created_at
    `, [parseInt(chatId), user.id, `Отправил изображение: ${imageFile.name}`, imageDataUrl]);

    const message = messageResult.rows[0] as {
      id: number;
      content: string;
      message_type: string;
      created_at: string;
    };

    // Обновляем время последней активности чата
    await query(`
      UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = $1
    `, [parseInt(chatId)]);

    // Получаем информацию о пользователе
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
    `, [parseInt(chatId)]);

    const participants = participantsResult.rows.map(row => (row as { user_id: number }).user_id);

    // Формируем данные сообщения для отправки
    const messageData = {
      id: message.id,
      chatId: parseInt(chatId),
      senderId: user.id,
      senderName: userName,
      senderAvatar: userAvatar,
      content: message.content,
      messageType: 'image',
      imageData: imageDataUrl,
      createdAt: message.created_at,
      isRead: false
    };

    // Отправляем real-time уведомления через SSE
    broadcastToChat(participants, {
      type: 'new_message',
      message: messageData
    }, user.id); // Исключаем отправителя

    return NextResponse.json({
      message: 'Изображение отправлено',
      data: messageData
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
