import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Получить конкретный highlight с медиа данными
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const resolvedParams = await params;
    const highlightId = parseInt(resolvedParams.id);

    if (isNaN(highlightId)) {
      return NextResponse.json(
        { error: 'Неверный ID highlight' },
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
        id, title, thumbnail_data, video_data, media_type, duration, 
        created_at, updated_at
      FROM user_highlights 
      WHERE id = $1 AND user_id = $2
    `, [highlightId, user.id]);

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
    console.error('Error fetching highlight:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Удалить highlight
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const resolvedParams = await params;
    const highlightId = parseInt(resolvedParams.id);

    if (isNaN(highlightId)) {
      return NextResponse.json(
        { error: 'Неверный ID highlight' },
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

    // Удаляем highlight (только свой)
    const result = await query(`
      DELETE FROM user_highlights 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [highlightId, user.id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Highlight не найден или нет прав на удаление' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Highlight удален успешно'
    });

  } catch (error) {
    console.error('Error deleting highlight:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
