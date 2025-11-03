import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Лайк/дизлайк комментария
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const resolvedParams = await params;
    const recipeId = parseInt(resolvedParams.id);
    const commentId = parseInt(resolvedParams.commentId);

    if (isNaN(recipeId) || isNaN(commentId)) {
      return NextResponse.json(
        { error: 'Неверный ID' },
        { status: 400 }
      );
    }

    // Проверяем авторизацию
    const user = verifyToken(request.cookies.get('auth-token')?.value || '');
    if (!user) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
      );
    }

    // Создаем таблицу лайков комментариев если она не существует
    await query(`
      CREATE TABLE IF NOT EXISTS comment_likes (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER REFERENCES recipe_comments(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(comment_id, user_id)
      )
    `);

    // Проверяем, есть ли уже лайк
    const existingLike = await query(`
      SELECT id FROM comment_likes 
      WHERE comment_id = $1 AND user_id = $2
    `, [commentId, user.id]);

    let isLiked = false;
    let likesCount = 0;

    if (existingLike.rows.length > 0) {
      // Убираем лайк
      await query(`
        DELETE FROM comment_likes 
        WHERE comment_id = $1 AND user_id = $2
      `, [commentId, user.id]);
    } else {
      // Добавляем лайк
      await query(`
        INSERT INTO comment_likes (comment_id, user_id)
        VALUES ($1, $2)
      `, [commentId, user.id]);
      isLiked = true;
    }

    // Обновляем счетчик лайков в комментарии
    const likesResult = await query(`
      UPDATE recipe_comments 
      SET likes_count = (
        SELECT COUNT(*) FROM comment_likes WHERE comment_id = $1
      )
      WHERE id = $1
      RETURNING likes_count
    `, [commentId]);

    likesCount = (likesResult.rows[0] as { likes_count: number } | undefined)?.likes_count || 0;

    return NextResponse.json(
      { 
        isLiked,
        likesCount
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error toggling comment like:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
