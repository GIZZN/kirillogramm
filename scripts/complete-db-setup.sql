-- =====================================================
-- ПОЛНАЯ НАСТРОЙКА БАЗЫ ДАННЫХ ДЛЯ PHOTOVERSE
-- Выполните этот скрипт в PostgreSQL Query Tool
-- =====================================================

-- Начинаем транзакцию
BEGIN;

-- =====================================================
-- 1. ОСНОВНЫЕ ТАБЛИЦЫ
-- =====================================================

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица профилей пользователей (для био, аватаров и т.д.)
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
);

-- Таблица рецептов/фото пользователей
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
    image_data BYTEA,
    image_type VARCHAR(50),
    image_size INTEGER,
    is_approved BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. СИСТЕМА ХЕШТЕГОВ
-- =====================================================

-- Таблица хештегов
CREATE TABLE IF NOT EXISTS hashtags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Связующая таблица рецептов и хештегов
CREATE TABLE IF NOT EXISTS recipe_hashtags (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER REFERENCES user_recipes(id) ON DELETE CASCADE,
    hashtag_id INTEGER REFERENCES hashtags(id) ON DELETE CASCADE,
    UNIQUE(recipe_id, hashtag_id)
);

-- =====================================================
-- 3. СИСТЕМА ЛАЙКОВ И ИЗБРАННОГО
-- =====================================================

-- Таблица лайков для рецептов
CREATE TABLE IF NOT EXISTS user_recipe_likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recipe_id INTEGER REFERENCES user_recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recipe_id)
);

-- Таблица избранных рецептов
CREATE TABLE IF NOT EXISTS user_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recipe_id INTEGER NOT NULL,
    recipe_type VARCHAR(50) DEFAULT 'user_recipe',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recipe_id, recipe_type)
);

-- =====================================================
-- 4. СИСТЕМА КОММЕНТАРИЕВ
-- =====================================================

-- Таблица комментариев к рецептам (новая система)
CREATE TABLE IF NOT EXISTS recipe_comments (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER REFERENCES user_recipes(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id INTEGER REFERENCES recipe_comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица лайков комментариев
CREATE TABLE IF NOT EXISTS comment_likes (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER REFERENCES recipe_comments(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, user_id)
);

-- Старая таблица комментариев (для совместимости)
CREATE TABLE IF NOT EXISTS user_recipe_comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recipe_id INTEGER REFERENCES user_recipes(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    parent_id INTEGER REFERENCES user_recipe_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. СИСТЕМА ЧАТОВ И СООБЩЕНИЙ
-- =====================================================

-- Таблица чатов
CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(50) DEFAULT 'private',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица участников чатов
CREATE TABLE IF NOT EXISTS chat_participants (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chat_id, user_id)
);

-- Таблица сообщений
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица прочтения сообщений
CREATE TABLE IF NOT EXISTS message_reads (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id)
);

-- Таблица пользовательских сессий (для онлайн статуса)
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT false,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- =====================================================
-- 6. СИСТЕМА ПРОСМОТРОВ И СТАТИСТИКИ
-- =====================================================

-- Таблица просмотров рецептов
CREATE TABLE IF NOT EXISTS user_recipe_views (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    recipe_id INTEGER REFERENCES user_recipes(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. ОБНОВЛЕНИЕ СУЩЕСТВУЮЩИХ ДАННЫХ
-- =====================================================

-- Добавляем недостающие колонки в существующие таблицы
ALTER TABLE user_recipes 
ADD COLUMN IF NOT EXISTS image_data BYTEA,
ADD COLUMN IF NOT EXISTS image_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS image_size INTEGER,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Обновляем существующие записи
UPDATE user_recipes 
SET 
    is_public = COALESCE(is_public, FALSE),
    is_approved = COALESCE(is_approved, FALSE),
    views_count = COALESCE(views_count, 0),
    likes_count = COALESCE(likes_count, 0),
    comments_count = COALESCE(comments_count, 0),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE is_public IS NULL OR is_approved IS NULL OR views_count IS NULL 
   OR likes_count IS NULL OR comments_count IS NULL OR updated_at IS NULL;

-- Обновляем таблицу избранного
ALTER TABLE user_favorites 
ADD COLUMN IF NOT EXISTS recipe_type VARCHAR(50) DEFAULT 'user_recipe';

UPDATE user_favorites 
SET recipe_type = 'user_recipe' 
WHERE recipe_type IS NULL;

-- Удаляем старые ограничения и создаем новые
ALTER TABLE user_favorites DROP CONSTRAINT IF EXISTS user_favorites_user_id_recipe_id_key;
ALTER TABLE user_favorites ADD CONSTRAINT user_favorites_user_id_recipe_id_recipe_type_key 
    UNIQUE (user_id, recipe_id, recipe_type);

-- =====================================================
-- 8. СОЗДАНИЕ ИНДЕКСОВ ДЛЯ ОПТИМИЗАЦИИ
-- =====================================================

-- Основные индексы для user_recipes
CREATE INDEX IF NOT EXISTS idx_user_recipes_user_id ON user_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recipes_category ON user_recipes(category);
CREATE INDEX IF NOT EXISTS idx_user_recipes_is_public ON user_recipes(is_public);
CREATE INDEX IF NOT EXISTS idx_user_recipes_is_approved ON user_recipes(is_approved);
CREATE INDEX IF NOT EXISTS idx_user_recipes_created_at ON user_recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_recipes_likes_count ON user_recipes(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_user_recipes_views_count ON user_recipes(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_user_recipes_has_image ON user_recipes(id) WHERE image_data IS NOT NULL;

-- Индексы для системы лайков и избранного
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_recipe_id ON user_favorites(recipe_id);
CREATE INDEX IF NOT EXISTS idx_user_recipe_likes_recipe_id ON user_recipe_likes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_user_recipe_likes_user_id ON user_recipe_likes(user_id);

-- Индексы для комментариев
CREATE INDEX IF NOT EXISTS idx_recipe_comments_recipe_id ON recipe_comments(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_comments_user_id ON recipe_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_comments_parent_id ON recipe_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_recipe_comments_created_at ON recipe_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- Индексы для старых комментариев
CREATE INDEX IF NOT EXISTS idx_user_recipe_comments_recipe_id ON user_recipe_comments(recipe_id);
CREATE INDEX IF NOT EXISTS idx_user_recipe_comments_user_id ON user_recipe_comments(user_id);

-- Индексы для хештегов
CREATE INDEX IF NOT EXISTS idx_hashtags_name ON hashtags(name);
CREATE INDEX IF NOT EXISTS idx_hashtags_usage_count ON hashtags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_hashtags_recipe_id ON recipe_hashtags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_hashtags_hashtag_id ON recipe_hashtags(hashtag_id);

-- Индексы для чатов и сообщений
CREATE INDEX IF NOT EXISTS idx_chats_type ON chats(type);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON message_reads(user_id);

-- Индексы для сессий и просмотров
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_user_recipe_views_recipe_id ON user_recipe_views(recipe_id);
CREATE INDEX IF NOT EXISTS idx_user_recipe_views_user_id ON user_recipe_views(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recipe_views_created_at ON user_recipe_views(created_at DESC);

-- Индексы для профилей
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- =====================================================
-- 9. СОЗДАНИЕ ТРИГГЕРОВ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ
-- =====================================================

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_recipes_updated_at ON user_recipes;
CREATE TRIGGER update_user_recipes_updated_at 
    BEFORE UPDATE ON user_recipes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recipe_comments_updated_at ON recipe_comments;
CREATE TRIGGER update_recipe_comments_updated_at 
    BEFORE UPDATE ON recipe_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chats_updated_at ON chats;
CREATE TRIGGER update_chats_updated_at 
    BEFORE UPDATE ON chats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ СЧЕТЧИКОВ
-- =====================================================

-- Функция для обновления счетчика лайков рецепта
CREATE OR REPLACE FUNCTION update_recipe_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE user_recipes 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.recipe_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE user_recipes 
        SET likes_count = GREATEST(likes_count - 1, 0) 
        WHERE id = OLD.recipe_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления счетчика лайков
DROP TRIGGER IF EXISTS update_recipe_likes_count_trigger ON user_recipe_likes;
CREATE TRIGGER update_recipe_likes_count_trigger
    AFTER INSERT OR DELETE ON user_recipe_likes
    FOR EACH ROW EXECUTE FUNCTION update_recipe_likes_count();

-- Функция для обновления счетчика лайков комментария
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE recipe_comments 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE recipe_comments 
        SET likes_count = GREATEST(likes_count - 1, 0) 
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления счетчика лайков комментариев
DROP TRIGGER IF EXISTS update_comment_likes_count_trigger ON comment_likes;
CREATE TRIGGER update_comment_likes_count_trigger
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- Функция для обновления счетчика комментариев рецепта
CREATE OR REPLACE FUNCTION update_recipe_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE user_recipes 
        SET comments_count = comments_count + 1 
        WHERE id = NEW.recipe_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE user_recipes 
        SET comments_count = GREATEST(comments_count - 1, 0) 
        WHERE id = OLD.recipe_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления счетчика комментариев
DROP TRIGGER IF EXISTS update_recipe_comments_count_trigger ON recipe_comments;
CREATE TRIGGER update_recipe_comments_count_trigger
    AFTER INSERT OR DELETE ON recipe_comments
    FOR EACH ROW EXECUTE FUNCTION update_recipe_comments_count();

-- =====================================================
-- 11. СОЗДАНИЕ ТЕСТОВЫХ ДАННЫХ (ОПЦИОНАЛЬНО)
-- =====================================================

-- Раскомментируйте следующие строки, если хотите создать тестового пользователя
/*
-- Создаем тестового пользователя (пароль: "password123")
INSERT INTO users (email, name, password) 
VALUES ('test@photoverse.com', 'Test User', '$2b$10$rOvHPxfuWJuXlVJHc4.Pu.Hs8K8W8W8W8W8W8W8W8W8W8W8W8W8W8W')
ON CONFLICT (email) DO NOTHING;

-- Получаем ID тестового пользователя
DO $$
DECLARE
    test_user_id INTEGER;
BEGIN
    SELECT id INTO test_user_id FROM users WHERE email = 'test@photoverse.com';
    
    -- Создаем профиль для тестового пользователя
    INSERT INTO user_profiles (user_id, bio) 
    VALUES (test_user_id, '📸 Тестовый пользователь PhotoVerse' || E'\n' || '🌍 Тестирую функционал' || E'\n' || '✨ Добро пожаловать!')
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Создаем тестовый рецепт/фото
    INSERT INTO user_recipes (user_id, title, category, description, ingredients, instructions, is_public, is_approved)
    VALUES (
        test_user_id,
        'Тестовое фото',
        'Фото',
        'Это тестовое фото для проверки функционала',
        ARRAY['Тестовый ингредиент'],
        'Тестовая инструкция',
        true,
        true
    )
    ON CONFLICT DO NOTHING;
END $$;
*/

-- =====================================================
-- 12. ФИНАЛИЗАЦИЯ
-- =====================================================

-- Обновляем статистику PostgreSQL для оптимизации запросов
ANALYZE;

-- Подтверждаем все изменения
COMMIT;

-- =====================================================
-- ИНФОРМАЦИЯ О СОЗДАННЫХ ТАБЛИЦАХ
-- =====================================================

-- Выводим информацию о созданных таблицах
SELECT 
    schemaname,
    tablename,
    tableowner,
    tablespace,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'users', 'user_profiles', 'user_recipes', 'hashtags', 'recipe_hashtags',
    'user_recipe_likes', 'user_favorites', 'recipe_comments', 'comment_likes',
    'user_recipe_comments', 'chats', 'chat_participants', 'messages', 
    'message_reads', 'user_sessions', 'user_recipe_views'
)
ORDER BY tablename;

-- Выводим количество записей в каждой таблице
SELECT 
    'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL SELECT 'user_profiles', COUNT(*) FROM user_profiles
UNION ALL SELECT 'user_recipes', COUNT(*) FROM user_recipes
UNION ALL SELECT 'hashtags', COUNT(*) FROM hashtags
UNION ALL SELECT 'recipe_hashtags', COUNT(*) FROM recipe_hashtags
UNION ALL SELECT 'user_recipe_likes', COUNT(*) FROM user_recipe_likes
UNION ALL SELECT 'user_favorites', COUNT(*) FROM user_favorites
UNION ALL SELECT 'recipe_comments', COUNT(*) FROM recipe_comments
UNION ALL SELECT 'comment_likes', COUNT(*) FROM comment_likes
UNION ALL SELECT 'chats', COUNT(*) FROM chats
UNION ALL SELECT 'chat_participants', COUNT(*) FROM chat_participants
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'message_reads', COUNT(*) FROM message_reads
UNION ALL SELECT 'user_sessions', COUNT(*) FROM user_sessions
UNION ALL SELECT 'user_recipe_views', COUNT(*) FROM user_recipe_views
ORDER BY table_name;

-- =====================================================
-- ГОТОВО! 
-- База данных настроена и готова к работе.
-- =====================================================
