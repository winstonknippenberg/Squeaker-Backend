const { getAuth } = require('firebase-admin/auth');
const { db } = require('../utils/admin');
const {
  collection,
  getDocs,
  query,
  where,
  limit,
} = require('firebase/firestore');

const FBauth = async (req, res, next) => {
  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else {
    console.error('No token found');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decodedUserInfo = await getAuth().verifyIdToken(idToken);
    const userIdQuery = query(
      collection(db, 'users'),
      where('userId', '==', decodedUserInfo.uid),
      limit(1)
    );
    const userDocs = await getDocs(userIdQuery);
    userDocs.forEach((doc) => {
      if (doc.data()) {
        req.user = doc.data();
      }
    });
    next();
  } catch (error) {
    console.error({ error });
    return res.status(403).json({ error: 'Cannot verify user' });
  }
};

module.exports = { FBauth };
