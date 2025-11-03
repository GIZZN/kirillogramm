import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Получение популярных хештегов
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    // Создаем таблицу хештегов если она не существует
    await query(`
      CREATE TABLE IF NOT EXISTS hashtags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        usage_count INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    let queryText = `
      SELECT name, usage_count 
      FROM hashtags 
    `;
    const params: (string | number)[] = [];
    let paramIndex = 1;

    // Поиск по названию хештега
    if (search && search.trim()) {
      queryText += ` WHERE LOWER(name) LIKE LOWER($${paramIndex})`;
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    // Сортировка по популярности
    queryText += ` ORDER BY usage_count DESC, name ASC`;
    
    // Лимит
    queryText += ` LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await query(queryText, params);

    return NextResponse.json(
      { hashtags: result.rows },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error fetching hashtags:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
