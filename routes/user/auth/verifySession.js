const njwt = require('njwt');
const User = require('../../../models/entities/user-schema');
const handleError = require('../../../error_handling/handler');

// =====================================
// AUTH SETUP
// session verification middleware
const verifySession = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized access.' });
  }

  const token = req.headers.authorization.split(' ')[1];
  const { phone } = req.body.cred;

  if (!phone) {
    return res.status(400).json({ error: 'Invalid request format.' });
  }

  User.findOne({ phone }, (err, user) => {
    if (err) {
      handleError(err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      if (user) {
        njwt.verify(token, user._signingKey, (err, verifiedJwt) => {
          if (err) {
            handleError(err);
            res.status(401).json({ error: 'Unauthorized access' });
          } else {
            if (
              verifiedJwt.body.scope === 'user' ||
              verifiedJwt.body.scope === 'admin'
            ) {
              return next();
            }

            handleError('Forbidden scope');
            res.status(403).json({ error: 'Forbidden Scope' });
          }
        });
      } else {
        handleError('User not found');
        res.status(404).json({ error: 'User not found' });
      }
    }
  });
};

module.exports = verifySession;
