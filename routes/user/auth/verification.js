const router = require('express').Router();
const User = require('../../../models/entities/user-schema');
const authentication = require('../../../controllers/authentication');
const handleError = require('../../../error_handling/handler');
const verifySession = require('./verifySession');

const { TWO_FACTOR_KEY } = process.env;
/*  *********************************************
 *  USER SESSION AND CREDENTIALS VERIFICATION ROUTES
 * */

// verify token
router.post('/', verifySession, (_, res) => {
  res.status(200).json({ response: 'User already logged in' });
});

// verify token and refresh
router.post('/refresh', verifySession, (req, res) => {
  const { cred } = req.body;

  const generatedKey = authentication.secureJWT(cred.phone, 'user');
  User.findOneAndUpdate(
    { phone: cred.phone },
    { _signingKey: generatedKey.key }
  ).exec((err, savedUser) => {
    if (savedUser) res.status(200).json({ token: generatedKey.token });
    else res.status(404).json({ error: 'No user found' });
  });
});

// verify if phone number registered
router.post('/phone', (req, res) => {
  const { phone } = req.body;
  User.findOne({ phone }, (err, savedUser) => {
    if (err) {
      handleError(err);
      res.status(500).json({ error: 'Internal server error' });
    } else if (savedUser) {
      res
        .status(403)
        .json({ error: 'User already exists', key: TWO_FACTOR_KEY });
    }
    else{
      res
        .status(200)
        .json({ response: 'User does not exist', key: TWO_FACTOR_KEY });
    }
  });
});

// =====================================

module.exports = router;
