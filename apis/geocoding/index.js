const router = require('express').Router();
const reverseGeocoding = require('./controllers/reverseGeocoding');

router.get('/reverse', (req, res) => {
  const { lat, long } = req.query;
  reverseGeocoding({ lat, long })
    .then((place) => {
      res.status(200).json({ place });
    })
    .catch((err) => {
      res.status(500).json({ err });
    });
});

module.exports = router;
