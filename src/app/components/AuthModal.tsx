'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './AuthModal.module.css';
import { HiXMark, HiEye, HiEyeSlash } from 'react-icons/hi2';
import { MdEmail, MdLock, MdPerson } from 'react-icons/md';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.email, formData.password, formData.name);
      }

      if (result.success) {
        onClose();
        setFormData({ email: '', password: '', name: '' });
      } else {
        setError(result.error || 'Произошла ошибка');
      }
    } catch {
      setError('Произошла ошибка при выполнении запроса');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ email: '', password: '', name: '' });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <HiXMark />
        </button>

        <div className={styles.header}>
          <h2 className={styles.title}>
            {isLogin ? 'Вход в аккаунт' : 'Создать аккаунт'}
          </h2>
          <p className={styles.subtitle}>
            {isLogin 
              ? 'Добро пожаловать обратно! Войдите в свой аккаунт' 
              : 'Присоединяйтесь к PhotoVerse и делитесь своими моментами'
            }
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {!isLogin && (
            <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                <MdPerson className={styles.inputIcon} />
                <input
                  type="text"
                  name="name"
                  placeholder="Ваше имя"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                />
              </div>
            </div>
          )}

          <div className={styles.inputGroup}>
            <div className={styles.inputWrapper}>
              <MdEmail className={styles.inputIcon} />
              <input
                type="email"
                name="email"
                placeholder="Email адрес"
                value={formData.email}
                onChange={handleInputChange}
                className={styles.input}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.inputWrapper}>
              <MdLock className={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Пароль"
                value={formData.password}
                onChange={handleInputChange}
                className={styles.input}
                required
                minLength={6}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <HiEyeSlash /> : <HiEye />}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className={styles.loading}>
                <span className={styles.spinner}></span>
                Загрузка...
              </span>
            ) : (
              isLogin ? 'Войти' : 'Зарегистрироваться'
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.switchText}>
            {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
            <button 
              type="button" 
              className={styles.switchButton}
              onClick={switchMode}
            >
              {isLogin ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
