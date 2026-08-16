const firebaseConfig = {
  apiKey: "AIzaSyBiHbADPPYAOLzRzaCCfvTFKpe89clPHsI",
  authDomain: "rps-online-5e3d5.firebaseapp.com",
  databaseURL: "https://rps-online-5e3d5-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "rps-online-5e3d5",
  storageBucket: "rps-online-5e3d5.firebasestorage.app",
  messagingSenderId: "173039684242",
  appId: "1:173039684242:web:c3c00e53493d696fa9b44b"
};

firebase.initializeApp(firebaseConfig);

const database = firebase.database();

console.log("🔥 Firebase connected");
