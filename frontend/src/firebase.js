import { initializeApp } from "firebase/app";
import { 
  getAuth,
  setPersistence,
  browserSessionPersistence,
  signInWithRedirect,
  getRedirectResult,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword as firebaseEmailSignIn,
  createUserWithEmailAndPassword as firebaseEmailSignUp,
  signOut
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

setPersistence(auth, browserSessionPersistence)
  .catch((error) => {
    console.error("Persistence error:", error);
  });

export const db = getFirestore(app);
export const checkRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    return result?.user;
  } catch (error) {
    console.error("Redirect result error:", error);
    return null;
  }
};

// Google провайдер
const googleProvider = new GoogleAuthProvider();

// Яндекс провайдер
const yandexProvider = new OAuthProvider('yandex.com');

// Функции авторизации
export const signInWithGoogle = async (forceRedirect = false) => {
  try {
    
    const isLocalhost = window.location.hostname === "localhost" || 
                        window.location.hostname === "127.0.0.1";
    
    if (!isLocalhost || forceRedirect) {
      await signInWithRedirect(auth, googleProvider);
      return "redirect_started";
    } else {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    }
  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error("Окно авторизации закрыто. Пожалуйста, попробуйте снова.");
    } else {
      console.error("Google Sign-In Error:", error);
      throw new Error("Ошибка авторизации. Попробуйте другой метод.");
    }
  }
};

export const signInWithYandex = async () => {
  try {
    const result = await signInWithPopup(auth, yandexProvider);
    return result.user;
  } catch (error) {
    console.error("Yandex Sign-In Error:", error);
    throw error;
  }
};

export const loginWithEmail = (email, password) => {
  return firebaseEmailSignIn(auth, email, password);
};

export const registerWithEmail = (email, password) => {
  return firebaseEmailSignUp(auth, email, password);
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign Out Error:", error);
    throw error;
  }
};