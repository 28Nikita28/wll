import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  signInWithGoogle, 
  signInWithYandex,
  signOutUser,
  loginWithEmail,
  registerWithEmail
} from '../firebase';
import { Google, Email, Person } from '@mui/icons-material';

// Иконка Яндекса
const YandexIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.04 12C2.04 17.57 6.53 22 12.06 22C17.59 22 22.08 17.57 22.08 12C22.08 6.43 17.59 2 12.06 2C6.53 2 2.04 6.43 2.04 12ZM12.06 4.87C16.15 4.87 19.36 8.11 19.36 12C19.36 15.89 16.15 19.13 12.06 19.13C7.97 19.13 4.76 15.89 4.76 12C4.76 8.11 7.97 4.87 12.06 4.87ZM10.46 16.24V7.76H13.67C15.39 7.76 16.62 8.67 16.62 10.3C16.62 11.27 16.15 11.94 15.3 12.39C16.25 12.76 16.82 13.42 16.82 14.5C16.82 16.29 15.54 17.24 13.67 17.24H10.46ZM12.26 9.91V11.78H13.21C13.92 11.78 14.42 11.48 14.42 10.75C14.42 10.02 13.92 9.91 13.21 9.91H12.26ZM12.26 12.77V14.64H13.41C14.12 14.64 14.62 14.34 14.62 13.61C14.62 12.88 14.12 12.77 13.41 12.77H12.26Z" fill="currentColor"/>
  </svg>
);

const AuthButton = ({ user }) => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  // Добавляем состояние для ошибок авторизации
  const [authError, setAuthError] = useState(null);

  const handleGoogleSignIn = async () => {
  setAuthError(null);
  try {
    // Определяем среду выполнения
    const isDockerEnv = window.location.hostname !== "localhost" && 
                       window.location.hostname !== "127.0.0.1";
    
    console.log("Google sign-in in Docker:", isDockerEnv);
    
    // Для Docker всегда используем редирект
    const result = await signInWithGoogle(isDockerEnv);
    
    if (result === "redirect_started") {
      setAuthError("Перенаправление на страницу авторизации...");
    }
  } catch (error) {
    console.error("Google sign-in error:", error);
    setAuthError(error.message);
    
    if (error.code === 'auth/popup-closed-by-user') {
      // Попробуем редирект как fallback
      try {
        await signInWithGoogle(true);
      } catch (redirectError) {
        console.error("Redirect fallback error:", redirectError);
      }
    }
  }
};

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await loginWithEmail(email, password);
      setShowEmailForm(false);
    } catch (err) {
      setError('Неверный email или пароль');
      console.error('Ошибка входа:', err);
    }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await registerWithEmail(email, password);
      setShowEmailForm(false);
    } catch (err) {
      setError('Ошибка регистрации: ' + err.message);
      console.error('Ошибка регистрации:', err);
    }
  };

  const handleChangeUser = () => {
    signOutUser();
    setShowEmailForm(false);
  };

  return (
    <div className="auth-button-container" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      gap: '10px',
      width: '100%'
    }}>
      {user ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <motion.button
            className="user-info-button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'default'
            }}
          >
            <img 
              src={user.photoURL || '/default-avatar.png'} 
              alt={user.displayName || 'Пользователь'} 
              className="user-avatar"
              style={{ width: 32, height: 32, borderRadius: '50%' }}
            />
            <span style={{ fontWeight: 500 }}>{user.displayName || user.email}</span>
          </motion.button>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <motion.button
              className="change-user-button"
              onClick={handleChangeUser}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ 
                padding: '8px 16px',
                background: '#f0f0f0',
                border: 'none',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Person style={{ marginRight: '8px', fontSize: '1rem' }} />
              Сменить
            </motion.button>
            
            <motion.button
              className="sign-out-button"
              onClick={signOutUser}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ 
                padding: '8px 16px',
                background: '#ff6b6b',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              Выйти
            </motion.button>
          </div>
        </div>
      ) : showEmailForm ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="email-auth-form"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%',
            maxWidth: '300px'
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          
          {error && <div style={{ color: 'red', fontSize: '0.8rem' }}>{error}</div>}
          
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <motion.button
              onClick={isRegistering ? handleEmailRegister : handleEmailLogin}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ 
                padding: '8px 16px',
                background: isRegistering ? '#4caf50' : '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              {isRegistering ? 'Зарегистрироваться' : 'Войти'}
            </motion.button>
            
            <motion.button
              onClick={() => setIsRegistering(!isRegistering)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ 
                padding: '8px 16px',
                background: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              {isRegistering ? 'Есть аккаунт?' : 'Регистрация'}
            </motion.button>
          </div>
          
          <motion.button
            onClick={() => setShowEmailForm(false)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ 
              padding: '8px',
              background: 'transparent',
              color: '#666',
              border: 'none',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ← Назад к выбору входа
          </motion.button>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', width: '100%' }}>
          <motion.button
            className="google-signin-button"
            onClick={handleGoogleSignIn}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 20px',
              background: '#4285F4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              width: '100%',
              maxWidth: '280px'
            }}
          >
            <Google style={{ marginRight: '12px', fontSize: '1.2rem' }} />
            <span>Войти через Google</span>
          </motion.button>

          {authError && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              {authError}
            </div>
          )}
          
          <motion.button
            className="yandex-signin-button"
            onClick={signInWithYandex}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 20px',
              background: '#FF0000',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              width: '100%',
              maxWidth: '280px'
            }}
          >
            <span style={{ marginRight: '12px', display: 'flex', alignItems: 'center' }}>
              <YandexIcon />
            </span>
            <span>Войти через Яндекс</span>
          </motion.button>
          
          <motion.button
            className="email-signin-button"
            onClick={() => setShowEmailForm(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 20px',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '100%',
              maxWidth: '280px'
            }}
          >
            <Email style={{ marginRight: '12px', color: '#555', fontSize: '1.2rem' }} />
            <span>Войти по почте</span>
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default AuthButton;