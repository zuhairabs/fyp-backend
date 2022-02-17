const router = require('express').Router();
const verifySession = require('../auth/verifySession');
const handleError = require('../../../error_handling/handler');
const Store = require('../../../models/entities/store-schema');

// fetch all stores
router.post('/all', verifySession, (req, res) => {
  Store.find({})
    .select(
      'avg_rating name location active_hours working_days location_desc business'
    )
    .populate('business', 'display_name logo category brands tags')
    .exec((err, stores) => {
      if (err) {
        handleError(err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else res.status(200).json({ stores });
    });
});

// fetch single store
router.post('/fetch', (req, res) => {
  const { storeData } = req.body;

  Store.findOne({ _id: storeData._id })
    .select(
      'name location active_hours working_days capacity location_desc description avg_rating parameters'
    )
    .populate('business', 'display_name logo category brands tags images')
    .exec((err, store) => {
      if (err) {
        handleError(err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (store) res.status(200).json({ store });
        else {
          handleError('Store not found');
          res.status(404).json({ error: 'Store not found' });
        }
      }
    });
});

// fetch owner store
router.post('/storefetch', verifySession, (req, res) => {
  const { cred } = req.body;

  Store.findOne({ phone: cred.phone })
    .select(
      'name location active_hours working_days capacity location_desc description avg_rating'
    )
    .populate('business', 'display_name logo category brands tags images')
    .exec((err, store) => {
      if (err) {
        handleError(err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (store) res.status(200).json({ store });
        else {
          handleError('Store not found');
          res.status(404).json({ error: 'Store not found' });
        }
      }
    });
});

router.post('/fetch/details', (req, res) => {
  const { storeData } = req.body;

  Store.findOne({ _id: storeData._id })
    .select(
      'name location active_hours working_days location_desc description avg_rating parameters'
    )
    .populate('business', 'display_name category')
    .exec((err, store) => {
      if (err) {
        handleError(err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (store) res.status(200).json({ store });
        else {
          handleError('Store not found');
          res.status(404).json({ error: 'Store not found' });
        }
      }
    });
});

router.post('/fetch/images', (req, res) => {
  const { storeData } = req.body;

  Store.findOne({ _id: storeData._id })
    .select('name images')
    .populate('business', 'images')
    .exec((err, store) => {
      if (err) {
        handleError(err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        if (store) res.status(200).json({ store });
        else {
          handleError('Store not found');
          res.status(404).json({ error: 'Store not found' });
        }
      }
    });
});

module.exports = router;
