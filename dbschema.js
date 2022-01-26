let db = {
  squeaks: [
    {
      userHandle: 'user',
      body: 'this is the squeak body',
      createdAt: '2021-11-04T16:50:32.847Z',
      likeCount: 5,
      commentCount: 2,
    },
  ],
  likes: [
    {
      userHandle: 'user',
      squeakId: '6y01zFTTY8dZYu3hM8Vz',
    },
    {
      userHandle: 'user',
      squeakId: 'KzJkFSL7RLYtHAp0DZOO',
    },
  ],
  comments: [
    {
      userHandle: 'user',
      squeakId: '6y01zFTTY8dZYu3hM8Vz',
      body: 'good one!',
      createdAt: '2021-11-20T14:10:47.321Z',
    },
  ],
  notifications: [
    {
      recipient: 'user',
      sender: 'John',
      read: 'true | false',
      squeakId: '6y01zFTTY8dZYu3hM8Vz',
      type: 'like | comment',
      createdAt: '2021-11-20T14:10:47.321Z',
    },
  ],
};

const userDetails = {
  credentails: {
    userId: '75yQZ0pSRmTTK201YqXRwNE0pVr2',
    email: 'ben@gmail.com',
    handle: 'ben',
    createdAt: '2021-11-20T14:10:47.321Z',
    imgUrl:
      'https://firebasestorage.googleapis.com/v0/b/squeaker-app.appspot.com/o/11446406.jpeg?alt=media',
    bio: "hello I'm Ben",
    website: 'ben@gmail.com',
    location: 'Israel',
  },
};
