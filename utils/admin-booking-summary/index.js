const express = require("express"),
	app = express(),
  	mongoose = require("mongoose"),
	bcrypt = require("bcrypt");
	createCsvWriter = require('csv-writer').createObjectCsvWriter;


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


var bodyParser = require('body-parser');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(express.static('./'));

const Store = require("./models/store-schema"),
	Booking = require("./models/booking-schema"),
	Product = require("./models/product-schema"),
	Event = require("./models/event-schema"),
	Payment = require("./models/payment-schema"),
	Business = require("./models/business-schema"),
	Order = require("./models/order-schema"),
	User = require("./models/user-schema");


const sendSummary = (res) => {
  var today = new Date();
  var tomorrow = new Date(today.getTime() + (24 * 60 * 60 * 1000));

  Booking.find({start:{$gt: today, $lt: tomorrow}})
          .populate({
						path: 'store',
						select: 'name phone business',
						populate: {
							path: 'business',
							select: 'name'
						}
					})
          .populate('user', 'firstName lastName phone')
          .exec((error,result) => {
		console.log(result,error);
    let text = `<table border=1>
        <tr>
        <th> Booking ID </th>
        <th> Type </th>
        <th> Store </th>
        <th> User </th>
        <th> Timing </th>
        </tr>`
        + result.map(o => {
					console.log(o);
        return `<tr>
                <td> ${o.bookingId} </td>
                <td> ${o.type} </td>
                <td> ${o.store.business.name} ${o.store.name} <br> ${o.store.phone} </td>
                <td> ${o.user.firstName} <br> ${o.user.lastName} <br> ${o.user.phone} </td>
                <td> ${(new Date(o.start.getTime() + 330*60000)).toLocaleString()} </td>
                </tr>`;
    }).join(" ") + "</table>";

		res.send((result.length>0)?text:"No bookings for tomorrow");

  });

}

app.get('/', (req,res) => {
	sendSummary(res);
	bcrypt.hash("shopout@123", 12).then((e) => console.log(e))
});

app.get('/report', (req,res) => {
	res.sendFile(__dirname+'/report.html');
});

const settingProduct = async (result) => {
	let arr=[]
	const promises = result.map(async o => {
		const x = await Product.findById({ _id: o.response.result.udf1 })
			.populate({
				path: 'event',
				select: '_id business demoName',
				populate: {
					path: 'business',
					select: 'name'
				}
			});
			arr = [...arr, x];
		});
	return Promise.all(promises).then(()=>arr);
}


app.post('/report', urlencodedParser, async (req,res) => {

	const csvWriter = createCsvWriter({
		path: 'try.csv',
		header: [
			{ id: 'd', title: 'Date' },
			{ id: 'o', title: 'Order ID' },
			{ id: 'pay', title: 'Payment ID' },
			{ id: 's', title: 'Status' },
			{ id: 'u', title: 'User' },
			{ id: 'up', title: 'User Phone' },
			{ id: 'p', title: 'Product' },
			{ id: 'pi', title: 'Product ID' },
			{ id: 'a', title: 'Amount' },
			{ id: 'e', title: 'Event' },
			{ id: 'b', title: 'Business' },
		]
	});



	//console.log(req);
	const s = new Date(req.body.s);
	const e = new Date(req.body.e);
	const p = req.body.p;
	const data = [];
	if (p !== "Shopout@123")
		res.send("Wrong passcode");
	else{
		Payment.find({ "response.result.createdOn" : { $gt: s, $lt: e } })
		.exec(async (err, result) => {
			const events = await settingProduct(result);
			//console.log(result);
			let text = `<table border=1>
        <tr>
        <th> Date </th>
        <th> Order ID </th>
        <th> Payment ID </th>
        <th> Payment Status </th>
        <th> User </th>
        <th> User Phone </th>
        <th> Product </th>
        <th> Product ID </th>
        <th> Amount </th>
        <th> Event </th>
        <th> Business Name </th>
        </tr>`
				+ result.map((o,i) => {
					console.log(events[i].event._id);

					data.push({
						d: o.response.result.createdOn.toLocaleString(),
						o: o.response.result.txnid,
						pay: o.response.result.paymentId,
						s: o.response.result.status,
						u: o.response.result.firstname,  
						up: o.response.result.phone,
						p: o.response.result.productinfo,
						pi: o.response.result.udf1,
						a: o.response.result.amount,
						e: events[i].event.demoName,
						b: events[i].event.business.name,
					})

					return `<tr>
								<td> ${o.response.result.createdOn.toLocaleString()} </td>
								<td> ${o.response.result.txnid} </td>
								<td> ${o.response.result.paymentId} </td>
								<td> ${o.response.result.status} </td>
								<td> ${o.response.result.firstname}</td>
								<td> ${o.response.result.phone} </td>
								<td> ${o.response.result.productinfo} </td>
								<td> ${o.response.result.udf1} </td>
								<td> ${o.response.result.amount} </td>
								<td> ${events[i].event.demoName} </td>
								<td> ${events[i].event.business.name} </td>
								
							</tr>`;
							}).join(" ") + "</table>";
			

			text += "<a href = 'try.csv' download>Download as excel</a>";

			csvWriter
				.writeRecords(data)
				.then(() =>{ 
					console.log('The CSV file was written successfully')
					res.send((result.length > 0) ? text : "No payments were made in the specified duration");
				});
			
			//console.log(text);
		});
	}
});

app.listen(process.env.PORT || 5000, (_req, _res) => {
	console.log("Server running on PORT", 5000);
});
