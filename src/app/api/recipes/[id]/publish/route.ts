import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

// Опубликовать рецепт (сделать публичным)
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

    // Проверяем, что рецепт принадлежит пользователю
    const checkResult = await query(
      `SELECT user_id, is_public FROM user_recipes WHERE id = $1`,
      [recipeId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Рецепт не найден' },
        { status: 404 }
      );
    }

    const recipe = checkResult.rows[0] as { user_id: number; is_public: boolean };

    if (recipe.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    if (recipe.is_public) {
      return NextResponse.json(
        { error: 'Рецепт уже опубликован' },
        { status: 400 }
      );
    }

    // Публикуем рецепт
    await query(
      `UPDATE user_recipes 
       SET is_public = true, is_approved = true 
       WHERE id = $1 AND user_id = $2`,
      [recipeId, user.id]
    );

    return NextResponse.json(
      { message: 'Рецепт успешно опубликован!' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error publishing recipe:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Снять с публикации
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

    // Снимаем с публикации
    await query(
      `UPDATE user_recipes 
       SET is_public = false 
       WHERE id = $1 AND user_id = $2`,
      [recipeId, user.id]
    );

    return NextResponse.json(
      { message: 'Рецепт снят с публикации!' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error unpublishing recipe:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
