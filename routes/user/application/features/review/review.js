const router = require('express').Router();
const User = require('../../../../../models/entities/user-schema');
const Store = require('../../../../../models/entities/store-schema');
const Review = require('../../../../../models/operations/review-schema');
const ArchiveBooking = require('../../../../../models/operations/archive-booking-schema');
const handleError = require('../../../../../error_handling/handler');

// update average rating
async function updateAverage(storeData, reviewData) {
  const store = await Store.findById(storeData._id);
  const avgRatingLength = store.reviews.length - 1;
  let newTotalRating = store.avg_rating * avgRatingLength;

  const reviewParams = reviewData.params;
  const newRatingsLength = reviewData.params.length;

  reviewParams.forEach((param) => {
    const existingParam = store.parameters.find(
      (storedParam) => storedParam.title === param.title
    );

    if (existingParam) {
      const rawRating =
        (existingParam.rating * existingParam.numberOfRatings + param.score) /
        (existingParam.numberOfRatings + 1);

      existingParam.rating = Math.round(rawRating * 10) / 10;

      existingParam.numberOfRatings += 1;
    } else {
      store.parameters.push({
        title: param.title,
        rating: Math.round(param.score * 10) / 10,
        numberOfRatings: 1,
      });
    }

    newTotalRating += param.score;
  });

  const rawRating = newTotalRating / (avgRatingLength + newRatingsLength);
  store.avg_rating = Math.round(rawRating * 10) / 10;
  await store.save();
}

// user application to post a new review
router.post('/submit', (req, res) => {
  const { reviewData } = req.body;
  const newReview = new Review(reviewData);
  ArchiveBooking.findOne({ _id: reviewData.booking }, (err, booking) => {
    if (booking.review) {
      handleError('Booking already reviewed');
      res.status(403).json({ error: 'Booking already reviewed' });
    } else {
      newReview.save((err, savedReview) => {
        if (err) {
          handleError(err);
          res.status(500).json({ error: 'Error saving review' });
        } else {
          Store.findOneAndUpdate(
            { _id: reviewData.store },
            { $push: { reviews: savedReview } },
            (err, store) => {
              if (err) {
                handleError(err);
                res.status(500).json({ error: 'Server error updating store' });
              } else if (store) {
                User.findOneAndUpdate(
                  { _id: reviewData.user },
                  { $push: { reviews: savedReview } },
                  (err, user) => {
                    if (err) {
                      handleError(err);
                      res.status(500).json({ error: 'Error updating user' });
                    } else if (user) {
                      ArchiveBooking.findOneAndUpdate(
                        { _id: reviewData.booking },
                        { review: savedReview._id },
                        (err, booking) => {
                          if (err) {
                            handleError(err);
                            res
                              .status(500)
                              .json({ error: 'Error updating booking' });
                          } else if (booking) {
                            updateAverage(store, reviewData);
                            res.status(200).json({ response: 'Review saved' });
                            console.log('New review saved');
                          } else {
                            handleError('Booking not found');
                            res
                              .status(404)
                              .json({ error: 'Booking not found' });
                          }
                        }
                      );
                    }
                  }
                );
              } else {
                handleError('Store not found');
                res.status(404).send('Store not found');
              }
            }
          );
        }
      });
    }
  });
});

module.exports = router;
