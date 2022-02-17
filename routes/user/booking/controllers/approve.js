const router = require('express').Router();
const Store = require('../../../../models/entities/store-schema');
const handleError = require('../../../../error_handling/handler');
const verifySession = require('../../auth/verifySession');

const MINUTE = 60 * 1000;

async function bookingAutoApproval(bookingData) {
  return new Promise((resolve, reject) => {
    Store.findOne({ _id: bookingData.store })
      .select('capacity slots active_hours')
      .populate('slots')
      .exec((err, store) => {
        if (err) handleError(err);
        else {
          const dateBooking = new Date(bookingData.start);

          let date = dateBooking.getUTCDate().toString();
          let month = (dateBooking.getUTCMonth() + 1).toString();
          if (date.length === 1) date = `0${date}`;
          if (month.length === 1) month = `0${month}`;
          const year = dateBooking.getUTCFullYear().toString();

          const storeStart = store.active_hours[0].start;
          const storeEnd = store.active_hours[0].end;

          const storeStartTime = new Date(
            `${year}-${month}-${date}T${storeStart}:00.000+05:30`
          ).getTime();
          const storeEndTime = new Date(
            `${year}-${month}-${date}T${storeEnd}:00.000+05:30`
          ).getTime();

          if (
            dateBooking.getTime() >= storeEndTime ||
            dateBooking.getTime() < storeStartTime
          ) {
            resolve({
              error: 'Slot not in store time limit',
              slot: dateBooking,
              code: 403,
            });
          }

          const { slots } = store;
          let slotFound;
          slots.forEach((slot) => {
            const dateSlot = new Date(slot.startTime);
            if (dateBooking.getTime() === dateSlot.getTime()) {
              slotFound = slot;
            }
          });
          if (slotFound) {
            if (slotFound.filled >= store.capacity) {
              resolve({
                error: 'Slot capacity full',
                slot: slotFound.startTime,
                code: 404,
              });
            } else if (
              Number(bookingData.visitors) >
              Number(store.capacity) - Number(slotFound.filled)
            ) {
              resolve({
                error: 'Try for fewer visitors',
                slot: slotFound.startTime,
                code: 404,
              });
            } else if (
              store.capacity >=
              slotFound.filled + bookingData.visitors
            ) {
              resolve({
                response: 'Slot available',
                slot: slotFound.startTime,
                code: 200,
              });
            } else {
              resolve({
                error: 'Unknown error',
                slot: slotFound.startTime,
                code: 500,
              });
            }
          } else {
            Store.findOneAndUpdate(
              { _id: store._id },
              { $push: { slots: { startTime: bookingData.start } } },
              (err, _updatedStore) => {
                if (err) {
                  handleError(err);
                  console.error('error updating store slots', err);
                } else {
                  resolve({
                    response: 'Successfully added required slot',
                    code: 200,
                  });
                }
              }
            );
          }
        }
      });
  });
}

async function checkSlots(slots, dummyBookingData) {
  const results = [];
  let isAnyFalse = false;
  for (const slot of slots) {
    dummyBookingData.start = slot;
    await bookingAutoApproval(dummyBookingData)
      .then((response) => {
        if (response.code === 200) {
          results.push([true, response.response, response.slot]);
        } else {
          results.push([false, response.error, response.slot]);
          isAnyFalse = true;
        }
      })
      .catch((e) => {
        handleError(e);
      });
  }
  return { isAnyFalse, results };
}

async function videoBookingAutoApproval(bookingData) {
  return new Promise((resolve, reject) => {
    Store.findOne({ _id: bookingData.store })
      .select('video_capacity video_slots active_hours')
      .populate('video_slots')
      .exec((err, store) => {
        if (err) handleError(err);
        else {
          const dateBooking = new Date(bookingData.start);

          let date = dateBooking.getUTCDate().toString();
          let month = (dateBooking.getUTCMonth() + 1).toString();
          if (date.length === 1) date = `0${date}`;
          if (month.length === 1) month = `0${month}`;
          const year = dateBooking.getUTCFullYear().toString();

          const storeStart = store.active_hours[0].start;
          const storeEnd = store.active_hours[0].end;

          const storeStartTime = new Date(
            `${year}-${month}-${date}T${storeStart}:00.000+05:30`
          ).getTime();
          const storeEndTime = new Date(
            `${year}-${month}-${date}T${storeEnd}:00.000+05:30`
          ).getTime();

          if (
            dateBooking.getTime() >= storeEndTime ||
            dateBooking.getTime() < storeStartTime
          ) {
            resolve({
              error: 'Slot not in store time limit',
              slot: dateBooking,
              code: 403,
            });
          }

          const { video_slots: slots } = store;
          let slotFound;
          slots.forEach((slot) => {
            const dateSlot = new Date(slot.startTime);
            if (dateBooking.getTime() === dateSlot.getTime()) {
              slotFound = slot;
            }
          });
          if (slotFound) {
            if (slotFound.filled >= store.capacity) {
              resolve({
                error: 'Slot capacity full',
                slot: slotFound.startTime,
                code: 404,
              });
            } else if (
              Number(bookingData.visitors) >
              Number(store.capacity) - Number(slotFound.filled)
            ) {
              resolve({
                error: 'Try for fewer visitors',
                slot: slotFound.startTime,
                code: 404,
              });
            } else if (
              store.capacity >=
              slotFound.filled + bookingData.visitors
            ) {
              resolve({
                response: 'Slot available',
                slot: slotFound.startTime,
                code: 200,
              });
            } else {
              resolve({
                error: 'Unknown error',
                slot: slotFound.startTime,
                code: 500,
              });
            }
          } else {
            Store.findOneAndUpdate(
              { _id: store._id },
              { $push: { video_slots: { startTime: bookingData.start } } },
              (err, _updatedStore) => {
                if (err) {
                  handleError(err);
                  console.error('error updating store slots', err);
                } else {
                  resolve({
                    response: 'Successfully added required slot',
                    code: 200,
                  });
                }
              }
            );
          }
        }
      });
  });
}

async function checkVideoSlots(slots, dummyBookingData) {
  const results = [];
  let isAnyFalse = false;
  for (const slot of slots) {
    dummyBookingData.start = slot;
    await videoBookingAutoApproval(dummyBookingData)
      .then((response) => {
        if (response.code === 200) {
          results.push([true, response.response, response.slot]);
        } else {
          results.push([false, response.error, response.slot]);
          isAnyFalse = true;
        }
      })
      .catch((e) => {
        handleError(e);
        console.log(e);
      });
  }
  return { isAnyFalse, results };
}

router.post('/', verifySession, async (req, res) => {
  try {
    const { bookingData } = req.body;

    if (!bookingData) {
      return res.status(400).json({
        error: 'Invalid request format.',
      });
    }
    let slotCheckFunction;
    if (bookingData.type === ' virtual') {
      slotCheckFunction = checkVideoSlots;
    } else {
      slotCheckFunction = checkSlots;
    }
    const bookingEnd = new Date(bookingData.end);
    let start = new Date(bookingData.start).getTime();
    let end = start + 30 * MINUTE;

    const slots = [];
    do {
      slots.push(start);
      start = end;
      end = start + 30 * MINUTE;
    } while (end <= bookingEnd);
    const dummyBookingData = bookingData;
    slotCheckFunction(slots, dummyBookingData).then((result) => {
      if (result.isAnyFalse) {
        return res.status(404).json({
          response: 'Booking is not available',
        });
      }
      return res.status(200).json({
        response: result.results,
      });
    });
  } catch (error) {
    handleError(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
