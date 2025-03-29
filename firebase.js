// firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth } from 'firebase/auth';

// Configuration Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "mindful-material-master.firebaseapp.com",
  projectId: "mindful-material-master",
  storageBucket: "mindful-material-master.appspot.com",
  messagingSenderId: "496636424362",
  appId: "1:496636424362:web:6f1b7ebbf37aed355820d3",
  measurementId: "G-KEX7YST6C5"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);
const auth = getAuth(app);

// Exemple d'utilisation de analytics
logEvent(analytics, 'page_view');

// Exportez les services que vous utilisez
export { app, analytics, database, auth };
