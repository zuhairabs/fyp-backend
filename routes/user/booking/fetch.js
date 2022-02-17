const router = require('express').Router();
const archiveDemoBooking = require('../../../models/operations/archive-demo-booking-schema');
const ArchiveBooking = require('../../../models/operations/archive-booking-schema');
const User = require('../../../models/entities/user-schema');
const Booking = require('../../../models/operations/booking-schema');
const demoBooking = require('../../../models/operations/demo-booking-schema');
const verifySession = require('../auth/verifySession');
const handleError = require('../../../error_handling/handler');

// fetch one user booking
router.post('/single', verifySession, async (req, res) => {
  try {
    const { cred } = req.body;
    const { bookingData } = req.body;

    if (!cred || !bookingData) {
      return res.status(400).json({
        error: 'Invalid request format.',
      });
    }

    const booking = await Booking.findOne({
      _id: bookingData._id,
    })
      .populate('user', 'phone')
      .populate({
        path: 'store',
        populate: {
          path: 'business',
          select: 'display_name category title_image logo',
        },
        select: 'name location location_desc working_days active_hours avg_rating parameters',
      });

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found',
      });
    }

    if (booking.user.phone !== cred.phone) {
      return res.status(401).json({
        error: 'Unauthorized access',
      });
    }
    return res.status(200).json({
      booking,
    });
  } catch (error) {
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// fetch one user archived booking
router.post('/single/archived', verifySession, async (req, res) => {
  try {
    const { cred } = req.body;
    const { bookingData } = req.body;

    if (!cred || !bookingData) {
      return res.status(400).json({
        error: 'Invalid request format.',
      });
    }

    const booking = await ArchiveBooking.findOne({
      _id: bookingData._id,
    })
      .populate('user', 'phone')
      .populate({
        path: 'store',
        populate: {
          path: 'business',
          select: 'display_name category logo title_image',
        },
        select: 'name location location_desc working_days active_hours avg_rating parameters',
      });

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found',
      });
    }

    if (booking.user.phone !== cred.phone) {
      return res.status(401).json({
        error: 'Unauthorized access',
      });
    }

    return res.status(200).json({
      booking,
    });
  } catch (error) {
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// fetch all user bookings
router.post('/all', async (req, res) => {
  try {
    const { cred } = req.body;

    if (!cred) {
      return res.status(400).json({
        error: 'Invalid request format.',
      });
    }

    const user = await User.findOne({ phone: cred.phone })
      .populate([{
        path: 'bookings',
        options: {
          sort: {
            start: 1,
          },
        },
        populate: {
          path: 'store',
          populate: {
            path: 'business',
            select: 'display_name category title_image',
          },
          select: 'description name active_hours working_days location_desc avg_rating',
        },
      },
      {
          path: 'demoBookings',
          select: 'demoName description demoDate startTime duration images business',
          options:{
            sort: {
              startTime:1,
            },
          },
          populate: 'business',
      }])
      .sort('start');

    if (!user) {
      return res.status(400).json({
        error: 'User not found.',
      });
    }

    console.log("USER:\n", user);

    function compare(a, b) {
      if (new Date(a.start) < new Date(b.start))
        return -1;
      if (new Date(a.start) > new Date(b.start))
        return 1;
      return 0;
    }

    let a = [...user.bookings, ...user.demoBookings];
    console.log(a);
    a.forEach(element => {
      if (element.type === undefined) {
        console.log(element);
        element._doc = {
          ...element._doc,
          type: 'live',
          start: element.startTime
        };
      }
      console.log(element);
    })
    a.sort(compare);

    return res.status(200).json({
      bookings: a,
    });
  } catch (error) {
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// fetch all user archived bookings
router.post('/all/archived', verifySession, async (req, res) => {
  try {
    const { cred } = req.body;

    if (!cred) {
      return res.status(400).json({
        error: 'Invalid request format.',
      });
    }

    const user = await User.findOne({
      phone: cred.phone,
    }).populate([{
      path: 'archiveBookings',
      options: {
        sort: {
          start: -1,
        },
        limit: 15,
      },
      populate: {
        path: 'store',
        populate: {
          path: 'business',
          select: 'display_name category title_image',
        },
        select: 'description name active_hours working_days location_desc avg_rating',
      },
    },
      {
          path: 'archiveDemoBookings',
          select: 'demoName description demoDate startTime duration images business',
          options:{
            sort: {
              startTime:1,
            },
          },
          populate: 'business',
      }]);

    if (!user) {
      return res.status(400).json({
        error: 'User not found.',
      });
    }

    function compare(a, b) {
      if (new Date(a.start) < new Date(b.start))
        return -1;
      if (new Date(a.start) > new Date(b.start))
        return 1;
      return 0;
    }
    let a = [...user.archiveBookings, ...user.archiveDemoBookings];
    console.log(a);
    a.forEach(element => {
      if (element.type === undefined) {
        console.log(element);
        element._doc = {
          ...element._doc,
          type: 'live',
          start: element.startTime
        };
      }
      console.log(element);
    })
    a.sort(compare);

    return res.status(200).json({
      bookings: a,
    });
  } catch (error) {
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
