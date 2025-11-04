import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

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

    const { title, category, description, ingredients, instructions, time, servings, difficulty, is_public, is_approved, hashtags } = await request.json();

    // Валидация
    if (!title || !category || !description || !ingredients || !instructions) {
      return NextResponse.json(
        { error: 'Все обязательные поля должны быть заполнены' },
        { status: 400 }
      );
    }

    // Создаем таблицы если они не существуют
    await query(`
      CREATE TABLE IF NOT EXISTS user_recipes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        ingredients TEXT[] NOT NULL,
        instructions TEXT NOT NULL,
        time VARCHAR(50),
        servings INTEGER DEFAULT 2,
        difficulty VARCHAR(50) DEFAULT 'Средняя',
        image_url VARCHAR(500),
        is_approved BOOLEAN DEFAULT FALSE,
        is_public BOOLEAN DEFAULT FALSE,
        views_count INTEGER DEFAULT 0,
        likes_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создаем таблицу хештегов
    await query(`
      CREATE TABLE IF NOT EXISTS hashtags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        usage_count INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создаем связующую таблицу рецептов и хештегов
    await query(`
      CREATE TABLE IF NOT EXISTS recipe_hashtags (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES user_recipes(id) ON DELETE CASCADE,
        hashtag_id INTEGER REFERENCES hashtags(id) ON DELETE CASCADE,
        UNIQUE(recipe_id, hashtag_id)
      )
    `);

    // Добавляем рецепт
    const result = await query(
      `INSERT INTO user_recipes (user_id, title, category, description, ingredients, instructions, time, servings, difficulty, is_public, is_approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, title, category, created_at`,
      [user.id, title, category, description, ingredients, instructions, time || '30 мин', servings || 2, difficulty || 'Средняя', is_public || false, is_approved || false]
    );

    const recipeId = (result.rows[0] as { id: number }).id as number;

    // Обрабатываем хештеги если они есть
    if (hashtags && Array.isArray(hashtags) && hashtags.length > 0) {
      for (const hashtagName of hashtags) {
        if (typeof hashtagName === 'string' && hashtagName.trim()) {
          const cleanTag = hashtagName.trim().toLowerCase().replace(/^#/, '');
          
          // Проверяем, существует ли хештег
          const hashtagResult = await query(
            `SELECT id FROM hashtags WHERE name = $1`,
            [cleanTag]
          );

          let hashtagId;
          if (hashtagResult.rows.length > 0) {
            // Хештег существует, увеличиваем счетчик
            hashtagId = (hashtagResult.rows[0] as { id: number }).id;
            await query(
              `UPDATE hashtags SET usage_count = usage_count + 1 WHERE id = $1`,
              [hashtagId]
            );
          } else {
            // Создаем новый хештег
            const newHashtagResult = await query(
              `INSERT INTO hashtags (name) VALUES ($1) RETURNING id`,
              [cleanTag]
            );
            hashtagId = (newHashtagResult.rows[0] as { id: number }).id;
          }

          // Связываем рецепт с хештегом
          await query(
            `INSERT INTO recipe_hashtags (recipe_id, hashtag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [recipeId, hashtagId]
          );
        }
      }
    }

    return NextResponse.json(
      { 
        message: 'Рецепт успешно добавлен!',
        recipe: result.rows[0]
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating recipe:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

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

    // Получаем посты пользователя с дополнительной статистикой
    const result = await query(
      `SELECT 
        id, title, category, description, ingredients, instructions, 
        time, servings, difficulty, image_url, is_approved, is_public,
        views_count, likes_count, created_at, updated_at,
        CASE WHEN image_data IS NOT NULL THEN true ELSE false END as has_image
       FROM user_recipes 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [user.id]
    );

    return NextResponse.json(
      { recipes: result.rows },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error fetching user recipes:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
