import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Получение комментариев к рецепту
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const recipeId = parseInt(resolvedParams.id);

    if (isNaN(recipeId)) {
      return NextResponse.json(
        { error: 'Неверный ID рецепта' },
        { status: 400 }
      );
    }

    // Создаем таблицы если они не существуют
    await query(`
      CREATE TABLE IF NOT EXISTS recipe_comments (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES user_recipes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        parent_id INTEGER REFERENCES recipe_comments(id) ON DELETE CASCADE,
        likes_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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

    // Добавляем столбец comments_count если его нет
    await query(`
      ALTER TABLE user_recipes 
      ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0
    `);

    // Проверяем авторизацию для получения лайков пользователя
    const user = verifyToken(request.cookies.get('auth-token')?.value || '');
    
    // Получаем комментарии с информацией о пользователях и лайках
    const userId = user?.id ?? null;
    let result;
    
    if (userId !== null) {
      result = await query(`
        SELECT 
          rc.id, rc.content, rc.parent_id, rc.likes_count, rc.created_at,
          rc.user_id as author_id, u.name as author_name, u.email as author_email,
          up.avatar_data as author_avatar,
          CASE
            WHEN EXISTS (
              SELECT 1 FROM comment_likes cl
              WHERE cl.comment_id = rc.id AND cl.user_id = $2
            ) THEN true
            ELSE false
          END as is_liked_by_user
        FROM recipe_comments rc
        JOIN users u ON rc.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE rc.recipe_id = $1
        ORDER BY rc.created_at ASC
      `, [recipeId, userId]);
    } else {
      result = await query(`
        SELECT
          rc.id, rc.content, rc.parent_id, rc.likes_count, rc.created_at,
          rc.user_id as author_id, u.name as author_name, u.email as author_email,
          up.avatar_data as author_avatar,
          false as is_liked_by_user
        FROM recipe_comments rc
        JOIN users u ON rc.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE rc.recipe_id = $1
        ORDER BY rc.created_at ASC
      `, [recipeId]);
    }

    return NextResponse.json(
      { comments: result.rows },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Добавление нового комментария
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const recipeId = parseInt(resolvedParams.id);

    if (isNaN(recipeId)) {
      return NextResponse.json(
        { error: 'Неверный ID рецепта' },
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

    const { content, parent_id } = await request.json();

    // Валидация
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Комментарий не может быть пустым' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Комментарий слишком длинный (максимум 1000 символов)' },
        { status: 400 }
      );
    }

    // Создаем таблицы если они не существуют
    await query(`
      CREATE TABLE IF NOT EXISTS recipe_comments (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES user_recipes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        parent_id INTEGER REFERENCES recipe_comments(id) ON DELETE CASCADE,
        likes_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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

    // Добавляем столбец comments_count если его нет
    await query(`
      ALTER TABLE user_recipes 
      ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0
    `);

    // Добавляем комментарий
    const result = await query(`
      INSERT INTO recipe_comments (recipe_id, user_id, content, parent_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, content, parent_id, likes_count, created_at
    `, [recipeId, user.id, content.trim(), parent_id || null]);

    // Обновляем счетчик комментариев в рецепте
    await query(`
      UPDATE user_recipes 
      SET comments_count = (
        SELECT COUNT(*) FROM recipe_comments WHERE recipe_id = $1
      )
      WHERE id = $1
    `, [recipeId]);

    // Получаем информацию о пользователе для ответа
    const userInfo = await query(`
      SELECT name, email FROM users WHERE id = $1
    `, [user.id]);

    const comment = {
      ...result.rows[0] as { id: number; content: string; parent_id: number | null; likes_count: number; created_at: string },  
      author_id: user.id,
      author_name: (userInfo.rows[0] as { name: string }).name as string,
      author_email: (userInfo.rows[0] as { email: string }).email as string,
      is_liked_by_user: false // Новый комментарий не лайкнут автором
    };

    return NextResponse.json(
      { 
        message: 'Комментарий добавлен!',
        comment
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating comment:', error);
    
    // Более подробная информация об ошибке
    let errorMessage = 'Внутренняя ошибка сервера';
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
      errorMessage = `Ошибка: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
