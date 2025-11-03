'use client';
import { useState } from 'react';
import styles from "./page.module.css";
import Dither from "./components/Dither";
import Link from "next/link";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = () => setIsModalOpen(false);

  return (
    <div className={styles.page}>
      {/* Фоновый компонент Dither */}
      <div className={styles.background}>
        <Dither
          waveColor={[0.5, 0.5, 0.5]}
          disableAnimation={false}
          enableMouseInteraction={true}
          mouseRadius={0.3}
          colorNum={4}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.05}
        />
      </div>
      
      {/* Основной контент поверх фона */}
      <main className={styles.main}>
        <div className={styles.hero}>
          {/* Декоративные элементы */}
          <div className={styles.decorativeElements}>
            <div className={styles.floatingDot}></div>
            <div className={styles.geometricShape1}></div>
            <div className={styles.geometricShape2}></div>
            <div className={styles.glowOrb}></div>
            <div className={styles.gridPattern}></div>
            <svg className={styles.wavyLine} viewBox="0 0 200 100" fill="none">
              <path d="M0,50 Q50,10 100,50 T200,50" stroke="rgba(29, 185, 84, 0.3)" strokeWidth="2" fill="none"/>
            </svg>
            <div className={styles.particleContainer}>
              <div className={styles.particle}></div>
              <div className={styles.particle}></div>
              <div className={styles.particle}></div>
            </div>
          </div>
          
          {/* Основной контент */}
          <div className={styles.heroContent}>
            <div className={styles.leftSection}>
              <div className={styles.badge}>
                <svg className={styles.badgeIcon} width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
                  <path d="M19 15L20.09 18.26L24 19L20.09 19.74L19 23L17.91 19.74L14 19L17.91 18.26L19 15Z" fill="currentColor"/>
                  <path d="M5 6L5.5 7.5L7 8L5.5 8.5L5 10L4.5 8.5L3 8L4.5 7.5L5 6Z" fill="currentColor"/>
                </svg>
                <span>KIRILLOGRAMM - ДЕЛИСЬ МОМЕНТАМИ</span>
              </div>
              
              <h1 className={styles.title}>
                Делись <span className={styles.gradient}>моментами</span><br />
                с миром
              </h1>
              
              <p className={styles.description}>
                Создавай, делись и открывай удивительные фотографии. Подключайся к сообществу 
                творческих людей и находи вдохновение каждый день.
              </p>
              
              <div className={styles.actions}>
                <Link href="/feed" className={styles.primaryButton}>
                  <span>Открыть галерею</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
                
              </div>
            </div>
            
            <div className={styles.rightSection}>
              <div className={styles.featuresGrid}>
                <div className={styles.feature}>
                  <div className={styles.featureIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className={styles.featureContent}>
                    <h3>Умные фильтры</h3>
                    <p>Автоматическая обработка</p>
                  </div>
                </div>
                
                <div className={styles.feature}>
                  <div className={styles.featureIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <circle cx="12" cy="12" r="3" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className={styles.featureContent}>
                    <h3>Поиск по содержимому</h3>
                    <p>Найди любое фото по описанию</p>
                  </div>
                </div>
                
                <div className={styles.feature}>
                  <div className={styles.featureIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <circle cx="12" cy="16" r="1" fill="currentColor"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>
                  <div className={styles.featureContent}>
                    <h3>Безопасное хранение</h3>
                    <p>Твои фото под защитой</p>
                  </div>
                </div>
              </div>
              
              {/* Статистика */}
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <div className={styles.statNumber}>2.5M+</div>
                  <div className={styles.statLabel}>Фотографий</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statNumber}>150K+</div>
                  <div className={styles.statLabel}>Пользователей</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statNumber}>50K+</div>
                  <div className={styles.statLabel}>Ежедневно</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Модальное окно */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Возможности PhotoVerse</h2>
              <button className={styles.closeButton} onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.modalSection}>
                <div className={styles.modalFeature}>
                  <div className={styles.modalFeatureIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className={styles.modalFeatureContent}>
                    <h3>Умные фильтры</h3>
                    <p>Наша система автоматически улучшает ваши фотографии с помощью ИИ. Применяйте профессиональные фильтры одним касанием, корректируйте освещение и цвета для получения идеального результата.</p>
                  </div>
                </div>

                <div className={styles.modalFeature}>
                  <div className={styles.modalFeatureIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <circle cx="12" cy="12" r="3" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className={styles.modalFeatureContent}>
                    <h3>Поиск по содержимому</h3>
                    <p>Революционная технология поиска фотографий по их содержимому. Просто опишите, что ищете: закат на пляже, собака в парке или красивый торт, и система найдет все подходящие изображения в вашей коллекции.</p>
                  </div>
                </div>

                <div className={styles.modalFeature}>
                  <div className={styles.modalFeatureIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <circle cx="12" cy="16" r="1" fill="currentColor"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>
                  <div className={styles.modalFeatureContent}>
                    <h3>Безопасное хранение</h3>
                    <p>Ваши фотографии надежно защищены современным шифрованием. Автоматическое резервное копирование, синхронизация между устройствами и возможность восстановления удаленных файлов в течение 30 дней.</p>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <div className={styles.modalCTA}>
                  <h3>Готовы начать?</h3>
                  <p>Присоединяйтесь к сообществу фотографов и делитесь своими лучшими моментами</p>
                  <Link href="/photos" className={styles.modalButton} onClick={closeModal}>
                    Открыть галерею
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
