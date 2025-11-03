import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

// Очистить все избранные рецепты пользователя
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

    // Удаляем все избранные рецепты пользователя
    const result = await query(
      `DELETE FROM user_favorites WHERE user_id = $1`,
      [user.id]
    );

    return NextResponse.json(
      { 
        message: 'Все избранные рецепты удалены',
        deletedCount: result.rowCount 
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error clearing favorites:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
