import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD7kXY4m54klYKwxWggBZrg3StculVM9KE",
  authDomain: "money-b149a.firebaseapp.com",
  databaseURL: "https://money-b149a-default-rtdb.firebaseio.com",
  projectId: "money-b149a",
  storageBucket: "money-b149a.firebasestorage.app",
  messagingSenderId: "718220656453",
  appId: "1:718220656453:web:c53827433834f8f835c82c",
  measurementId: "G-QZX1TWH355"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);