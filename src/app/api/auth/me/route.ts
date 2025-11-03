import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Токен не найден' },
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

    // Получаем расширенную информацию о пользователе
    const userResult = await query(`
      SELECT 
        u.id, u.name, u.email, u.created_at,
        up.bio, up.avatar_data, up.website, up.location
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1
    `, [user.id]);

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    const userData = userResult.rows[0] as { 
      id: number; 
      name: string; 
      email: string; 
      created_at: string;
      bio?: string;
      avatar_data?: string;
      website?: string;
      location?: string;
    };

    return NextResponse.json({
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        createdAt: userData.created_at,
        bio: userData.bio || '',
        avatarUrl: userData.avatar_data || null,
        website: userData.website || '',
        location: userData.location || ''
      }
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
