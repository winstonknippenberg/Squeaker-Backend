const { doc, updateDoc, writeBatch } = require('firebase/firestore');
const { db, storageBucket } = require('../../utils/admin');
const { reduceUserDetails } = require('../../utils/validators');
const { firebaseConfig } = require('../../config/config');

exports.addUserDetailes = async (req, res) => {
  let userDetails = reduceUserDetails(req.body);
  try {
    const userDocRef = doc(db, 'users', `${req.user.handle}`);
    await updateDoc(userDocRef, userDetails);
    return res.json({ message: 'Details added successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: `${error.code}` });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    const batch = writeBatch(db);
    req.body.forEach((notificationId) => {
      const notificationDocRef = doc(db, 'notifications', notificationId);
      batch.update(notificationDocRef, { read: true });
    });
    await batch.commit();
    return res.json({ message: 'Notifications marked read' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: `${error.code}` });
  }
};

exports.uploadImage = (req, res) => {
  const BusBoy = require('busboy');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');

  const busboy = new BusBoy({ headers: req.headers });
  let imgFileName;
  let imgToBeUploaded = {};

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    const imgExtension = filename.split('.')[filename.split('.').length - 1];
    imgFileName = `${Math.round(Math.random() * 100000000)}.${imgExtension}`;
    const filepath = path.join(os.tmpdir(), imgFileName);
    imgToBeUploaded = { filepath, mimetype };

    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on('finish', async () => {
    try {
      await storageBucket.upload(imgToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imgToBeUploaded.mimetype,
          },
        },
      });
      const imgUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imgFileName}?alt=media`;
      const userDocRef = doc(db, 'users', `${req.user.handle}`);
      await updateDoc(userDocRef, { imgUrl });
      return res.json({ message: 'Image uploaded successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: `${error.code}` });
    }
  });
  busboy.end(req.rawBody);
};
