import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

// Добавить/убрать лайк
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const resolvedParams = await params;
    const recipeId = parseInt(resolvedParams.id);

    if (!token) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }

    if (isNaN(recipeId)) {
      return NextResponse.json(
        { error: 'Неверный ID рецепта' },
        { status: 400 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
      );
    }

    // Проверяем существование рецепта
    const recipeCheck = await query(
      `SELECT id FROM user_recipes WHERE id = $1`,
      [recipeId]
    );

    if (recipeCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Рецепт не найден' },
        { status: 404 }
      );
    }

    // Проверяем, есть ли уже лайк от этого пользователя
    const existingLike = await query(
      `SELECT id FROM user_recipe_likes WHERE user_id = $1 AND recipe_id = $2`,
      [user.id, recipeId]
    );

    let isLiked = false;
    let message = '';

    if (existingLike.rows.length > 0) {
      // Убираем лайк
      await query(
        `DELETE FROM user_recipe_likes WHERE user_id = $1 AND recipe_id = $2`,
        [user.id, recipeId]
      );
      message = 'Лайк убран';
      isLiked = false;
    } else {
      // Добавляем лайк
      await query(
        `INSERT INTO user_recipe_likes (user_id, recipe_id) VALUES ($1, $2)`,
        [user.id, recipeId]
      );
      message = 'Лайк добавлен';
      isLiked = true;
    }

    // Получаем обновленное количество лайков
    const likesResult = await query(
      `SELECT likes_count FROM user_recipes WHERE id = $1`,
      [recipeId]
    );

    return NextResponse.json(
      { 
        message,
        isLiked,
        likesCount: (likesResult.rows[0] as { likes_count: number } | undefined)?.likes_count || 0
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Получить статус лайка
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const resolvedParams = await params;
    const recipeId = parseInt(resolvedParams.id);

    if (!token) {
      return NextResponse.json(
        { isLiked: false, likesCount: 0 },
        { status: 200 }
      );
    }

    if (isNaN(recipeId)) {
      return NextResponse.json(
        { error: 'Неверный ID рецепта' },
        { status: 400 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { isLiked: false, likesCount: 0 },
        { status: 200 }
      );
    }

    // Проверяем наличие лайка и получаем общее количество
    const result = await query(
      `SELECT 
        (SELECT COUNT(*) FROM user_recipe_likes WHERE user_id = $1 AND recipe_id = $2) > 0 as is_liked,
        (SELECT likes_count FROM user_recipes WHERE id = $2) as likes_count`,
      [user.id, recipeId]
    );

    const row = result.rows[0] as { is_liked: boolean; likes_count: number } | undefined;
    
    return NextResponse.json(
      { 
        isLiked: row?.is_liked || false,
        likesCount: row?.likes_count || 0
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error getting like status:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
