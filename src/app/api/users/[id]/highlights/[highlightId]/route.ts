import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Получить конкретный highlight другого пользователя с медиа данными
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; highlightId: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.id);
    const highlightId = parseInt(resolvedParams.highlightId);

    if (isNaN(userId) || isNaN(highlightId)) {
      return NextResponse.json(
        { error: 'Неверные параметры' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
      );
    }

    // Получаем highlight с полными медиа данными
    const result = await query(`
      SELECT 
        h.id, h.title, h.thumbnail_data, h.video_data, h.media_type, h.duration, 
        h.created_at, h.updated_at, u.name as author_name
      FROM user_highlights h
      JOIN users u ON h.user_id = u.id
      WHERE h.id = $1 AND h.user_id = $2
    `, [highlightId, userId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Highlight не найден' },
        { status: 404 }
      );
    }

    const highlight = result.rows[0];

    return NextResponse.json({
      highlight
    });

  } catch (error) {
    console.error('Error fetching user highlight:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
