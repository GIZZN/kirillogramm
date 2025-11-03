import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const chatId = parseInt(resolvedParams.id);

    if (isNaN(chatId)) {
      return NextResponse.json(
        { error: 'Неверный ID чата' },
        { status: 400 }
      );
    }

    // Проверяем авторизацию
    const user = verifyToken(request.cookies.get('auth-token')?.value || '');
    if (!user) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
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

    // Получаем сообщения чата
    const messagesResult = await query(`
      SELECT 
        m.id,
        m.chat_id,
        m.sender_id,
        m.content,
        m.message_type,
        m.image_data,
        m.created_at,
        u.name as sender_name,
        up.avatar_data as sender_avatar,
        CASE WHEN mr.id IS NOT NULL THEN true ELSE false END as is_read
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = $2
      WHERE m.chat_id = $1
      ORDER BY m.created_at ASC
    `, [chatId, user.id]);

    const messages = messagesResult.rows.map(row => {
      const messageRow = row as {
        id: number;
        chat_id: number;
        sender_id: number;
        sender_name: string;
        sender_avatar?: string;
        content: string;
        message_type: string;
        image_data?: string;
        created_at: string;
        is_read: boolean;
      };
      
      return {
        id: messageRow.id,
        chatId: messageRow.chat_id,
        senderId: messageRow.sender_id,
        senderName: messageRow.sender_name,
        senderAvatar: messageRow.sender_avatar,
        content: messageRow.content,
        messageType: messageRow.message_type,
        imageData: messageRow.image_data,
        createdAt: messageRow.created_at,
        isRead: messageRow.is_read
      };
    });

    return NextResponse.json({ messages });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
