const router = require('express').Router();
const bcrypt = require('bcryptjs');
const Store = require('../../../models/entities/store-schema');
const Notification = require('../../../models/operations/notification-schema');
const authentication = require('../../../controllers/authentication');
const handleError = require('../../../error_handling/handler');
const verification = require('./verification');

console.log(verification);

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

    await Store.findOneAndUpdate(
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
    const generatedKey = authentication.secureJWT(cred.phone, 'store');

    const store = await Store.findOneAndUpdate(
      { phone: cred.phone },
      { _signingKey: generatedKey.key, firebaseToken: cred.firebaseToken }
    )
      .populate({
        path: 'notifications',
        populate: {
          path: 'user',
          select: 'firstName lastName avatar',
        },
        options: {
          limit: 15,
          sort: { generatedTime: -1 },
        },
      })
      .populate({
        path: 'business',
        select: 'display_name images title_image email tags',
      })
      .select(
        '-bookings -slots -archiveBookings -images -reviews -notificationHistory -video_slots -parameters -_signingKey'
      );

    if (!store) {
      handleError('Phone number not registered');
      return res.status(404).json({ error: 'Phone number not registered' });
    }

    const match = await bcrypt.compare(cred.password, store.password);

    if (!match) {
      handleError('Invalid password');
      return res.status(404).json({ error: 'Invalid password' });
    }

    return res.status(200).json({
      token: generatedKey.token,
      store,
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
    const store = await Store.findOneAndUpdate(
      { phone: cred.phone },
      {
        _signingKey: '',
        firebaseToken: '',
      }
    );

    if (!store) {
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


module.exports = router;
