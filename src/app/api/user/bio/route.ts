import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const user = verifyToken(request.cookies.get('auth-token')?.value || '');
    if (!user) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
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

    // Получаем био пользователя
    const result = await query(`
      SELECT bio FROM user_profiles WHERE user_id = $1
    `, [user.id]);

    const bio = result.rows.length > 0 ? (result.rows[0] as { bio: string }).bio : null;

    return NextResponse.json({ bio });

  } catch (error) {
    console.error('Error fetching user bio:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

async function updateBio(request: NextRequest) {
  // Проверяем авторизацию
  const user = verifyToken(request.cookies.get('auth-token')?.value || '');
  if (!user) {
    return NextResponse.json(
      { error: 'Недействительный токен' },
      { status: 401 }
    );
  }

  const { bio } = await request.json();

  if (typeof bio !== 'string') {
    return NextResponse.json(
      { error: 'Био должно быть строкой' },
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

  // Обновляем или создаем профиль пользователя
  await query(`
    INSERT INTO user_profiles (user_id, bio, updated_at)
    VALUES ($1, $2, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      bio = $2,
      updated_at = CURRENT_TIMESTAMP
  `, [user.id, bio]);

  return NextResponse.json({ 
    message: 'Био успешно обновлено',
    bio: bio
  });
}

export async function POST(request: NextRequest) {
  try {
    return await updateBio(request);
  } catch (error) {
    console.error('Error updating user bio:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    return await updateBio(request);
  } catch (error) {
    console.error('Error updating user bio:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
