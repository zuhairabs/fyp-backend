const router = require('express').Router();
const verifySession = require('../../../auth/verifySession');
const User = require('../../../../../models/entities/user-schema');
const BrowsingSession = require('../../../../../models/operations/browsing-session-schema');
const handleError = require('../../../../../error_handling/handler');

router.post('/search/fetch', verifySession, (req, res) => {
  const { cred } = req.body;

  User.findOne({ phone: cred.phone })
    .select('searchHistory')
    .populate({
      path: 'searchHistory',
      options: {
        sort: '-timestamp',
      },
      limit: 5,
      select: 'query',
    })
    .exec((err, search) => {
      if (err) {
        handleError(err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.status(200).json({ response: search });
      }
    });
});

// add store into storeHistory of user
router.post('/store/add', (req, res) => {
  const { cred } = req.body;
  const store = req.body.storeData;

  User.findOneAndUpdate(
    { phone: cred.phone },
    { $push: { storeHistory: store } },
    (err, savedstore) => {
      if (err) {
        handleError(err);
        res
          .status(500)
          .json({ error: 'Error in storing store history in user schema' });
      } else {
        res.status(200).json({
          response: 'Store successfully pushed to user store history',
        });
      }
    }
  );
});

// fetch store from storeHistory of user
router.post('/store/fetch', (req, res) => {
  const { cred } = req.body;
  User.findOne({ phone: cred.phone })
    .select('storeHistory')
    .populate({
      path: 'storeHistory',
      select: 'avg_rating name location location_desc business',
      populate: {
        path: 'business',
        select: 'display_name category title_image',
      },
      limit: 10,
    })
    .exec((err, stores) => {
      if (err) {
        handleError(err);
        res.status(500).json({ error: 'Trouble fetching store history' });
      } else res.status(200).json({ response: stores });
    });
});

router.post('/session/start', async (req, res) => {
  const { cred } = req.body;
  if (!cred) return res.status(400).json({ error: 'Invalid request format' });
  try {
    const user = await User.findOne({ phone: cred.phone });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const newSession = new BrowsingSession({ user: user._id });
    newSession.save();
    return res
      .status(200)
      .json({ sessionId: newSession._id, response: 'Added new session' });
  } catch (e) {
    handleError(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/session/add', async (req, res) => {
  const { sessionId, url } = req.body;
  try {
    const session = await BrowsingSession.findOne({ _id: sessionId });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const temp = session.visited;
    temp.push({ url });
    session.visited = temp;
    session.save();
    return res.status(200).json({ response: 'Added new url to session' });
  } catch (e) {
    handleError(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
