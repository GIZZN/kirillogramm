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

    // Создаем таблицу user_profiles если не существует
    await query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        bio TEXT,
        avatar_url TEXT,
        website TEXT,
        location TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `);

    // Получаем информацию о пользователе
    const userResult = await query(`
      SELECT u.id, u.name, u.email, u.created_at,
             COALESCE(up.bio, '') as bio,
             up.avatar_data as avatar_url
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
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

    // Получаем статистику пользователя
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_recipes,
        COALESCE(SUM(likes_count), 0) as total_likes,
        COALESCE(SUM(views_count), 0) as total_views
      FROM user_recipes 
      WHERE user_id = $1 AND is_public = true
    `, [userId]);

    // Получаем статистику подписок
    const followersResult = await query(`
      SELECT COUNT(*) as followers_count FROM user_follows WHERE following_id = $1
    `, [userId]);

    const followingResult = await query(`
      SELECT COUNT(*) as following_count FROM user_follows WHERE follower_id = $1
    `, [userId]);

    const stats = statsResult.rows[0] as {
      total_recipes: string;
      total_likes: string;
      total_views: string;
    };
    
    const followersCount = parseInt((followersResult.rows[0] as { followers_count: string }).followers_count);
    const followingCount = parseInt((followingResult.rows[0] as { following_count: string }).following_count);

    // Получаем публичные рецепты пользователя
    const recipesResult = await query(`
      SELECT 
        id, title, category, description, 
        likes_count, views_count, created_at,
        CASE WHEN image_data IS NOT NULL THEN true ELSE false END as has_image
      FROM user_recipes 
      WHERE user_id = $1 AND is_public = true AND is_approved = true
      ORDER BY created_at DESC
    `, [userId]);

    const userData = userResult.rows[0] as {
      id: number;
      name: string;
      email: string;
      created_at: string;
      bio: string;
      avatar_url?: string;
    };

    return NextResponse.json({
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        created_at: userData.created_at,
        bio: userData.bio || '',
        avatarUrl: userData.avatar_url,
        stats: {
          totalRecipes: parseInt((stats as { total_recipes: string }).total_recipes),
          totalLikes: parseInt((stats as { total_likes: string }).total_likes),
          totalViews: parseInt((stats as { total_views: string }).total_views),
          followers: followersCount,
          following: followingCount
        }
      },
      recipes: recipesResult.rows
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
