const router = require('express').Router();
const Store = require('../../../models/entities/store-schema');
const authentication = require('../../../controllers/authentication');
const handleError = require('../../../error_handling/handler');
const verifySession = require('./verifySession');

const { TWO_FACTOR_KEY } = process.env;
/*  *********************************************
 *  USER SESSION AND CREDENTIALS VERIFICATION ROUTES
 * */

// verify token
router.post('/', verifySession, (_, res) => {
  res.status(200).json({ response: 'Store already logged in' });
});

// verify token and refresh
router.post('/refresh', verifySession, (req, res) => {
  const { cred } = req.body;

  const generatedKey = authentication.secureJWT(cred.phone, 'store');
  Store.findOneAndUpdate(
    { phone: cred.phone },
    { _signingKey: generatedKey.key }
  ).exec((err, savedStore) => {
    if (savedStore) res.status(200).json({ token: generatedKey.token });
    else res.status(404).json({ error: 'No store found' });
  });
});

// verify if phone number registered
router.post('/phone', (req, res) => {
  const { phone } = req.body;
  Store.findOne({ phone }, (err, savedStore) => {
    if (err) {
      handleError(err);
      res.status(500).json({ error: 'Internal server error' });
    } else if (savedStore) {
      res
        .status(403)
        .json({ error: 'Store already exists', key: TWO_FACTOR_KEY });
    }
    else{
      res
        .status(200)
        .json({ response: 'Store does not exist', key: TWO_FACTOR_KEY });
    }
  });
});

// =====================================

console.log(router);

module.exports = router;
