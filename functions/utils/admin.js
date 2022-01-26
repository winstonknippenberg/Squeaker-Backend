const { initializeApp } = require('firebase/app');
const { initializeApp: FBAdminInitApp } = require('firebase-admin/app');
const { firebaseConfig } = require('../config/config');
const { getFirestore } = require('firebase/firestore');
const { getStorage } = require('firebase-admin/storage');

const firebaseApp = initializeApp(firebaseConfig);
const firebaseAdminApp = FBAdminInitApp(firebaseConfig);
const db = getFirestore();
const storageBucket = getStorage().bucket();

module.exports = {
  firebaseAdminApp,
  firebaseApp,
  db,
  storageBucket,
};
