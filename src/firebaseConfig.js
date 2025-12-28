import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDChPgikPa0UMPcSm8ebMGlAcv6WRCf9Fo",
    authDomain: "autoprom-84fe0.firebaseapp.com",
    projectId: "autoprom-84fe0",
    storageBucket: "autoprom-84fe0.firebasestorage.app",
    messagingSenderId: "1025233072686",
    appId: "1:1025233072686:web:9706461ff307700409a5bf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
