const njwt = require('njwt');
const bcrypt = require('bcryptjs');
const secureRandom = require('secure-random');

const router = require('express').Router();
const Store = require('../../../models/entities/store-schema');
const logger = require('../../../utils/logger');

const handleError = (err) => {
  logger.storelogger.log('error', err);
  console.error(err);
};

// highly random 256 byte array
const generateSigningKey = () => {
  const signingKey = secureRandom(256, { type: 'Buffer' });
  return signingKey;
};

// generate secure JWT
const secureJWT = (phone) => {
  const claims = {
    sub: phone,
    scope: 'store',
  };
  const key = generateSigningKey();
  const jwt = njwt.create(claims, key);

  // expires in 7 days
  jwt.setExpiration(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);

  const token = jwt.compact();
  return { token, key };
};

// session verification middleware
const verifySession = (req, res, next) => {
  const bearerHeader = req.headers.authorization;

  if (!bearerHeader) {
    return res.status(401).json({ error: 'Unauthorized Access' });
  }

  const token = bearerHeader.split(' ')[1];
  const { phone } = req.body.cred;

  if (!phone) {
    return res.status(400).json({ error: 'Invalid request format.' });
  }

  Store.findOne({ phone }, (err, store) => {
    if (err) {
      handleError(err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      if (store) {
        njwt.verify(token, store._signingKey, (err, verifiedJwt) => {
          if (err) {
            handleError(err);
            res.status(401).json({ error: 'Unauthorized access' });
          } else {
            if (
              verifiedJwt.body.scope === 'store' ||
              verifiedJwt.body.scope === 'admin'
            ) {
              return next();
            }
            handleError('Forbidden Scope');
            res.status(403).json({ error: 'Forbidden Scope' });
          }
        });
      } else {
        handleError('Store not found');
        res.status(404).json({ error: 'Store not found' });
      }
    }
  });
};

// =====================================
// STORE ACTIONS

// verify
router.post('/verify', verifySession, (req, res) => {
  res.status(200).json({ response: 'User already logged in' });
});

// login to store
router.post('/login', async (req, res) => {
  try {
    const { cred } = req.body;

    if (!cred) {
      return res.status(400).json({
        error: 'Invalid request format',
      });
    }

    const generatedToken = secureJWT(cred.phone);

    const store = await Store.findOneAndUpdate(
      { phone: cred.phone },
      { _signingKey: generatedToken.key }
    )
      .populate({
        path: 'notifications',
        populate: {
          path: 'user',
          select: 'firstName lastName avatar',
        },
        options: {
          sort: {
            generatedTime: -1,
          },
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
      return res.status(404).json({ error: 'Invalid store password.' });
    }

    store.password = undefined;

    return res.status(200).json({
      token: generatedToken.token,
      store,
    });
  } catch (error) {
    handleError(error);
    return res.status(500).json({
      error: 'Internal server error.',
    });
  }
});

module.exports = { authenticationRouter: router, verifySession, handleError };
