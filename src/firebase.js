import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDrJcGnLmOSgZSPUaAgdBTQALUyeD5ZCZc",
  authDomain: "aeo-test-73e06.firebaseapp.com",
  projectId: "aeo-test-73e06",
  storageBucket: "aeo-test-73e06.firebasestorage.app",
  messagingSenderId: "711045599204",
  appId: "1:711045599204:web:99f289d5f4341eab7101f1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);