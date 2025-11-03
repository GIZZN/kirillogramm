import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(
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

    // Получаем все непрочитанные сообщения в чате (не от текущего пользователя)
    const unreadMessagesResult = await query(`
      SELECT m.id
      FROM messages m
      LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = $2
      WHERE m.chat_id = $1 AND m.sender_id != $2 AND mr.id IS NULL
    `, [chatId, user.id]);

    // Отмечаем все непрочитанные сообщения как прочитанные
    if (unreadMessagesResult.rows.length > 0) {
      const messageIds = unreadMessagesResult.rows.map(row => (row as { id: number }).id);
      
      // Создаем записи о прочтении для каждого сообщения
      const values = messageIds.map((_, index) => 
        `($${index * 2 + 1}, $${index * 2 + 2})`
      ).join(', ');
      
      const params = messageIds.flatMap(id => [id, user.id]);
      
      await query(`
        INSERT INTO message_reads (message_id, user_id)
        VALUES ${values}
        ON CONFLICT (message_id, user_id) DO NOTHING
      `, params);
    }

    return NextResponse.json({
      message: 'Сообщения отмечены как прочитанные',
      readCount: unreadMessagesResult.rows.length
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
