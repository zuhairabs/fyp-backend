const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../../../models/entities/user-schema');
const Notification = require('../../../models/operations/notification-schema');
const authentication = require('../../../controllers/authentication');
const handleError = require('../../../error_handling/handler');
const { dispatchSingleNotification } = require('../../../utils/notification-dispatcher');
const saveNewNotification = require('../../../utils/notification-constructor');
const verification = require('./verification');
const { customAlphabet } = require('nanoid');
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

router.use('/verify', verification);
/* ******************************************
 *  APPLICATION ACTIONS
 */
router.post('/reset/password', async (req, res) => {
  try {
    const { cred } = req.body;
    if (!cred) {
      return res.status(400).json('Invalid request format.');
    }

    const hashedPassword = await bcrypt.hash(cred.password, 12);

    await User.findOneAndUpdate(
      { phone: cred.phone },
      { password: hashedPassword }
    );

    return res.status(200).json({ response: 'Success' });
  } catch (error) {
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { cred } = req.body;

    if (!cred) {
      return res.status(400).json({ error: 'Invalid request format.' });
    }
    const generatedKey = authentication.secureJWT(cred.phone, 'user');

    const user = await User.findOneAndUpdate(
      { phone: cred.phone },
      { _signingKey: generatedKey.key, firebaseToken: cred.firebaseToken, deviceToken: ((cred.deviceToken) ? (cred.deviceToken) : null) }
    )
      .populate({
        path: 'notifications',
        populate: {
          path: 'store',
          select: 'name _id',
          populate: { path: 'business', select: 'name title_image' },
        },
        options: {
          limit: 15,
          sort: { generatedTime: -1 },
        },
      })
      .select(
        'firstName lastName firstTimeLogin phone notifications favouriteStores email avatar password'
      );

    if (!user) {
      handleError('Phone number not registered');
      return res.status(404).json({ error: 'Phone number not registered' });
    }

    const match = await bcrypt.compare(cred.password, user.password);

    if (!match) {
      handleError('Invalid password');
      return res.status(404).json({ error: 'Invalid password' });
    }

    return res.status(200).json({
      token: generatedKey.token,
      user,
    });
  } catch (error) {
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// delete tokens on logout
router.post('/logout', async (req, res) => {
  try {
    const { cred } = req.body;

    if (!cred) {
      return res.status(400).json({
        error: 'Invalid request format.',
      });
    }
    const user = await User.findOneAndUpdate(
      { phone: cred.phone },
      {
        _signingKey: '',
        firebaseToken: '',
        deviceToken: '',
      }
    );

    if (!user) {
      return res.status(500).json({
        error: 'Server error',
      });
    }

    return res.status(200).json({
      response: 'Successfully logged out',
    });
  } catch (error) {
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/signup', async (req, res) => {
  try {
    var { userData } = req.body;

    if (!userData) {
      res.status(400).json({
        error: 'Invalid request format.',
      });
    }
    console.log(userData);

    const refCode = customAlphabet(alphabet, 7);
    var referralCode = refCode();

    const hashedPassword = await bcrypt.hash(userData.password, 12);
    userData.referral = referralCode;
    userData.password = hashedPassword;

    const savedUser = await User.create(userData);

    const generatedKey = authentication.secureJWT(savedUser.phone, 'user');
    const signUpNotification = await Notification.create({
      text: 'Complete your profile today!',
      title: 'Welcome to your new ShopOut account',
      user: savedUser._id,
    });

    const userWithNotifications = await User.findOneAndUpdate(
      { phone: savedUser.phone },
      {
        _signingKey: generatedKey.key,
        $push: {
          notifications: signUpNotification,
        },
        firebaseToken: userData.firebaseToken,
        deviceToken: userData.deviceToken,
      },
      {
        new: true,
      }
    )
      .populate('notifications')
      .select(
        'firstName lastName phone notifications favouriteStores email avatar'
      );
    console.log(userWithNotifications);

    const userName = `${savedUser.firstName}`;
    const code = `${savedUser.referral}`
    const title = 'Referral Code!';
    const body = `Dear ${userName}, your referral code from ShopOut is: ${code}`;

    dispatchSingleNotification(savedUser.firebaseToken, title, body, {
      referral: savedUser.referral,
      archived: 'false'
    });

    saveNewNotification(
      title,
      body,
      null,
      savedUser._id,
      null,
      null,
      false);

    return res.status(200).json({
      token: generatedKey.token,
      user: userWithNotifications,
    });


  } catch (error) {
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;

// "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjkwMzUyOTczNTAsInNjb3BlIjoidXNlciIsImp0aSI6IjU4MWI0OTYyLTZmNTktNDBhOS1iNDg3LTU1YjBkYTZhODU5MiIsImlhdCI6MTYyMzI0NTgxMywiZXhwIjoxNjIzODUwNjEzfQ.p55bnp-hAcUoV2nWFgRCfzAKbR3EHZgBdWrnKcUERSA",
//   "user": {
//   "notifications": [
//     {
//       "title": "Welcome to your new ShopOut account",
//       "archived": false,
//       "readStatus": false,
//       "_id": "60c0c3f57454e42af07c2aee",
//       "text": "Complete your profile today!",
//       "user": "60c0c3f57454e42af07c2aed",
//       "generatedTime": "2021-06-09T13:36:53.631Z",
//       "__v": 0
//     }
//   ],
//     "favouriteStores": [],
//       "_id": "60c0c3f57454e42af07c2aed",
//         "firstName": "Aratrika",
//           "lastName": "Ray",
//             "phone": 9035297350,
//               "email": "aratikkiz@gmail.com"
// }