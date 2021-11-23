import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore/lite';
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from 'firebase/database';

import { firebaseConfig } from './config';
import 'firebase/firestore';


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const firestore = getFirestore(app)
export const db = getDatabase(app);
