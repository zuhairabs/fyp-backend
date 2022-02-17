const router = require('express').Router();
const User = require('../../../models/entities/user-schema');
const Store = require('../../../models/entities/store-schema');
const RTCUser = require('../../../models/entities/rtc-user-schema');

/**
 * Routes to fetch participant details from the DB
 */
router.post('/all', async (req, res) => {
  const { channelName } = req.body;
  try {
    // Get all user participants
    const participants = await RTCUser.find({
      channelName,
      type: 'user',
    });

    const users = participants.map(async (participant) => {
      const user = await User.findById(participant.ref_id).select(
        'firstName lastName'
      );

      return user;
    });

    const finalUsers = await Promise.all(users);

    // Get all store participants
    const storeParticipants = await RTCUser.find({
      channelName,
      type: 'store',
    });

    const stores = storeParticipants.map(async (participant) => {
      const store = await Store.findById(participant.ref_id)
        .populate({
          path: 'business',
          select: 'display_name',
        })
        .select('name business');

      return store;
    });

    const finalStores = await Promise.all(stores);

    return res.status(200).json({
      status: 'success',
      users: finalUsers,
      stores: finalStores,
    });
  } catch (e) {
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

router.post('/single', async (req, res) => {
  const { channelName, uid } = req.body;
  try {
    // get single participant from channel
    const participant = await RTCUser.findOne({ channelName, uid });
    if (!participant) {
      res.status(404).json({ error: 'No such participant found' });
    } else if (participant.type === 'user') {
      const user = await User.findById(participant.ref_id).select(
        'firstName lastName'
      );
      if (user) {
        res.status(200).json({
          title: `${user.firstName} ${user.lastName}`,
          subtitle: 'Customer',
        });
      } else {
        res.status(400).json({ error: 'No such user found' });
      }
    } else if (participant.type === 'store') {
      const store = await Store.findById(participant.ref_id)
        .populate({
          path: 'business',
          select: 'display_name',
        })
        .select('name business');
      if (store) {
        res.status(200).json({
          title: store.business.display_name,
          subtitle: store.name,
        });
      } else {
        res.status(400).json({ error: 'No such store found' });
      }
    }
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
