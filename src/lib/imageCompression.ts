/**
 * Утилиты для сжатия изображений перед загрузкой на Vercel
 * Vercel Free имеет лимит 4.5MB на запрос
 */

export async function compressImage(
  file: File,
  options: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    quality?: number;
  } = {}
): Promise<File> {
  const {
    maxSizeMB = 4,
    maxWidthOrHeight = 1920,
    quality = 0.8
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Изменяем размер если изображение слишком большое
        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width > height) {
            height = (height * maxWidthOrHeight) / width;
            width = maxWidthOrHeight;
          } else {
            width = (width * maxWidthOrHeight) / height;
            height = maxWidthOrHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Не удалось получить контекст canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Пробуем разные уровни сжатия пока не достигнем нужного размера
        const tryCompress = (currentQuality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Не удалось сжать изображение'));
                return;
              }

              const sizeMB = blob.size / (1024 * 1024);

              // Если размер подходит или качество уже минимально
              if (sizeMB <= maxSizeMB || currentQuality <= 0.1) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                // Пробуем с меньшим качеством
                tryCompress(currentQuality - 0.1);
              }
            },
            'image/jpeg',
            currentQuality
          );
        };

        tryCompress(quality);
      };

      img.onerror = () => reject(new Error('Не удалось загрузить изображение'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });
}

/**
 * Проверяет размер файла и сжимает если необходимо
 */
export async function ensureFileSize(
  file: File,
  maxSizeMB: number = 4
): Promise<File> {
  const sizeMB = file.size / (1024 * 1024);

  if (sizeMB <= maxSizeMB) {
    return file;
  }

  // Если это изображение, сжимаем
  if (file.type.startsWith('image/')) {
    return compressImage(file, { maxSizeMB });
  }

  // Для других типов файлов возвращаем как есть
  return file;
}

