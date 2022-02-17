const router = require("express").Router();
const bodyParser = require("body-parser");
const https = require("https");
const csv = require("csv-parser"),
	fs = require("fs");

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

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.post("/index/tags", async (req, res) => {
	const businesses = await Business.find({}).populate("stores");
	businesses.forEach((business) => {
		const store = business.stores[0];
		const { tags } = store;
		tags.forEach(async (name) => {
			const foundTag = await Tag.findOne({ name });
			if (foundTag) {
				console.log("Tag already exists", foundTag && foundTag.name);
			} else {
				const newTag = new Tag({ name });
				newTag.save();
				console.log(`Saved new tag ${name}`);
			}
		});
	});
	// const videos = await Video.find({});
	// videos.forEach((video) => {
	// 	const { tags } = video;
	// 	tags.forEach(async (name) => {
	// 		const foundTag = await Tag.findOne({ name });
	// 		if (foundTag) {
	// 			console.log("Tag already exists", foundTag && foundTag.name);
	// 		} else {
	// 			const newTag = new Tag({ name });
	// 			newTag.save();
	// 			console.log(`Saved new tag ${name}`);
	// 		}
	// 	});
	// });
});

router.post("/construct/tags", async (req, res) => {
	fs.createReadStream("tags.csv")
		.pipe(csv())
		.on("data", async (business) => {
			const { name, category } = business;
			// const tags = business.tags.split(",");
			const brands = business.brands.split(",");
			// const temp = [...tags, ...brands, category, name];
			// const data = await temp.reduce((unique, item) => {
			// 	const trimmed = item.toLowerCase().trim();
			// 	return unique.includes(trimmed) ? unique : [...unique, trimmed];
			// }, []);
			// const { stores } = await Business.findOne({ name });
			// stores.forEach(async (store) => {
			// 	const found = await Store.findOne({ _id: store });
			// 	found.tags = [...data, found.name, found.location_desc];
			// 	found.save();
			// 	console.log(`Updated tags for ${found.name} ${name}`);
			// });
			const data = await brands.reduce((unique, item) => {
				const trimmed = item.toLowerCase().trim();
				return unique.includes(trimmed) ? unique : [...unique, trimmed];
			}, []);
			await Business.findOneAndUpdate({ name }, { brands: data });
			console.log(`Updated brands for ${name}`);
		})
		.on("end", () => {
			res.status(200).json({ response: "CSV file successfully processed" });
		});
});

router.post("/construct/tags/video", async (req, res) => {
	const videos = await Video.find({}).populate("business");
	videos.forEach(async (video) => {
		// const { tags, brands, category, name } = video.business;
		// const temp = [...tags, ...brands, category, name];
		// const data = await temp.reduce((unique, item) => {
		// 	const trimmed = item.toLowerCase().trim();
		// 	return unique.includes(trimmed) ? unique : [...unique, trimmed];
		// }, []);
		const { tags, name } = video.business;
		video.tags = tags;
		video.save();
		console.log(`Populated tags for ${name}'s video ${video.title}`);
	});
	res.status(200).json({ response: "OK" });
});

router.post("/construct/tags/related", async (req, res) => {
	// try {
	// 	const businesses = await Business.find({});
	// 	businesses.forEach(async ({ _id, name }) => {
	// 		const videos = await Video.find({ business: _id });
	// 		videos.forEach(({ tags }) => {
	// 			tags.forEach(async (tag) => {
	// 				const saved = await Tag.findOne({ name: tag });
	// 				saved.related.push(name);
	// 				saved.save();
	// 				console.log(`Businesses updated for ${tag}`);
	// 			});
	// 		});
	// 	});
	// } catch (e) {
	// 	console.log(e);
	// }
	try {
		const tags = await Tag.find({});
		let i = 0;
		tags.forEach(async (tag) => {
			++i;
			const { related, name } = tag;
			const temp = related;
			const data = await temp.reduce((unique, item) => {
				const trimmed = item.toLowerCase().trim();
				return unique.includes(trimmed) || item === name
					? unique
					: [...unique, trimmed];
			}, []);
			tag.related = data;
			tag.save();
			console.log(`Filtered duplicates in ${name}`);
		});
		console.log({ i });
	} catch (e) {
		console.log(e);
	}
});

// ZUHAIR_API = AIzaSyA32ohOnDkx67VeyorHKWxuHOc1ItPxFRM

const YT_API = {
	KEY: "AIzaSyA32ohOnDkx67VeyorHKWxuHOc1ItPxFRM",
	URI: {
		SNIPPET: "www.googleapis.com/youtube/v3/videos?part=snippet",
	},
};

router.post("/video/details", async (req, res) => {
	const videos = await Video.find({});
	videos.forEach((video) => {
		const options = {
			host: "www.googleapis.com",
			path: `/youtube/v3/videos?part=snippet&id=${video.source}&key=${YT_API.KEY}`,
			method: "GET",
			headers: {
				"content-type": "application/JSON",
			},
		};
		https
			.request(options, (response) => {
				let videoDetails = "";
				response.on("data", (chunk) => {
					videoDetails += chunk;
				});
				response.on("end", () => {
					const details = JSON.parse(videoDetails);
					if (false)
						console.log(details.items[0]);
					else{
					console.log(video.source);
					const { snippet } = details.items[0];
					if (snippet) {
						const { title, description, thumbnails, tags } = snippet;
						const thumbnail = thumbnails.high.url;
						video.update(
							{ title, description, thumbnail },
							async (err, saved) => {
								if (err) res.status(500);
								else {
									if (tags) {
										const temp = [...tags, ...video.tags];
										const data = await temp.reduce((unique, item) => {
											const trimmed = item.toLowerCase().trim();
											return unique.includes(trimmed)
												? unique
												: [...unique, trimmed];
										}, []);
										video.tags = data;
										video.save();
										console.log("Added details for video", title);
									}
								}
							}
						);
					}}
				});
			})
			.end();
	});
	res.status(200).json({ response: "OK" });
});



router.post("/rectify/video", async (req, res) => {
	const videos = await Video.find({});
	videos.forEach((video) => {
		const options = {
			host: "www.googleapis.com",
			path: `/youtube/v3/videos?part=snippet&id=${video.source}&key=${YT_API.KEY}`,
			method: "GET",
			headers: {
				"content-type": "application/JSON",
			},
		};
		https
			.request(options, (response) => {
				let videoDetails = "";
				response.on("data", (chunk) => {
					videoDetails += chunk;
				});
				response.on("end", () => {
					const details = JSON.parse(videoDetails);
					if (false)
						console.log(details.items[0]);
					else{
					console.log(video.source);
					if(details.items[0]){
					const { snippet } = details.items[0];
					if (snippet) {
						const { title, description, thumbnails, tags } = snippet;
						const thumbnail = thumbnails.high.url;
						video.update(
							{ title, description, thumbnail },
							async (err, saved) => {
								if (err) res.status(500);
								else {
									console.log("updated");
								}
							}
						);
					}}
					else{
						console.log(details.items[0],details,video);
					}}
				});
			})
			.end();
	});
	res.status(200).json({ response: "OK" });
});


module.exports = router;
