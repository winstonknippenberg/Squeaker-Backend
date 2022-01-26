const functions = require('firebase-functions');
const { signUp, login } = require('./handlers/users/signOrLog');
const {
  uploadImage,
  addUserDetailes,
  markNotificationsRead,
} = require('./handlers/users/updateUserInfo');
const {
  getAuthenticatedUser,
  getUserDetails,
} = require('./handlers/users/getUserDetails');
const {
  getAllSqueaks,
  postOneSqueak,
  getSqueak,
  commentOnSqueak,
  likeSqueak,
  unlikeSqueak,
  deleteSqueak,
} = require('./handlers/squeaks/squeaks');
const express = require('express');
const { FBauth } = require('./utils/fbAuth');
const { db } = require('./utils/admin');
const {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  writeBatch,
  collection,
  query,
  where,
  getDocs,
} = require('firebase/firestore');
const app = express();

//squeaks routes
app.get('/squeaks', getAllSqueaks);
app.get('/squeak/:squeakId', getSqueak);

//user routes
app.post('/signup', signUp);
app.post('/login', login);
app.get('/user/:handle', getUserDetails);

//an example on how to model and create routes

// const routes = [
//   {
//     path: 'squeak',
//     method: 'post',
//     protected: true,
//     handler: () => {

//     }
//   },
//   {
//     path: 'squeak',
//     method: 'post',
//     protected: true,

//   }
// ]

// const createProtectedRoute = (appInstance, path, handler, method, protected) => {
//   appInstance[method](`/${path}`, protected ? FBauth : undefined, handler)
// }

createProtectedRoute(app, '/squeak', postOneSqueak, 'post');

// protected routes
app.post('/squeak', FBauth, postOneSqueak);
app.post('/user/image', FBauth, uploadImage);
app.post('/user', FBauth, addUserDetailes);
app.get('/user', FBauth, getAuthenticatedUser);
app.post('/notifications', FBauth, markNotificationsRead);
app.post('/squeak/:squeakId/comment', FBauth, commentOnSqueak);
app.get('/squeak/:squeakId/like', FBauth, likeSqueak);
app.get('/squeak/:squeakId/unlike', FBauth, unlikeSqueak);
app.delete('/squeak/:squeakId', FBauth, deleteSqueak);

exports.api = functions.region('europe-central2').https.onRequest(app);

exports.createNotificationOnLike = functions
  .region('europe-central2')
  .firestore.document('likes/{id}')
  .onCreate(async (snapshot) => {
    try {
      const squeakDocRef = doc(db, 'squeaks', `${snapshot.data().squeakId}`);
      const squeak = await getDoc(squeakDocRef);
      if (
        squeak.exists() &&
        squeak.data().userHandle !== snapshot.data().userHandle
      ) {
        await setDoc(doc(db, 'notifications', snapshot.id), {
          createdAt: new Date().toISOString(),
          recipient: squeak.data().userHandle,
          sender: snapshot.data().userHandle,
          type: 'like',
          read: false,
          squeakId: squeak.id,
        });
      }
    } catch (error) {
      console.error(error);
    }
  });
exports.deleteNotificationOnUnlike = functions
  .region('europe-central2')
  .firestore.document('likes/{id}')
  .onDelete(async (snapshot) => {
    try {
      const docRef = doc(db, 'notifications', snapshot.id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(error);
    }
  });

exports.createNotificationOnComment = functions
  .region('europe-central2')
  .firestore.document('comments/{id}')
  .onCreate(async (snapshot) => {
    try {
      const squeakDocRef = doc(db, 'squeaks', `${snapshot.data().squeakId}`);
      const squeak = await getDoc(squeakDocRef);
      if (
        squeak.exists() &&
        squeak.data().userHandle !== snapshot.data().userHandle
      ) {
        await setDoc(doc(db, 'notifications', snapshot.id), {
          createdAt: new Date().toISOString(),
          recipient: squeak.data().userHandle,
          sender: snapshot.data().userHandle,
          type: 'comment',
          read: false,
          squeakId: squeak.id,
        });
      }
    } catch (error) {
      console.error(error);
    }
  });

exports.onUserImageChange = functions
  .region('europe-central2')
  .firestore.document('/users/{userId}')
  .onUpdate(async (change) => {
    if (change.before.data().imgUrl !== change.after.data().handle) {
      const batch = writeBatch(db);
      const squeaksBeforeImgChangeQuery = query(
        collection(db, 'squeaks'),
        where('userHandle', '==', change.before.data().handle)
      );
      const squeaks = await getDocs(squeaksBeforeImgChangeQuery);
      squeaks.forEach((squeak) => {
        const squeakDocRef = doc(db, 'squeaks', squeak.id);
        batch.update(squeakDocRef, { userImg: change.after.data().imgUrl });
      });
      await batch.commit();
    }
  });

exports.onSqueakDelete = functions
  .region('europe-central2')
  .firestore.document('/squeaks/{squeakId}')
  .onDelete(async (snapshot, context) => {
    const squeakId = context.params.squeakId;
    const batch = writeBatch(db);

    const likesQuery = query(
      collection(db, 'likes'),
      where('squeakId', '==', squeakId)
    );
    const likes = await getDocs(likesQuery);
    likes.forEach((like) => {
      const likeDocRef = doc(db, 'likes', like.id);
      batch.delete(likeDocRef);
    });

    const commentsQuery = query(
      collection(db, 'comments'),
      where('squeakId', '==', squeakId)
    );
    const comments = await getDocs(commentsQuery);
    comments.forEach((comment) => {
      const commentDocRef = doc(db, 'comments', comment.id);
      batch.delete(commentDocRef);
    });

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('squeakId', '==', squeakId)
    );
    const notifications = await getDocs(notificationsQuery);
    notifications.forEach((notification) => {
      const notificationDocRef = doc(db, 'notifications', notification.id);
      batch.delete(notificationDocRef);
    });

    batch.commit();
  });
