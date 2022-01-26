const {
  getAuth: FBAuthGetAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} = require('firebase/auth');
const { doc, setDoc, getDoc } = require('firebase/firestore');
const { db } = require('../../utils/admin');
const {
  validateSignupData,
  validateLoginData,
} = require('../../utils/validators');
const { firebaseConfig } = require('../../config/config');

exports.signUp = async (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  const { valid, errors } = validateSignupData(newUser);
  if (!valid) return res.status(400).json(errors);
  const noImg = 'no-img.jpg';
  const userDocRef = doc(db, 'users', `${newUser.handle}`);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    return res.status(400).json({ handle: 'this handle is already taken' });
  } else {
    try {
      const auth = FBAuthGetAuth();
      const userCredentials = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );
      const token = await userCredentials.user.getIdToken();

      await setDoc(userDocRef, {
        handle: newUser.handle,
        email: userCredentials.user.email,
        userId: userCredentials.user.uid,
        imgUrl: `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${noImg}?alt=media`,
        createdAt: new Date().toISOString(),
      });
      return res.status(201).json({ token });
    } catch (error) {
      res
        .status(500)
        .json({ general: 'Something went wrong, please try again' });
      console.err(error);
    }
  }
};

exports.login = async (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };
  const { valid, errors } = validateLoginData(user);
  if (!valid) return res.status(400).json(errors);

  try {
    const auth = FBAuthGetAuth();
    const userCredentials = await signInWithEmailAndPassword(
      auth,
      user.email,
      user.password
    );
    const token = await userCredentials.user.getIdToken();
    return res.json({ token });
  } catch (error) {
    if (error.code === 'auth/wrong-password') {
      return res
        .status(403)
        .json({ general: 'Wrong credentials, please try again.' });
    } else {
      console.error(error);
      return res.status(500).json(`erorr: ${error.code}`);
    }
  }
};
