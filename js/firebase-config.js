
// Import the functions you need from the SDKs you need
 

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC1Sd3mCmy7lUpICd5hA6tN4xjOgDPYglM",
  authDomain: "tibcon-s.firebaseapp.com",
  projectId: "tibcon-s",
  storageBucket: "tibcon-s.firebasestorage.app",
  messagingSenderId: "689824580603",
  appId: "1:689824580603:web:a0efd85d328a27c669c15e"
};

// 2. ADIM: Firebase uygulamasını başlatır.
// Bu komut, HTML'de yüklenen global 'firebase' objesini kullanır.
firebase.initializeApp(firebaseConfig);

// 3. ADIM: Firestore veritabanı servisini başlatır ve 'db' değişkenini oluşturur.
// Bu 'db' değişkeni, diğer script dosyaları (app.js, siparisler.js) tarafından kullanılacaktır.
const db = firebase.firestore();
