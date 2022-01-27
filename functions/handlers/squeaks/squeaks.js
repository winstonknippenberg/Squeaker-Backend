const { db } = require('../../utils/admin');
const {
  doc,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  getDoc,
  where,
  limit,
  updateDoc,
  deleteDoc,
} = require('firebase/firestore');

const squeaksCollection = collection(db, 'squeaks');
const commentsCollection = collection(db, 'comments');

const getAllSqueaks = async (req, res) => {
  try {
    const squeaksQuery = query(squeaksCollection, orderBy('createdAt', 'desc'));
    const squeaksDocs = await getDocs(squeaksQuery);
    let squeaks = [];
    squeaksDocs.forEach((squeak) => {
      const { data, id: squeakId } = squeak;
      const {
        body,
        userHandle,
        createdAt,
        commentCount,
        likeCount,
        userImg,
        comments,
      } = data();
      squeaks.push({
        squeakId,
        body,
        userHandle,
        createdAt,
        commentCount,
        likeCount,
        userImg,
        comments,
      });
    });
    return res.json(squeaks);
  } catch (error) {
    res.status(500).json(error);
    console.error(error);
    return;
  }
};

const postOneSqueak = async (req, res) => {
  const newSqueakObject = {
    body: req.body.body,
    userHandle: req.user.handle,
    userImg: req.user.imgUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
  };
  try {
    const newSqeak = await addDoc(squeaksCollection, newSqueakObject);
    const squeakDoc = await getDoc(newSqeak);
    const squeakData = squeakDoc.data();
    squeakData.squeakId = newSqeak.id;
    return res.json(squeakData);
  } catch (error) {
    res.status(500).json(error);
    console.error(error);
    return;
  }
};

const getSqueak = async (req, res) => {
  let squeakData = {};
  try {
    const squeakDocRef = doc(db, 'squeaks', `${req.params.squeakId}`);
    const squeakDoc = await getDoc(squeakDocRef);
    if (!squeakDoc.exists()) {
      return res.status(404).json({ error: 'Squeak not found' });
    }
    squeakData = squeakDoc.data();
    squeakData.squeakId = squeakDoc.id;
    const commentsForSqueakQuery = query(
      commentsCollection,
      where('squeakId', '==', req.params.squeakId),
      orderBy('createdAt', 'desc')
    );
    const commentsForSqueak = await getDocs(commentsForSqueakQuery);
    squeakData.comments = [];
    commentsForSqueak.forEach((comment) => {
      squeakData.comments.push(comment.data());
    });
    return res.json(squeakData);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
};

const commentOnSqueak = async (req, res) => {
  if (req.body.body.trim === '')
    return res.status(400).json({ error: 'must not be empty' });

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    squeakId: req.params.squeakId,
    userHandle: req.user.handle,
    userImg: req.user.imgUrl,
  };
  try {
    const squeakDocRef = doc(db, 'squeaks', `${req.params.squeakId}`);
    const squeakToComment = await getDoc(squeakDocRef);
    if (!squeakToComment.exists()) {
      res.status(404).json({ error: 'squeak not found' });
    }
    await updateDoc(squeakDocRef, {
      commentCount: squeakToComment.data().commentCount + 1,
    });
    const newAddedComment = await addDoc(commentsCollection, newComment);
    const newCommentDoc = await getDoc(newAddedComment);
    return res.json(newCommentDoc.data());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'something went wrong' });
  }
};

const likeSqueak = async (req, res) => {
  const likesForSqueakQuery = query(
    collection(db, 'likes'),
    where('userHandle', '==', req.user.handle),
    where('squeakId', '==', req.params.squeakId),
    limit(1)
  );
  try {
    const squeakDocRef = doc(db, 'squeaks', `${req.params.squeakId}`);
    let squeakData = {};
    const squeakTolike = await getDoc(squeakDocRef);

    if (squeakTolike.exists()) {
      squeakData = squeakTolike.data();
      squeakData.squeakId = squeakTolike.id;
      const likeDocument = await getDocs(likesForSqueakQuery);
      if (likeDocument.empty) {
        await addDoc(collection(db, 'likes'), {
          squeakId: req.params.squeakId,
          userHandle: req.user.handle,
        });
        squeakData.likeCount++;
        await updateDoc(squeakDocRef, {
          likeCount: squeakData.likeCount,
        });

        const commentsForSqueakQuery = query(
          commentsCollection,
          where('squeakId', '==', req.params.squeakId),
          orderBy('createdAt', 'desc')
        );
        const commentsForSqueak = await getDocs(commentsForSqueakQuery);
        squeakData.comments = [];
        commentsForSqueak.forEach((comment) => {
          squeakData.comments.push(comment.data());
        });

        return res.json(squeakData);
      } else {
        return res.status(400).json({ error: 'squeak already liked' });
      }
    } else {
      return res.status(404).json({ error: 'squeak not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.code });
  }
};
const unlikeSqueak = async (req, res) => {
  const likeForSqueakQuery = query(
    collection(db, 'likes'),
    where('userHandle', '==', req.user.handle),
    where('squeakId', '==', req.params.squeakId),
    limit(1)
  );
  try {
    const squeakDocRef = doc(db, 'squeaks', `${req.params.squeakId}`);
    let squeakData = {};
    const squeakToUnlike = await getDoc(squeakDocRef);

    if (squeakToUnlike.exists()) {
      squeakData = squeakToUnlike.data();
      squeakData.squeakId = squeakToUnlike.id;
      const likedDocument = await getDocs(likeForSqueakQuery);
      if (likedDocument.empty) {
        return res.status(400).json({ error: 'squeak not liked' });
      } else {
        await deleteDoc(doc(db, 'likes', likedDocument.docs[0].id));

        squeakData.likeCount--;

        await updateDoc(squeakDocRef, {
          likeCount: squeakData.likeCount,
        });
        const commentsForSqueakQuery = query(
          commentsCollection,
          where('squeakId', '==', req.params.squeakId),
          orderBy('createdAt', 'desc')
        );
        const commentsForSqueak = await getDocs(commentsForSqueakQuery);
        squeakData.comments = [];
        commentsForSqueak.forEach((comment) => {
          squeakData.comments.push(comment.data());
        });
        return res.json(squeakData);
      }
    } else {
      return res.status(404).json({ error: 'squeak not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.code });
  }
};

const deleteSqueak = async (req, res) => {
  const squeakDocRef = doc(db, 'squeaks', `${req.params.squeakId}`);
  try {
    const squeak = await getDoc(squeakDocRef);
    if (!squeak.exists()) {
      return res.status(404).json({ error: 'squeak not found' });
    }
    if (squeak.data().userHandle !== req.user.handle) {
      return res.status(403).json({ error: 'unaouthorized' });
    } else {
      await deleteDoc(doc(db, 'squeaks', squeak.id));
      return res.json({ message: 'squeak deleted successfully' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.code });
  }
};
module.exports = {
  getAllSqueaks,
  postOneSqueak,
  getSqueak,
  commentOnSqueak,
  likeSqueak,
  unlikeSqueak,
  deleteSqueak,
};
