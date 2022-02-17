const router = require('express').Router();
const verifySession = require('../../../auth/verifySession');
const handleError = require('../../../../../error_handling/handler');
const User = require('../../../../../models/entities/user-schema');

// get all favourite stores
router.post('/all/stores', verifySession, (req, res) => {
  const { cred } = req.body;
  User.findOne({ phone: cred.phone })
    .select('favouriteStores')
    .populate({
      path: 'favouriteStores',
      select: 'avg_rating name location location_desc business',
      populate: {
        path: 'business',
        select: 'display_name category title_image ',
      },
    })
    .exec((err, allFav) => {
      if (err) {
        handleError(`Error in fetching favourite stores in user  :${err}`);
        res.status(500).json({ error: 'Error in fetching favoutite stores' });
      } else {
        res.status(200).json({ response: allFav });
      }
    });
});

// add favourite Store in favoutiteStores array of user
router.post('/add/store', verifySession, (req, res) => {
  const { cred } = req.body;
  const store = req.body.storeData;
  User.findOneAndUpdate(
    { phone: cred.phone },
    { $push: { favouriteStores: store._id } },
    (err, user) => {
      if (err) {
        handleError(`Error in adding store as favourite in user :${err}`);
        res
          .status(500)
          .json({ error: 'Error in adding store as favourite in user' });
      } else {
        res.status(200).json({
          response: 'Successfully added store as favourite in user',
          favouriteStores: user.favouriteStores,
        });
      }
    }
  );
});

// remove favourite store from user
router.post('/remove/store', verifySession, (req, res) => {
  const { cred } = req.body;
  const store = req.body.storeData;
  User.findOneAndUpdate(
    { phone: cred.phone },
    { $pull: { favouriteStores: store._id } },
    (err, user) => {
      if (err) {
        handleError(`Error in removing store as favourite in user :${err}`);
        res
          .status(500)
          .json({ error: 'Error in removing store as favourite in user' });
      } else {
        res.status(200).json({
          response: 'Successfully removed store as favourite in user',
          favouriteStores: user.favouriteStores,
        });
      }
    }
  );
});

module.exports = router;
