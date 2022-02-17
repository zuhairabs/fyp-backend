const njwt = require('njwt');
const secureRandom = require('secure-random');

// token setup
// highly random 256 byte array
const secureJWT = (phone, scope) => {
  const claims = {
    sub: phone,
    scope,
  };

  const key = secureRandom(256, { type: 'Buffer' });
  // expires in 7 days
  const jwt = njwt.create(claims, key);
  const expirationTime = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
  jwt.setExpiration(expirationTime);

  const token = jwt.compact();
  return { token, key };
};

module.exports = { secureJWT };
