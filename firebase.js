import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyB58mgBHg0SvgSkvUHV44YHi7ZZ9gOHmbo",
    authDomain: "uno-221ea.firebaseapp.com",
    databaseURL: "https://uno-221ea-default-rtdb.firebaseio.com",
    projectId: "uno-221ea",
    storageBucket: "uno-221ea.firebasestorage.app",
    messagingSenderId: "63182321440",
    appId: "1:63182321440:web:90ce1d94df0514b7038945",
    measurementId: "G-6QNZLERLZE"
};


const app = initializeApp(firebaseConfig);


export const db = getDatabase(app);



