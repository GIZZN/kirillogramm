import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

// Получение конкретного рецепта
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const resolvedParams = await params;
    const recipeId = parseInt(resolvedParams.id);

    if (isNaN(recipeId)) {
      return NextResponse.json(
        { error: 'Неверный ID рецепта' },
        { status: 400 }
      );
    }

    // Получаем рецепт с информацией об авторе
    const result = await query(
      `SELECT 
        ur.id, ur.title, ur.category, ur.description, ur.ingredients, ur.instructions,
        ur.time, ur.servings, ur.difficulty, ur.image_url, ur.is_approved, ur.is_public,
        ur.views_count, ur.likes_count, ur.created_at, ur.updated_at,
        u.name as author_name, u.email as author_email,
        ur.user_id
       FROM user_recipes ur
       JOIN users u ON ur.user_id = u.id
       WHERE ur.id = $1`,
      [recipeId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Рецепт не найден' },
        { status: 404 }
      );
    }

    const recipe = result.rows[0] as { id: number; title: string; category: string; description: string; ingredients: string[]; instructions: string; time: string; servings: number; difficulty: string; image_url: string; is_approved: boolean; is_public: boolean; views_count: number; likes_count: number; created_at: string; updated_at: string; author_name: string; author_email: string; user_id: number };

    // Если рецепт не публичный, проверяем авторизацию
    if (!recipe.is_public) {
      if (!token) {
        return NextResponse.json(
          { error: 'Требуется авторизация' },
          { status: 401 }
        );
      }

      const user = verifyToken(token);
      if (!user || user.id !== recipe.user_id) {
        return NextResponse.json(
          { error: 'Доступ запрещен' },
          { status: 403 }
        );
      }
    }

    // Увеличиваем счетчик просмотров
    if (token) {
      const user = verifyToken(token);
      if (user && user.id !== recipe.user_id) {
        // Записываем просмотр только если это не автор рецепта
        await query(
          `INSERT INTO user_recipe_views (user_id, recipe_id, ip_address, user_agent)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [user.id, recipeId, '127.0.0.1', request.headers.get('user-agent')]
        );
        
        // Обновляем счетчик просмотров
        await query(
          `UPDATE user_recipes SET views_count = views_count + 1 WHERE id = $1`,
          [recipeId]
        );
      }
    }

    return NextResponse.json(
      { recipe },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Обновление рецепта
export async function PUT(
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

    const { title, category, description, ingredients, instructions, time, servings, difficulty, is_public } = await request.json();

    // Валидация
    if (!title || !category || !description || !ingredients || !instructions) {
      return NextResponse.json(
        { error: 'Все обязательные поля должны быть заполнены' },
        { status: 400 }
      );
    }

    // Проверяем, что рецепт принадлежит пользователю
    const checkResult = await query(
      `SELECT user_id FROM user_recipes WHERE id = $1`,
      [recipeId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Рецепт не найден' },
        { status: 404 }
      );
    }

    if ((checkResult.rows[0] as { user_id: number }).user_id !== user.id) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Обновляем рецепт
    const result = await query(
      `UPDATE user_recipes 
       SET title = $1, category = $2, description = $3, ingredients = $4, 
           instructions = $5, time = $6, servings = $7, difficulty = $8, is_public = $9
       WHERE id = $10 AND user_id = $11
       RETURNING id, title, category, created_at, updated_at`,
      [
        title, category, description, ingredients, instructions, 
        time || '30 мин', servings || 2, difficulty || 'Средняя', 
        is_public || false, recipeId, user.id
      ]
    );

    return NextResponse.json(
      { 
        message: 'Рецепт успешно обновлен!',
        recipe: result.rows[0]
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error updating recipe:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Удаление рецепта
export async function DELETE(
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

    // Проверяем, что рецепт принадлежит пользователю
    const checkResult = await query(
      `SELECT user_id FROM user_recipes WHERE id = $1`,
      [recipeId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Рецепт не найден' },
        { status: 404 }
      );
    }

    if ((checkResult.rows[0] as { user_id: number }).user_id !== user.id) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Удаляем рецепт (каскадно удалятся связанные записи)
    await query(
      `DELETE FROM user_recipes WHERE id = $1 AND user_id = $2`,
      [recipeId, user.id]
    );

    return NextResponse.json(
      { message: 'Рецепт успешно удален!' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}