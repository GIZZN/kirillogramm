import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

// Получить список лайкнутых рецептов пользователя
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { likedRecipeIds: [] },
        { status: 200 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { likedRecipeIds: [] },
        { status: 200 }
      );
    }

    // Получаем все рецепты, которые лайкнул пользователь
    const result = await query(
      `SELECT recipe_id FROM user_recipe_likes WHERE user_id = $1`,
      [user.id]
    );

    const likedRecipeIds = (result.rows as { recipe_id: number }[]).map(row => row.recipe_id);          

    return NextResponse.json(
      { likedRecipeIds },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error fetching liked recipes:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
