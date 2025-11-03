import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Получить статистику текущего пользователя
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

    // Создаем таблицу подписок если не существует
    await query(`
      CREATE TABLE IF NOT EXISTS user_follows (
        id SERIAL PRIMARY KEY,
        follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id)
      )
    `);

    // Получаем статистику подписок текущего пользователя
    const followersResult = await query(`
      SELECT COUNT(*) as count FROM user_follows WHERE following_id = $1
    `, [user.id]);

    const followingResult = await query(`
      SELECT COUNT(*) as count FROM user_follows WHERE follower_id = $1
    `, [user.id]);

    const followersCount = parseInt((followersResult.rows[0] as { count: string }).count);
    const followingCount = parseInt((followingResult.rows[0] as { count: string }).count);

    return NextResponse.json({
      followers: followersCount,
      following: followingCount
    });

  } catch (error) {
    console.error('Error fetching profile stats:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
