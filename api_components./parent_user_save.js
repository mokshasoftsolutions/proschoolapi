const jwt = require('jwt-simple');
const User = require('../models/user');
const config = require('../config');
var express = require("express");
var config1 = require("../config.json");
var emailregex = require('regex-email');
var port = process.env.PORT || 4005;
var router = express.Router();
var mongo = require('mongodb').MongoClient;
var url = 'mongodb://' + config1.dbhost + ':27017/s_erp_data';
var forEach = require('async-foreach').forEach;
var ObjectID = require('mongodb').ObjectID;
var parentUserModule = function() {};
function tokenForUser(user) {
	// console.log(user)
	const timestamp = new Date().getTime();
	return jwt.encode({
		sub: user._id,
		unid: user.uniqueId,
		role: user.role,
		school_id: user.school_id,
		iat: timestamp
	}, "ex23hf9284y9er2ehfbdbvcv83yehrdf8273");
}
 
parentUserModule.prototype.parentUserModuleSave = function (req) {
	const email = req.email;
	const password = req.password.toLowerCase();
	const uniqueId = req.uniqueId;
	const role = req.role;
	const school_id = req.school_id;

	if (!email || !password) {
		// return res.status(422).send({
		// 	error: 'You must provide email and password'
		// });
	}

	if (emailregex.test(email) != true) {
		// return res.status(422).send({
		// 	error: 'Not a valid email'
		// });
	}

	// See if a user with the given email exists
	User.findOne({
		email: email
	}, function (err, existingUser) {
		if (err) {
			// return next(err);
		}

		// If a user with email does exist, return an error
		if (existingUser) {
			// return res.status(422).send({
			// 	error: 'Email is in use'
			// });
		}

		// If a user with email does Not exists, create and save user record
		const user = new User({
			email: email,
			password: password,
			uniqueId: uniqueId,
			role: role,
			school_id: school_id
		});

		user.save(function (err) {
			if (err) {
				// return next(err);
			}

			// Respond to request indicating the user was created
			// res.json({
			// 	token: tokenForUser(user)
			// });
		});
	});

}
module.exports = new parentUserModule();