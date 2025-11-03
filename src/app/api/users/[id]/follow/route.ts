import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Подписаться/отписаться от пользователя
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const targetUserId = parseInt(resolvedParams.id);

    if (isNaN(targetUserId)) {
      return NextResponse.json(
        { error: 'Неверный ID пользователя' },
        { status: 400 }
      );
    }

    // Нельзя подписаться на себя
    if (user.id === targetUserId) {
      return NextResponse.json(
        { error: 'Нельзя подписаться на себя' },
        { status: 400 }
      );
    }

    // Проверяем, существует ли пользователь
    const targetUserResult = await query(
      `SELECT id FROM users WHERE id = $1`,
      [targetUserId]
    );

    if (targetUserResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
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

    // Проверяем, подписан ли уже пользователь
    const existingFollow = await query(
      `SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2`,
      [user.id, targetUserId]
    );

    let isFollowing = false;
    let followersCount = 0;

    if (existingFollow.rows.length > 0) {
      // Отписываемся
      await query(
        `DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2`,
        [user.id, targetUserId]
      );
      isFollowing = false;
    } else {
      // Подписываемся
      await query(
        `INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2)`,
        [user.id, targetUserId]
      );
      isFollowing = true;
    }

    // Получаем обновленное количество подписчиков
    const followersResult = await query(
      `SELECT COUNT(*) as count FROM user_follows WHERE following_id = $1`,
      [targetUserId]
    );
    
    followersCount = parseInt((followersResult.rows[0] as { count: string }).count);

    return NextResponse.json({
      isFollowing,
      followersCount,
      message: isFollowing ? 'Подписка оформлена' : 'Отписка выполнена'
    });

  } catch (error) {
    console.error('Error managing follow:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Получить статус подписки
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { isFollowing: false, followersCount: 0 },
        { status: 200 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { isFollowing: false, followersCount: 0 },
        { status: 200 }
      );
    }

    const resolvedParams = await params;
    const targetUserId = parseInt(resolvedParams.id);

    if (isNaN(targetUserId)) {
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

    // Проверяем статус подписки
    const followResult = await query(
      `SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2`,
      [user.id, targetUserId]
    );

    // Получаем количество подписчиков
    const followersResult = await query(
      `SELECT COUNT(*) as count FROM user_follows WHERE following_id = $1`,
      [targetUserId]
    );

    const isFollowing = followResult.rows.length > 0;
    const followersCount = parseInt((followersResult.rows[0] as { count: string }).count);

    return NextResponse.json({
      isFollowing,
      followersCount
    });

  } catch (error) {
    console.error('Error getting follow status:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
