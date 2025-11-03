import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Получить highlights конкретного пользователя
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Неверный ID пользователя' },
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

    // Проверяем, существует ли пользователь
    const userResult = await query(`
      SELECT id, name FROM users WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Создаем таблицу highlights если не существует
    await query(`
      CREATE TABLE IF NOT EXISTS user_highlights (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        thumbnail_data TEXT,
        video_data TEXT,
        media_type VARCHAR(20) DEFAULT 'image',
        duration INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Получаем highlights пользователя (только базовую информацию для просмотра)
    const result = await query(`
      SELECT 
        id, title, thumbnail_data, media_type, duration, created_at, updated_at,
        CASE 
          WHEN video_data IS NOT NULL THEN true 
          WHEN thumbnail_data IS NOT NULL THEN true 
          ELSE false 
        END as has_media
      FROM user_highlights 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId]);

    return NextResponse.json({
      highlights: result.rows,
      user: userResult.rows[0]
    });

  } catch (error) {
    console.error('Error fetching user highlights:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
