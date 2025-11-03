/**
 * Утилита для безопасной работы с fetch на Vercel
 * Правильно обрабатывает ошибки и парсит ответы
 */

interface FetchOptions extends RequestInit {
  credentials?: RequestCredentials;
}

export async function safeFetch<T = unknown>(
  url: string,
  options?: FetchOptions
): Promise<{ data?: T; error?: string; status: number }> {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      ...options,
    });

    // Получаем content-type
    const contentType = response.headers.get('content-type');
    
    // Проверяем что это JSON
    if (contentType && contentType.includes('application/json')) {
      try {
        const data = await response.json() as T & { error?: string };
        
        if (response.ok) {
          return { data, status: response.status };
        } else {
          return { 
            error: (data as { error?: string }).error || 'Произошла ошибка', 
            status: response.status 
          };
        }
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        return {
          error: 'Ошибка парсинга ответа сервера',
          status: response.status
        };
      }
    } else {
      // Не JSON ответ (возможно HTML с ошибкой)
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      
      return {
        error: response.ok 
          ? 'Неожиданный формат ответа'
          : `Ошибка сервера (${response.status})`,
        status: response.status
      };
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return {
      error: error instanceof Error ? error.message : 'Ошибка подключения',
      status: 0
    };
  }
}

/**
 * Безопасный парсинг JSON ответа
 */
export async function safeParseJSON<T = unknown>(
  response: Response
): Promise<{ data?: T; error?: string }> {
  try {
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Expected JSON, got:', text.substring(0, 200));
      return { error: 'Неожиданный формат ответа сервера' };
    }
    
    const data = await response.json() as T;
    return { data };
  } catch (error) {
    console.error('JSON parse error:', error);
    return { error: 'Ошибка парсинга ответа' };
  }
}

