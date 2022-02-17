const express = require("express"),
	app = express(),
  mongoose = require("mongoose");


  const createCsvWriter = require('csv-writer').createObjectCsvWriter;
  const csvWriter = createCsvWriter({
    path: 'try.csv',
    header: [
      {id: 'catName', title: 'First Name'},
      { id: 'icon', title: 'Last Name'},
      { id: 'tags', title: 'Phone' },
      { id: 'business', title: 'Email' },
    ]
  });

  const data = [];




// DB_URL = mongodb+srv://datacquity:Welcome123%21%40%23@safeq-xbfjy.mongodb.net/safeq?retryWrites=true&w=majority
// DB_PRODUCTION = mongodb+srv://shopout_prod:shopout123@cluster0.gg9ol.mongodb.net/shopout?authSource=admin&replicaSet=atlas-dj6v6s-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true

const db_uri =
	"mongodb+srv://shopout_prod:shopout123@cluster0.gg9ol.mongodb.net/shopout?authSource=admin&replicaSet=atlas-dj6v6s-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true";
mongoose.connect(
	db_uri,
	{ useFindAndModify: false, useNewUrlParser: true, useUnifiedTopology: true },
	(err) => {
		if (err) console.error("Error!" + err);
		else console.log("Database connection successfull");
	}
);


const Store = require("./models/store-schema"),
	Booking = require("./models/booking-schema"),
	Business = require("./models/business-schema"),
	Video = require("./models/video-schema"),
	User = require("./models/user-schema");
const Category = require("./models/category-schema");


const sendSummary = (res) => {
  const r = new RegExp(/M$/);
  var x=0;
	var a = new Date();a.setHours(12,00,00,000);
  User.find({}).exec((error,result) => {
          result.forEach((item) => {
            
							data.push({
                catName: item.firstName,
                icon: item.lastName,
                tags: item.phone,
								business: item.email
              })
          });
          //if (x==0)console.log(result);


          csvWriter
          .writeRecords(data)
          .then(()=> console.log('The CSV file was written successfully'));

          });
}

sendSummary()

app.listen(process.env.PORT || 4000, (_req, _res) => {
	console.log("Server running on PORT", 4000);
});
