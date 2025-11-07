import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAm1694WcEN2kwFY-eY6Ccnunhg-BgmPFI",
  authDomain: "exammaster-1f880.firebaseapp.com",
  projectId: "exammaster-1f880",
  storageBucket: "exammaster-1f880.firebasestorage.app",
  messagingSenderId: "551416427657",
  appId: "1:551416427657:web:f1b9a9ba6b7839945c8258",
  measurementId: "G-LT7Q16D2MZ"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const firestore = getFirestore(app);

export { app, firestore };