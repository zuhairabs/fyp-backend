/* eslint-disable no-tabs */
/* eslint-disable quotes */
const router = require('express').Router();
const RTCUser = require('../../../models/entities/rtc-user-schema');
const Store = require('../../../models/entities/store-schema');
const User = require('../../../models/entities/user-schema');
const handleError = require('../../../error_handling/handler');
const {
  dispatchSingleNotification,
  dispatchSingleNotificationApple,
} = require('../../../utils/notification-dispatcher');

const callNotificationTitle = 'Incoming call';
const missCallTitle = 'Missed call';

router.post('/', async (req, res) => {
  try {
    const isExisting = await RTCUser.findOne({
      ref_id: req.body.ref_id,
      channelName: req.body.channelName,
    });

    if (isExisting) {
      const updatedUser = await RTCUser.updateMany(
        { ref_id: req.body.ref_id },
        { uid: req.body.uid }
      );
      if (!updatedUser) {
        return res.status(400).json({
          error: 'Unable to create new RTC user',
        });
      }
      return res.status(200).json({
        status: 'Updated existing RTC user',
      });
    }

    const user = await RTCUser.create(req.body);

    if (!user) {
      return res.status(400).json({
        error: 'Unable to create new RTC user.',
      });
    }

    return res.status(200).json({
      status: 'Created new RTC user',
    });
  } catch (e) {
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

router.post('/dial', async (req, res) => {
  // pass user _ids as users
  const { user, cred, channelName } = req.body;
  /* const user = {
	_id: '5facec343724a207c25aba2d'
  }
  const cred = {
	phone: '9867927529'	
  } */
  try {
    const store = await Store.findOne({ phone: cred.phone }).populate({
      path: 'business',
      select: 'display_name',
    });
    // console.log(store.business.images[0]);
    if (!store) return res.status(404).json({ error: 'Store not found' });
    const savedUser = await User.findOne(user);
    if (savedUser) {
      console.log({ savedUser, callNotificationTitle });
      const data = {
        type: 'call',
        channelName: JSON.stringify(channelName),
        display_name: JSON.stringify(store.business.display_name),
      };
      dispatchSingleNotification(
        savedUser.firebaseToken,
        callNotificationTitle,
        `📞 ${store.business.display_name} is calling`,
        { data: JSON.stringify(data) }
      );
      dispatchSingleNotificationApple(
        savedUser.deviceToken,
        callNotificationTitle,
        `📞 ${store.business.display_name} is calling`,
        { data: JSON.stringify(data) }
      );
      return res.status(200).json({ response: 'Call connected' });
    }
  } catch (e) {
    handleError(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/missedCall', async (req, res) => {
  // pass user _ids as users
  const { user } = req.body;
  /* const user = {
	_id: '5facec343724a207c25aba2d'
  }*/
  try {
    const savedUser = await User.findOne(user);
    if (savedUser) {
      const data = {
        type: 'call',
        caller: JSON.stringify(savedUser),
      };
      dispatchSingleNotification(
        savedUser.firebaseToken,
        missCallTitle,
        `You missed a Video call 📞`,
        data
      );
      dispatchSingleNotificationApple(
        savedUser.firebaseToken,
        missCallTitle,
        `You missed a Video call 📞`,
        data
      );
      return res
        .status(200)
        .json({ response: 'Missed Call Notification Sent' });
    }
  } catch (e) {
    handleError(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
