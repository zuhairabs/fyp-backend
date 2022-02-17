require('dotenv').config();

// PACKAGE IMPORTS
const express = require('express');

const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');

// ROUTE IMPORTS
const userRoute = require('./routes/user/user-route');
const storeRoute = require('./routes/store/store-route');
const rtcVideo = require('./routes/rtc-video/rtc-video');
const apiRoute = require('./apis');
const notificationScript = require('./utils/notification-scheduler');
const {
  dispatchSingleNotification,
} = require('./utils/notification-dispatcher');

// Security and HTTP headers
app.use(helmet());

// Compress request and response
app.use(compression());

// PARSING PROTOCOLS
// should use express instead of bodyParser as bodyParser is now depracated.
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// NoSQL injection sanitization
app.use(mongoSanitize());

// XSS sanitizing
app.use(xss());

// ROUTER VAR
app.use('/user', userRoute);
app.use('/store', storeRoute);
app.use('/rtc-video', rtcVideo);
app.use('/external', apiRoute);

const { DB_PRODUCTION } = process.env;
const PORT = process.env.PORT * 1 || 5000;

mongoose.connect(
  DB_PRODUCTION,
  {
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  },
  (err) => {
    if (err) console.error(`Error!${err}`);
    else console.log('Database connection successful');
  }
);

notificationScript();

// dummy notification
app.post('/dummyNot', (req, res) => {
  // eslint-disable-next-line object-curly-newline
  const { token, title, body, bookingId, archive, type } = req.body;
  dispatchSingleNotification(token, title, body, {
    booking: bookingId,
    archived: archive,
    type,
  });
  res.status(200).json({ sent: true });
});

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
