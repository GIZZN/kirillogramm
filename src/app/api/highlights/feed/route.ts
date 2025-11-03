import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Получить highlights от пользователей на которых подписан текущий пользователь + свои
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

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

    // Создаем таблицы если не существуют
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

    await query(`
      CREATE TABLE IF NOT EXISTS user_follows (
        id SERIAL PRIMARY KEY,
        follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id)
      )
    `);

    // Получаем highlights от пользователей на которых подписан + свои highlights
    const result = await query(`
      SELECT 
        h.id, h.title, h.thumbnail_data, h.media_type, h.duration, h.created_at, h.updated_at,
        u.id as user_id, u.name as author_name,
        CASE 
          WHEN h.video_data IS NOT NULL THEN true 
          WHEN h.thumbnail_data IS NOT NULL THEN true 
          ELSE false 
        END as has_media
      FROM user_highlights h
      JOIN users u ON h.user_id = u.id
      WHERE h.user_id = $1 
         OR h.user_id IN (
           SELECT following_id 
           FROM user_follows 
           WHERE follower_id = $1
         )
      ORDER BY h.created_at DESC
      LIMIT 50
    `, [user.id]);

    return NextResponse.json({
      highlights: result.rows
    });

  } catch (error) {
    console.error('Error fetching feed highlights:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
