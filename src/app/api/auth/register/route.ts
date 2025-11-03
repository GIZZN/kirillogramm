import { NextRequest, NextResponse } from 'next/server';
import { createUser, generateToken } from '@/lib/auth';
import { initializeDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Инициализируем базу данных при первом запросе
    await initializeDatabase();

    const { email, password, name } = await request.json();

    // Валидация
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Некорректный email адрес' },
        { status: 400 }
      );
    }

    const user = await createUser(email, password, name);
    const token = generateToken(user!);

    const response = NextResponse.json(
      { 
        message: 'Пользователь успешно зарегистрирован',
        user: {
          id: user!.id,
          email: user!.email,
          name: user!.name
        }
      },
      { status: 201 }
    );

    // Устанавливаем JWT токен в httpOnly cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 дней
    });

    return response;  
  } catch (error: unknown) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
