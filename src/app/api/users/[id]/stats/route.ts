import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Неверный ID пользователя' },
        { status: 400 }
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

    // Получаем статистику подписок пользователя
    const followersResult = await query(
      `SELECT COUNT(*) as count FROM user_follows WHERE following_id = $1`,
      [userId]
    );

    const followingResult = await query(
      `SELECT COUNT(*) as count FROM user_follows WHERE follower_id = $1`,
      [userId]
    );

    const followersCount = parseInt((followersResult.rows[0] as { count: string }).count);
    const followingCount = parseInt((followingResult.rows[0] as { count: string }).count);

    return NextResponse.json({
      followersCount,
      followingCount
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
