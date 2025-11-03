import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Получить все highlights пользователя
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

    // Создаем таблицу highlights если не существует
    await query(`
      CREATE TABLE IF NOT EXISTS user_highlights (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        thumbnail_data TEXT,
        video_data TEXT,
        media_type VARCHAR(20) DEFAULT 'image',
        duration INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Получаем highlights пользователя
    const result = await query(`
      SELECT 
        id, title, thumbnail_data, media_type, duration, created_at, updated_at,
        CASE 
          WHEN video_data IS NOT NULL THEN true 
          WHEN thumbnail_data IS NOT NULL THEN true 
          ELSE false 
        END as has_media
      FROM user_highlights 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [user.id]);

    return NextResponse.json({
      highlights: result.rows
    });

  } catch (error) {
    console.error('Error fetching highlights:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Создать новый highlight
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

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const mediaFile = formData.get('media') as File;
    const mediaType = formData.get('mediaType') as string || 'image';

    if (!title || !mediaFile) {
      return NextResponse.json(
        { error: 'Заголовок и медиа файл обязательны' },
        { status: 400 }
      );
    }

    // Проверяем тип файла (убраны все ограничения на размер)
    let isValidType = false;
    let duration = 0;

    if (mediaType === 'video') {
      isValidType = mediaFile.type.startsWith('video/');
      duration = 0; // Без ограничений на длительность
    } else {
      isValidType = mediaFile.type.startsWith('image/');
    }

    if (!isValidType) {
      return NextResponse.json(
        { error: `Файл должен быть ${mediaType === 'video' ? 'видео' : 'изображением'}` },
        { status: 400 }
      );
    }


    // Конвертируем файл в base64
    const arrayBuffer = await mediaFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Media = buffer.toString('base64');
    const mediaDataUrl = `data:${mediaFile.type};base64,${base64Media}`;

    // Создаем таблицу highlights если не существует
    await query(`
      CREATE TABLE IF NOT EXISTS user_highlights (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        thumbnail_data TEXT,
        video_data TEXT,
        media_type VARCHAR(20) DEFAULT 'image',
        duration INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Сохраняем highlight
    let result;
    const thumbnailFile = formData.get('thumbnail') as File;
    
    if (mediaType === 'video') {
      // Для видео получаем thumbnail отдельно
      let thumbnailDataUrl = mediaDataUrl; // Fallback на видео если thumbnail не предоставлен
      
      if (thumbnailFile && thumbnailFile.size > 0) {
        const thumbnailArrayBuffer = await thumbnailFile.arrayBuffer();
        const thumbnailBuffer = Buffer.from(thumbnailArrayBuffer);
        const base64Thumbnail = thumbnailBuffer.toString('base64');
        thumbnailDataUrl = `data:${thumbnailFile.type};base64,${base64Thumbnail}`;
      }
      
      result = await query(`
        INSERT INTO user_highlights (user_id, title, video_data, thumbnail_data, media_type, duration)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, title, media_type, duration, created_at
      `, [user.id, title, mediaDataUrl, thumbnailDataUrl, mediaType, duration]);
    } else {
      // Для изображений сохраняем в thumbnail_data
      result = await query(`
        INSERT INTO user_highlights (user_id, title, thumbnail_data, media_type, duration)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, title, media_type, duration, created_at
      `, [user.id, title, mediaDataUrl, mediaType, duration]);
    }

    return NextResponse.json({
      message: 'Highlight создан успешно',
      highlight: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating highlight:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
