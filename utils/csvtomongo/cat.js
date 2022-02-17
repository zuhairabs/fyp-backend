const Category = require("./models/category-schema");

app.post("/csv", (_req, _res) => {
	fs.createReadStream("./csv/rectify.csv")
		.pipe(csv())
		.on("data", (cat) => {
			let tags = cat.tags.toLowerCase().split(",");
      let name = cat.name.toLowerCase();
      Category.findOneAndUpdate(
        { name: name },
        { tags: tags },
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

