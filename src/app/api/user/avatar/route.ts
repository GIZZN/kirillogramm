import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const user = verifyToken(request.cookies.get('auth-token')?.value || '');
    if (!user) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get('avatar') as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'Изображение не предоставлено' },
        { status: 400 }
      );
    }

    // Проверяем тип файла (убраны все ограничения на размер)
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Файл должен быть изображением' },
        { status: 400 }
      );
    }

    // Конвертируем изображение в base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const imageDataUrl = `data:${imageFile.type};base64,${base64Image}`;

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

    // Добавляем столбец avatar_data если его нет
    await query(`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS avatar_data TEXT
    `);

    // Обновляем или создаем профиль пользователя с аватаркой
    await query(`
      INSERT INTO user_profiles (user_id, avatar_data, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        avatar_data = $2,
        updated_at = CURRENT_TIMESTAMP
    `, [user.id, imageDataUrl]);

    return NextResponse.json({
      message: 'Аватарка обновлена',
      avatarUrl: imageDataUrl
    });

  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const user = verifyToken(request.cookies.get('auth-token')?.value || '');
    if (!user) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
      );
    }

    // Удаляем аватарку (устанавливаем NULL)
    await query(`
      UPDATE user_profiles 
      SET avatar_data = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `, [user.id]);

    return NextResponse.json({
      message: 'Аватарка удалена'
    });

  } catch (error) {
    console.error('Error deleting avatar:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
