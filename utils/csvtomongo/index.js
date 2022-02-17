const express = require("express"),
	app = express(),
	bodyParser = require("body-parser"),
	mongoose = require("mongoose"),
	csv = require("csv-parser"),
	fs = require("fs"),
	bcrypt = require("bcrypt");

app.use("/db", require("./dbChange"));
const { customAlphabet, random } = require("nanoid");
const alphabet = "abcdefghijklmnopqrstuvwxyz1234567890";
const nanoid = customAlphabet(alphabet, 7);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ########################  DB URI  ########################
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

// ########################  Schema  ########################

const Store = require("./models/store-schema"),
	Business = require("./models/business-schema"),
	Brand = require("./models/brand-schema"),
	Tag = require("./models/tag-schema"),
	Category = require("./models/category-schema"),
	Booking = require("./models/booking-schema"),
	ArchiveBookings = require("./models/archive-booking-schema"),
	Video = require("./models/video-schema"),
	Product = require("./models/product-schema"),
	User = require("./models/user-schema");

// #######################  ADD Scripts  #######################

const addCategory = (category, business) => {
	Category.findOneAndUpdate(
		{ name: category.trim() },
		{ name: category.trim(), $push: { businesses: business } },
		{ upsert: true },
		(err, savedCategory) => {
			if (err) console.error(err);
			else console.log(savedCategory);
		}
	);
};

const addTags = (tags, business) => {
	tags.forEach((tag) => {
		Tag.findOneAndUpdate(
			{ name: tag.trim() },
			{ name: tag.trim(), $push: { businesses: business } },
			{ upsert: true },
			(err, savedTag) => {
				if (err) console.error(err);
				else console.log(savedTag);
			}
		);
	});
};

const addBrands = (brands, business) => {
	brands.forEach((brand) => {
		Brand.findOneAndUpdate(
			{ name: brand.trim() },
			{ name: brand.trim(), $push: { businesses: business } },
			{ upsert: true },
			(err, savedBrand) => {
				if (err) console.error(err);
				else console.log(savedBrand);
			}
		);
	});
};

const addProducts = (products, business) => {
	products.forEach((product) => {
		Product.findOneAndUpdate(
			{ name: product.trim() },
			{ name: product.trim(), $push: { business: business } },
			{ upsert: true },
			(err, savedProduct) => {
				if (err) console.error(err);
				else
					console.log(
						`Saved new product ${savedProduct.name} in ${business.name}`
					);
			}
		);
	});
};

/*

	######################  POST APIS  ######################

*/

// #######################  Business CSV  #######################

app.post("/business/csv", (_req, _res) => {
	fs.createReadStream("./csv/business.csv")
		.pipe(csv())
		.on("data", (business) => {
			let tags = business.tags.toLowerCase().split(",");
			let brands = business.brands.toLowerCase().split(",");
			let category = business.category.toLowerCase();
			let name = business.name.toLowerCase();

			let newBusiness = new Business({
				name: name,
				phone: business.phone,
				email: business.email,
				password: "shopout@123",
				logo: business.logo,
				description: business.description,
				images: [],
				tags: [...tags, category],
				brands: brands,
				category: category,
				display_name: business.display_name,
			});

			newBusiness.save((err, savedBusiness) => {
				if (err) {
					console.error(err);
				}
				else if (savedBusiness) {
					let businessID = savedBusiness._id;
					console.log("Business ID:", businessID);

					addCategory(category, businessID);
					addTags(tags, businessID);
					addBrands(brands, businessID);
				}
			});
		})
		.on("end", () => {
			console.log("CSV file successfully processed");
			_res.status(200).send("Success: Business Created Sucessfully");
		});
});

// #########################  Store CSV  #########################

app.post("/store/csv", (req, res) => {
	fs.createReadStream("./csv/store.csv")
		.pipe(csv())
		.on("data", (store) => {
			bcrypt.hash("shopout@123", 12).then((hashedPassword) => {
				let business = store.business.toLowerCase();
				let working_days;
				if(store.working_days.length == 6) {
					working_days = [1,2,3,4,5,6];
				} else {
					working_days = [1,2,3,4,5,6,7];
				}

				Business.findOne({ name: business }, (err, foundBusiness) => {
					if (err) console.error(err);
					else if (foundBusiness) {
						let newStore = new Store({
							name: store.name,
							business: foundBusiness._id,
							tags: foundBusiness.tags,
							description: foundBusiness.description,
							category: foundBusiness.category,
							images: [],
							avg_rating: 4,
							phone: store.phone,
							password: hashedPassword,
							email: store.email,
							physical_enabled: store.physical_enabled,
							virtual_enabled: store.virtual_enabled,
							capacity: store.capacity,
							working_days: working_days,
							parameters: [
								{
									title: 'Mandatory Masks',
									rating: 0,
									numberOfRatings: 0,
								},
								{
									title: 'Social Distancing',
									rating: 0,
									numberOfRatings: 0,
								},
								{
									title: 'Shop Sanitization',
									rating: 0,
									numberOfRatings: 0,
								},
								{
									title: 'Temperature Checks',
									rating: 0,
									numberOfRatings: 0,
								},
								{
									title: 'ePayment Options',
									rating: 0,
									numberOfRatings: 0,
								},
							],
							location_desc: store.location_desc,
							location: {
								type: "Point",
								coordinates: [store.long, store.lat],
							},
							city: store.city,
							active_hours: [
								{
									start: store.start,
									end: store.end,
								},
							],
						});
						newStore.save((err, savedStore) => {
							if (err) {
								console.error("Error before finding store", err);
							}
							else {
								Business.findOneAndUpdate(
									{ name: business },
									{ $push: { stores: savedStore._id } },
									(err, savedBusiness) => {
										if (err) console.error(err);
										else console.log("Saved a Store for", savedBusiness.name);
									}
								);
							}
						});
					}
				}); //end of business save
			}); // end of bcrypt
		}) // end of on data
		.on("end", () => {
			console.log("CSV file successfully processed");
			res.status(200).send("Success: Stores Added Sucessfully");
		});
});

// ########################  Add Logos  ########################

app.post("/logo", (req, res) => {
	let business = req.body.company;
	fs.readFile("./logos/" + business + ".png", (err, logo) => {
		let logo64 = logo.toString("base64");
		Business.findOneAndUpdate(
			{ name: business },
			{ logo: logo64 },
			(err, updatedBusiness) => {
				if (err) {
					console.error(err);
				}
				else console.log("Added logo for", updatedBusiness);
			}
		);
	});
	res.status(200).json({
		status: "Success: Added Logo",
	});
});

// #######################  ADD Images  #######################

app.post("/images", (req, res) => {
	let business = "Janmaakshar".toLowerCase();
	let image_name="j";
	for (let i = 3; i < 5; i++) {
		fs.readFile("./imaages/" + image_name + i + ".png", (err, img) => {
			if (err) console.error(err);
			else {
				let img64 = img.toString("base64");
				Business.findOneAndUpdate(
					{ name: business },
					{ $push: { images: img64 } },
					(err, updatedBusiness) => {
						if (err) console.error(err);
						else console.log("Added an image for", updatedBusiness.name);
					}
				);
			}
		});
	}
	fs.readFile("./imaages/" + image_name + "1.jpg", (err, img) => {
		if (err) console.error(err);
		else {
			let img64 = img.toString("base64");
			Business.findOneAndUpdate(
				{ name: business },
				{ title_image: img64 },
				(err, updatedBusiness) => {
					if (err) console.error(err);
					else console.log("Added an Title for", updatedBusiness.name);
				}
			);
		}
	});
	res.status(200).json("Success: Added all Images");
});

// #######################  ADD Store Description  #######################

app.post("/description", (req, res) => {
	let business = req.body.business;
	let desc = req.body.desc;
	Store.updateMany(
		{ business: business },
		{ description: desc },
		(err, updated) => {
			if (err) console.error(err);
			else console.log(business);
		}
	);
	res.status(200).json({
		status: "Done",
	});
});

// #########################  Add Ratings  #########################

app.post("/ratings", (req, res) => {
	let business = req.body.business;
	Business.findOne({ name: business }, (err, foundBusiness) => {
		let stores = foundBusiness.stores;
		stores.forEach((store) => {
			Store.findOneAndUpdate(
				{ _id: store },
				{ avg_rating: Math.floor((Math.random() + 4) * 10) / 10 },
				(err, updated) => {
					if (err) console.error(err);
					else console.log(updated.name, business, updated.avg_rating);
				}
			);
		});
	});
});

// #######################  Add Location to Store  #######################

app.post("/location", (req, res) => {
	let location = req.body.location;
	let mall = req.body.mall;
	let coordinates = [location.long, location.lat];
	Store.updateMany(
		{ name: mall },
		{ location: { type: "Point", coordinates: coordinates } },
		(err, updatedStore) => {
			if (err) console.log(err);
			else console.log(updatedStore.name);
		}
	);
});

// #######################  Add Category to Store  #######################

app.post("/addcategory", (req, res) => {
	Business.findOne({ name: req.body.business }).exec((err, business) => {
		if (err) console.log(err);
		else if (business) {
			let stores = business.stores;
			stores.forEach((store) => {
				Store.findOneAndUpdate(
					{ _id: store },
					{ category: business.category }
				).exec((err, updated) => {
					if (err) console.log(err);
					else
						console.log(
							updated.name,
							" ",
							business.name,
							" ",
							business.category
						);
				});
			});
		} else console.log("Not found");
	});
});

// #######################  Add Bookings Nano ID  #######################

app.post("/bookings/nanoid", (req, res) => {
	ArchiveBookings.find({}).exec((err, bookings) => {
		if (err) console.log(err);
		else {
			bookings.forEach(async (booking) => {
				if (booking) {
					booking.bookingId = nanoid().toUpperCase();
					await booking.save();
					console.log(`booking updated ${booking.bookingId}`);
				}
			});
		}
	});
});

// #########################  Add Video Single  #########################

app.post("/video/add", (req, res) => {
	let { source, business, tag } = req.body.videoData;
	let video = new Video({
		source,
		business,
		tag,
	});
	video.save((err, savedVideo) => {
		if (err) res.status(500).json({ message: err });
		else
			res.status(200).json({ message: "Saved a new video", video: savedVideo });
	});
});

// ########################  Add Videos CSV  ########################

app.post("/video/csv", (req, res) => {
	fs.createReadStream("./csv/videos.csv")
		.pipe(csv())
		.on("data", (video) => {
			let business = video.business.toLowerCase();
			// let tags = video.tags.split(",");
			//let source = video.source.split("=")[1];

			Business.findOne({ name: business }, (err, foundBusiness) => {
				if (err) console.log(err);
				else if (foundBusiness) {
					Brand.findOne({ name: business }, (err, foundBrand) => {
						if (err) console.log(err);
						else if (foundBrand) {
							let newVideo = new Video({
								brand: foundBrand._id,
								business: foundBusiness._id,
								tags: foundBusiness.tags,
								source: video.source,
								category: foundBusiness.category,
								likes: randomNumber(500, 1000),
								dislikes: randomNumber(0, 40),
							});
							newVideo.save((err, saved) => {
								if (saved)
									console.log(
										"Saved a new video for",
										foundBusiness.display_name
									);
							});
						} else addBrands([business], foundBusiness._id);
					});
				} else console.log(`Business ${business} not found`);
			});
		})
		.on("end", () => {
			console.log("CSV file successfully processed");
			res.status(200).send("Success: Videos Added Sucessfully");
		});
});

// ######################  Update Links for Youtube  ######################

app.post("/video/links", (req, res) => {
	const { business, link } = req.body;
	Business.findOne({ name: business }, (err, foundBusiness) => {
		if (err) console.log(err);
		else if (foundBusiness) {
			Video.find({ business: foundBusiness._id }, (err, foundVideos) => {
				foundVideos.forEach(async (video) => {
					video.link = link;
					await video.save();
					console.log(`Link updated for ${business}'s video ${video.source}`);
				});
			});
		}
	});
	res.status(200).json({
		status: "Completed",
	});
});


// #######################  Category rectify ####################

app.post("/cat/csv", (_req, _res) => {
	fs.createReadStream("./csv/rectify.csv")
		.pipe(csv())
		.on("data", (cat) => {
			let tags = cat.tags.toLowerCase().split(",");
      let name = cat.name.toLowerCase();
			console.log(tags);
			console.log(name);
      Category.findOneAndUpdate(
        { name: name },
        { tag: tags },
        (err, updatedBusiness) => {
          if (err) console.error(err);
          else console.log("Added tags for", updatedBusiness.name);
        }
      );
		})
		.on("end", () => {
			console.log("CSV file successfully processed");
			_res.status(200).send("Success: Business Created Sucessfully");
		});
});



// #######################  Category revise ####################

app.post("/revcat/csv", (_req, _res) => {
	fs.createReadStream("./csv/revised.csv")
		.pipe(csv())
		.on("data", (cat) => {
			let tags = cat.Tags.toLowerCase().split(",");
			let name = cat.Name.toLowerCase();
			let newCat = cat.New.toLowerCase();
			let cate = cat.Category.toLowerCase();
			// console.log(tags);
			console.log(name);
			// console.log(newCat);
			if(name!=''){
			Business.findOneAndUpdate(
				{ name: name },
				{ tag: tags, category:newCat, oldCategory: cate },
				(err, updatedBusiness) => {
					if (err) console.error(err);
					else if(!updatedBusiness) console.log("failed for", name)
					else{
					console.log("Added tags for", updatedBusiness.name);
					Store.updateMany({business: updatedBusiness._id},{categotry: newCat, oldCategory: cate, tags: tags},
						(err, res) => {
							console.log(res);
						});
					}
				}
			);
		}
		})
		.on("end", () => {
			console.log("CSV file successfully processed");
			_res.status(200).send("Success: Business Created Sucessfully");
		});
});



app.post("/newCat/csv", (_req, _res) => {
	fs.createReadStream("./csv/newCat.csv")
		.pipe(csv())
		.on("data", (cat) => {
			let tags = cat.Tags.toLowerCase().split(",");
			let name = cat.Cat.toLowerCase();
			let icon = cat.Icons.toLowerCase();

			fs.readFile("./imaages/" + icon, (err, img) => {
				if (err) console.error(err);
				else {
					let img64 = img.toString("base64");

					const category = new Category({
						name: name,
						tag: tags,
						business: [],
						videos: [],
						icon: img64
					});

					category.save((err, savedCat) => {
						if (err) {
							console.error(err);
						}
						else if (savedCat) {
							let catID = savedCat._id;
							console.log("Cat added:", savedCat.name);

							//addBusiness(savedCat.name, savedCat._id);
						}
					});

				}
			});

		})
		.on("end", () => {
			console.log("CSV file successfully processed");
			_res.status(200).send("Success: Business Created Sucessfully");
		});
});




// ########################  Not to Use  ########################

const randomNumber = (min = 0, max = 1) =>
	Math.floor(Math.random() * (max - min) + min);

Date.prototype.addDays = function (days) {
	var date = new Date(this.valueOf());
	date.setDate(date.getDate() + days);
	return date;
};

// NOT WORKING!!
app.post("/booking/random", async (req, res) => {
	const { date, store } = req.body;
	const types = ["walk-in", "virtual"];
	for (let i = 0; i < 3; ++i) {
		const start = new Date(date);
		const end = new Date(start.getTime() + 1000 * 60 * 30);
		const user = (await User.aggregate([{ $sample: { size: 1 } }]))[0];
		if (user) {
			const newBooking = new Booking({
				store,
				user: user._id,
				start,
				end,
				visitors: randomNumber(1, 5),
				type: types[randomNumber(0, 1)],
			});
			newBooking.save(async (err, booking) => {
				if (err) console.log(err);
				else {
					await User.findOneAndUpdate(
						{ _id: user._id },
						{ $push: { bookings: booking._id } }
					);
					await Store.findOneAndUpdate(
						{ _id: store },
						{ $push: { bookings: booking._id } }
					);
					console.log(
						`Added a new booking for ${start.toDateString()} for ${
							user.firstName
						}`
					);
				}
			});
		}
	}
	res.status(200).json("DONE");
});


/*

	##################### TIME RECTIFY  #####################

*/

app.post("/rectify/time", (req, res) => {
	fs.createReadStream("./csv/time.csv")
		.pipe(csv())
		.on("data",async (store) => {
				let phone = store.phone.trim();
				let x=0;
				let temp = await Store.findOne({ phone: phone });
				Store.findOneAndUpdate({ phone: phone },
							{
								active_hours: [
									{
										start: temp.active_hours[0].start,
										end: store.end.trim()
									},
								]
							}
						).then(() => {
							x+=1;
							console.log("done", x, store.name);
						}).catch(err => console.log(err));
		}) // end of on data
		.on("end", () => {
			console.log("CSV file successfully processed");
			res.status(200).send("Success: Stores Added Sucessfully");
		});
});




/*

	##################### APP RUN  #####################

*/

app.listen(5000, (_req, _res) => {
	console.log("Server running on PORT", 5000);
});
