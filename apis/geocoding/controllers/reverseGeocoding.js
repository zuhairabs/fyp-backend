const { MAPBOX_TOKEN, MAPBOX_URI } = process.env;
const https = require('https');

const reverseGeocoding = (coordinates) => {
  const { lat, long } = coordinates;
  return new Promise((resolve, reject) => {
    https
      .get(
        `${MAPBOX_URI}/${long},${lat}.json?access_token=${MAPBOX_TOKEN}`,
        (resp) => {
          let response = '';
          resp.on('data', (chunk) => {
            response += chunk;
          });
          resp.on('end', async () => {
            const data = await JSON.parse(response);
            let area = '';
            let city = '';
            if (data.features && data.features[0]) {
              area = data.features[0].text;
              city =
                data.features[0].context[1].text ||
                data.features[0].context[0].text;
            }
            resolve({ area, city });
          });
        }
      )
      .on('error', (err) => {
        reject(err.message);
      });
  });
};

module.exports = reverseGeocoding;
