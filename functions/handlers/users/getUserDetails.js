const {
  doc,
  collection,
  getDocs,
  query,
  getDoc,
  updateDoc,
  where,
  limit,
  orderBy,
} = require('firebase/firestore');
const { db, storageBucket } = require('../../utils/admin');
const { reduceUserDetails } = require('../../utils/validators');
const { firebaseConfig } = require('../../config/config');
const { user } = require('firebase-functions/v1/auth');

exports.getAuthenticatedUser = async (req, res) => {
  let userData = {};
  try {
    const userDocRef = doc(db, 'users', `${req.user.handle}`);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      userData.credentials = userDoc.data();
      const likesCollection = collection(db, 'likes');
      const likesForUserQuery = query(
        likesCollection,
        where('userHandle', '==', req.user.handle)
      );
      const likesForUser = await getDocs(likesForUserQuery);
      userData.likes = [];
      likesForUser.forEach((doc) => {
        userData.likes.push(doc.data());
      });
      const notificationsForUserQuery = query(
        collection(db, 'notifications'),
        where('recipient', '==', req.user.handle),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const notificationsForUser = await getDocs(notificationsForUserQuery);

      userData.notifications = [];
      notificationsForUser.forEach((notification) => {
        userData.notifications.push({
          recipient: notification.data().recipient,
          sender: notification.data().sender,
          createdAt: notification.data().createdAt,
          squeakId: notification.data().squeakId,
          type: notification.data().type,
          read: notification.data().read,
          notificationId: notification.id,
        });
      });
      return res.json(userData);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: `${error.code}` });
  }
};

exports.getUserDetails = async (req, res) => {
  let userData = {};
  try {
    const userDocRef = doc(db, 'users', `${req.params.handle}`);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      userData.user = userDoc.data();
      const userSqueaksQuery = query(
        collection(db, 'squeaks'),
        where('userHandle', '==', req.params.handle),
        orderBy('createdAt', 'desc')
      );
      const userSqueaks = await getDocs(userSqueaksQuery);
      userData.squeaks = [];
      userSqueaks.forEach((squeak) => {
        userData.squeaks.push({
          body: squeak.data().body,
          createdAt: squeak.data().createdAt,
          userHandle: squeak.data().userHandle,
          userImg: squeak.data().userImg,
          likeCount: squeak.data().likeCount,
          commentCount: squeak.data().commentCount,
          squeakId: squeak.id,
        });
      });
      return res.json(userData);
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: `${error.code}` });
  }
};
