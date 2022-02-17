const Store = require('../../../../models/entities/store-schema');
const handleError = require('../../../../error_handling/handler');

// updates new slots to store
async function updateStoreSlots(newSlots, bookingData) {
  return new Promise((resolve) => {
    Store.findOneAndUpdate(
      { _id: bookingData.store },
      { slots: newSlots },
      (err, store) => {
        if (err) handleError(err);
        else resolve('Store updated');
      }
    );
  });
}

async function updateStoreVideoSlots(newSlots, bookingData) {
  console.log('In update store slots');
  return new Promise((resolve) => {
    Store.findOneAndUpdate(
      { _id: bookingData.store },
      { video_slots: newSlots },
      (err, store) => {
        if (err) handleError(err);
        else resolve('Store updated');
      }
    );
  });
}

// updates filled count of slot and calls store update
async function fillSingleSlot(slot, bookingData) {
  console.log('in fill single slot');
  return new Promise((resolve) => {
    let storeSlots;
    Store.findOne({ _id: bookingData.store })
      .populate('slots')
      .exec(async (err, store) => {
        if (err) handleError(err);
        else {
          storeSlots = store.slots;
          console.log('Old Slots: ', storeSlots);
          for (const storeSlot of storeSlots) {
            let newSlots = [];
            console.log('new slots created');
            const dateSlot = new Date(storeSlot.startTime);
            if ((new Date(slot)).getTime() === dateSlot.getTime()) {
              storeSlot.filled =
                Number(storeSlot.filled) + Number(bookingData.visitors);
              newSlots = storeSlots;
              await updateStoreSlots(newSlots, bookingData).then((response) => {
                console.log('Exiting fill single slot');
                resolve(response);
              });
            }
          }
          resolve([]);
        }
      });
  });
}

async function fillSingleVideoSlot(slot, bookingData) {
  console.log('in fill single booking slot');
  return new Promise((resolve) => {
    let storeSlots;
    Store.findOne({ _id: bookingData.store })
      .populate('video_slots')
      .exec(async (err, store) => {
        if (err) handleError(err);
        else {
          storeSlots = store.video_slots;
          console.log('Old Slots: ', storeSlots);
          for (const storeSlot of storeSlots) {
            let newSlots = [];
            console.log('new slots created');
            const dateSlot = new Date(storeSlot.startTime);
            if (new Date(slot).getTime() === dateSlot.getTime()) {
              storeSlot.filled =
                Number(storeSlot.filled) + Number(bookingData.visitors);
              newSlots = storeSlots;
              await updateStoreVideoSlots(newSlots, bookingData).then(
                (response) => {
                  console.log('Exiting fill single slot');
                  resolve(response);
                }
              );
            }
          }
        }
      });
  });
}

// creates slots and calls above 2 functions for each slot
async function fillSlots(bookingData) {
  console.log('visitors to update', bookingData.visitors);
  const bookingEnd = new Date(bookingData.end);
  let start = new Date(bookingData.start).getTime();
  let end = start + 30 * 60 * 1000;

  const slotFillerFunction = fillSingleSlot;
  const slots = [];
  do {
    slots.push(start);
    start = end;
    end += 30 * 60 * 1000;
  } while (end <= bookingEnd);
  for (const slot of slots) {
    await slotFillerFunction(slot, bookingData).then((response) => {
      console.log('Response:', response);
    });
  }
  return;
}

module.exports = fillSlots;
