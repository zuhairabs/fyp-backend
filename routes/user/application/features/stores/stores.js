const router = require('express').Router();
const Store = require('../../../../../models/entities/store-schema');
const handleError = require('../../../../../error_handling/handler');

router.post('/fetch/details', (req, res) => {
  const { storeData } = req.body;

  Store.findOne({ _id: storeData._id })
    .select(
      'name location active_hours working_days location_desc description avg_rating parameters virtual_enabled physical_enabled'
    )
    .populate('business', 'name display_name category')
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
