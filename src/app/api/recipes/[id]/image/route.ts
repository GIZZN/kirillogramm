import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

// Загрузить изображение для рецепта
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

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Файл изображения не найден' },
        { status: 400 }
      );
    }

    // Проверяем тип файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Неподдерживаемый тип файла. Разрешены: JPEG, PNG, WebP' },
        { status: 400 }
      );
    }

    // Проверяем размер файла (макс 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Размер файла не должен превышать 5MB' },
        { status: 400 }
      );
    }

    // Конвертируем файл в Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Сохраняем изображение в базу данных
    await query(
      `UPDATE user_recipes 
       SET image_data = $1, image_type = $2, image_size = $3
       WHERE id = $4 AND user_id = $5`,
      [buffer as unknown as string, file.type, file.size, recipeId, user.id]
    );

    return NextResponse.json(
      { 
        message: 'Изображение успешно загружено',
        imageSize: file.size,
        imageType: file.type
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Получить изображение рецепта
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

    // Получаем изображение из базы данных
    const result = await query(
      `SELECT image_data, image_type, image_size 
       FROM user_recipes 
       WHERE id = $1 AND image_data IS NOT NULL`,
      [recipeId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Изображение не найдено' },
        { status: 404 }
      );
    }

    const { image_data, image_type } = result.rows[0] as { image_data: Buffer; image_type: string };

    // Возвращаем изображение
    return new NextResponse(Buffer.from(image_data), {
      status: 200,
      headers: {
        'Content-Type': image_type,
        'Cache-Control': 'public, max-age=31536000', // Кэш на год
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Удалить изображение рецепта
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

    // Удаляем изображение
    await query(
      `UPDATE user_recipes 
       SET image_data = NULL, image_type = NULL, image_size = NULL
       WHERE id = $1 AND user_id = $2`,
      [recipeId, user.id]
    );

    return NextResponse.json(
      { message: 'Изображение удалено' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
