import { NextResponse } from 'next/server';
import { testConnection, initializeDatabase } from '@/lib/db';

export async function GET() {
  const results: { step: string; status: string; message?: string; error?: string }[] = [];
  
  try {
    // Шаг 1: Проверка переменных окружения
    results.push({
      step: 'Environment Variables',
      status: 'info',
      message: `DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}, DB_HOST: ${process.env.DB_HOST || 'NOT SET'}`
    });

    // Шаг 2: Тест подключения
    console.log('Testing database connection...');
    const isConnected = await testConnection();
    
    if (isConnected) {
      results.push({
        step: 'Connection Test',
        status: 'success',
        message: 'Database connection successful'
      });
    } else {
      results.push({
        step: 'Connection Test',
        status: 'error',
        message: 'Database connection failed'
      });
      
      return NextResponse.json({
        status: 'error',
        message: 'Database connection failed',
        results,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Шаг 3: Инициализация базы данных
    try {
      console.log('Attempting database initialization...');
      await initializeDatabase();
      results.push({
        step: 'Database Initialization',
        status: 'success',
        message: 'Database initialized successfully'
      });
    } catch (initError) {
      results.push({
        step: 'Database Initialization',
        status: 'error',
        error: initError instanceof Error ? initError.message : 'Unknown initialization error'
      });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Database diagnostics completed',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database test error:', error);
    results.push({
      step: 'General Error',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json({
      status: 'error',
      message: 'Database test failed',
      results,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
