const admin = require('firebase-admin');
const serviceAccount = require('./shopout-firebase-adminsdk-srijv-270abbdf39.json');
const handleError = require('../error_handling/handler');
// const apn = require('apn');

// var apnProvider = new apn.Provider({
//   cert: __dirname + '/CertificatesShopout.pem', key: __dirname +'/CertificatesKey.pem'
//   , passphrase: 'Shopout@123',
// 	production: true
// });

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://shopout.firebaseio.com',
});

const SOUND_OPTIONS = {
  android: {
    notification: {
      sound: 'default',
    },
    priority: 'high',
  },
  apns: {
    payload: {
      aps: {
        sound: 'default',
      },
    },
  },
};

const dispatchSingleNotification = (
  token,
  title = 'ShopOut',
  body,
  data = {}
) => {
  const message = {
    notification: {
      title,
      body,
    },
    token,
    data,
    ...SOUND_OPTIONS,
  };
  if (token) {
    admin
      .messaging()
      .send(message)
      .catch((e) => {
        handleError(e);
      });
  }
};

const dispatchSingleNotificationApple = (
  token,
  title = 'ShopOut',
  body,
  data = {}
) => {
  console.log(100);
  // var note = new apn.Notification();

  // note.expiry = Math.floor(Date.now() / 1000) + 7200; // Expires 2 hours from now.
  // note.badge = 1;
  // note.sound = "default";
  // note.alert = {title: title, body: body};
  // note.host = "ssl://gateway.push.apple.com:2195"
  // note.topic = "org.reactjs.native.example.shopoutuser.voip";
  // note.payload = { ...data };

  // if(token){
  //   apnProvider.send(note, token).then((result) => {
  //     console.log(result);
  //   });
  // }
};

module.exports.dispatchSingleNotification = dispatchSingleNotification;
module.exports.dispatchSingleNotificationApple =
  dispatchSingleNotificationApple;
