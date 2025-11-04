import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

// Получить избранные посты пользователя
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

    // Создаем таблицу recipe_comments если не существует
    await query(`
      CREATE TABLE IF NOT EXISTS recipe_comments (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES user_recipes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Получаем избранные посты пользователя
    const result = await query( 
      `SELECT 
        ur.id, ur.title, ur.category, ur.description, ur.ingredients, ur.instructions,
        ur.time, ur.servings, ur.difficulty, ur.views_count, ur.likes_count,
        ur.created_at, u.name as author_name, uf.created_at as favorited_at,
        CASE WHEN ur.image_data IS NOT NULL THEN true ELSE false END as has_image,
        COALESCE(comment_counts.comments_count, 0) as comments_count
       FROM user_favorites uf
       JOIN user_recipes ur ON uf.recipe_id = ur.id
       JOIN users u ON ur.user_id = u.id
       LEFT JOIN (
         SELECT recipe_id, COUNT(*) as comments_count
         FROM recipe_comments
         GROUP BY recipe_id
       ) comment_counts ON ur.id = comment_counts.recipe_id
       WHERE uf.user_id = $1 AND uf.recipe_type = 'user_recipe'
       ORDER BY uf.created_at DESC`,
      [user.id]
    );

    return NextResponse.json(
      { favorites: result.rows },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Добавить рецепт в избранное
export async function POST(request: NextRequest) {
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

    const { recipeId, recipeType = 'user_recipe' } = await request.json();

    if (!recipeId) {
      return NextResponse.json(
        { error: 'ID рецепта обязателен' },
        { status: 400 }
      );
    }

    // Проверяем, что рецепт существует
    let recipeExists = false;
    if (recipeType === 'user_recipe') {
      const recipeCheck = await query(
        `SELECT id FROM user_recipes WHERE id = $1 AND is_public = true`,
        [recipeId]
      );
      recipeExists = recipeCheck.rows.length > 0;
    }

    if (!recipeExists) {
      return NextResponse.json(
        { error: 'Рецепт не найден' },
        { status: 404 }
      );
    }

    // Добавляем в избранное (или игнорируем, если уже есть)
    await query(
      `INSERT INTO user_favorites (user_id, recipe_id, recipe_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, recipe_id, recipe_type) DO NOTHING`,
      [user.id, recipeId, recipeType]
    );

    return NextResponse.json(
      { message: 'Рецепт добавлен в избранное' },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error adding to favorites:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Удалить рецепт из избранного
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get('recipeId');
    const recipeType = searchParams.get('recipeType') || 'user_recipe';

    if (!recipeId) {
      return NextResponse.json(
        { error: 'ID рецепта обязателен' },
        { status: 400 }
      );
    }

    // Удаляем из избранного
    const result = await query(
      `DELETE FROM user_favorites 
       WHERE user_id = $1 AND recipe_id = $2 AND recipe_type = $3`,
      [user.id, parseInt(recipeId), recipeType]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Рецепт не найден в избранном' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Рецепт удален из избранного' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error removing from favorites:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
