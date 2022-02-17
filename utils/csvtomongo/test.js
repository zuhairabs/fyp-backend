const express = require("express"),
	app = express(),
	bodyParser = require("body-parser"),
	mongoose = require("mongoose"),
	csv = require("csv-parser"),
	fs = require("fs"),
	bcrypt = require("bcrypt");

const { customAlphabet, random } = require("nanoid");
const alphabet = "abcdefghijklmnopqrstuvwxyz1234567890";
const nanoid = customAlphabet(alphabet, 7);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
 
// ######################  POST APIS  ###################### 


// #######################  Business CSV  #######################

app.post("/business/csv", (_req, _res) => {
		_res.status(200).send("Success: Business Created Sucessfully");
});

// #########################  Store CSV  #########################

app.post("/store/csv", (req, res) => {
		res.status(200).send("Success: Store created sucessfully");
});

// ########################  Add Logos  ########################

app.post("/logo", (req, res) => {
	res.status(200).json("Success: Added Logo");
});

// #######################  ADD Images  #######################

app.post("/images", (req, res) => {
	res.status(200).json({
		status: "Success: Added all Images",
	});
});

// #######################  ADD Store Description  #######################

app.post("/description", (req, res) => {
	res.status(200).json({
		status: "Done",
	});
});

// #########################  Add Ratings  #########################

app.post("/ratings", (req, res) => {
    res.status(200).json({
		status: "Done",
	});
});

// #######################  Add Location to Store  #######################

app.post("/location", (req, res) => {
    res.status(200).json({
		status: "Done",
	});
});

// #######################  Add Category to Store  #######################

app.post("/addcategory", (req, res) => {
	res.status(200).json({
		status: "Done",
	});
});

// #######################  Add Bookings Nano ID  #######################

app.post("/bookings/nanoid", (req, res) => {
    res.status(200).json({
		status: "Done",
	});
});

// #########################  Add Video Single  #########################

app.post("/video/add", (req, res) => {
    res.status(200).json({
		status: "Done",
	});
});

// ########################  Add Videos CSV  ########################

app.post("/video/csv", (req, res) => {
	res.status(200).json({
		status: "Done",
	});
});

// ######################  Update Links for Youtube  ######################

app.post("/video/links", (req, res) => {
	res.status(200).json({
		status: "Completed",
	});
});


/*

	##################### APP RUN  #####################

*/

app.listen(5000, (_req, _res) => {
	console.log("Server running on PORT", 5000);
});
