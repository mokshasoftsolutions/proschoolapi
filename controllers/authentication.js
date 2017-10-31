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
exports.signin = function (req, res, next) {
	// User has already had their email and password auth'd
	// we just need to give them a token
 
	if (req.user.role == 'parent') {
	  mongo.connect(url, function (err, db) {
		   var collection = db.collection('parents').findOne({"parent_id":  req.user.uniqueId},function(error,resultsData){
         if(resultsData){
			 if (resultsData.students.length > 0) {
	  
			var resultArray = [];
			var count = 0;
			 
				forEach(resultsData.students, function (key, value) {
					var cursor = db.collection('students').findOne({"student_id": key.student_id 
					},function (err, results) {
						if(results){
							resultArray.push(results);
						}
                         count++;
					  	if (count == resultsData.students.length) {
							db.close();
							res.send({
								token: tokenForUser(req.user),
								role: req.user.role,
								uniqueId: req.user.uniqueId,
								school_id: req.user.school_id,
								_id : req.user._id,
								users: resultArray
							});
						}
					})
				 

				})

 
		} else {
			res.send({
				token: tokenForUser(req.user),
				role: req.user.role,
				uniqueId: req.user.uniqueId,
				school_id: req.user.school_id,
				_id : req.user._id,
				users: resultsData.students
			});

		}

		 }else{
			 res.send({
				token: tokenForUser(req.user),
				role: req.user.role,
				uniqueId: req.user.uniqueId,
				school_id: req.user.school_id,
				_id : req.user._id,
				users: []
			});

		 }
		
			});
  		});

	} else {
		res.send({
			token: tokenForUser(req.user),
			role: req.user.role,
			uniqueId: req.user.uniqueId,
			school_id: req.user.school_id,
			_id : req.user._id
		});
	}

}
exports.signup = function (req, res, next) {
	const email = req.body.email;
	const password = req.body.password;
	const uniqueId = req.body.uniqueId;
	const role = req.body.role;
	const school_id = req.body.school_id;

	if (!email || !password) {
		return res.status(422).send({
			error: 'You must provide email and password'
		});
	}

	if (emailregex.test(email) != true) {
		return res.status(422).send({
			error: 'Not a valid email'
		});
	}

	// See if a user with the given email exists
	User.findOne({
		email: email
	}, function (err, existingUser) {
		if (err) {
			return next(err);
		}

		// If a user with email does exist, return an error
		if (existingUser) {
			return res.status(422).send({
				error: 'Email is in use'
			});
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
				return next(err);
			}

			// Respond to request indicating the user was created
			res.json({
				token: tokenForUser(user)
			});
		});
	});

}

exports.checkEmail = function (req, res, next) {
	const email = req.body.email;
 
	// See if a user with the given email exists
	User.findOne({
		email: email
	}, function (err, existingUser) {
		if (err) {
			return next(err);
		}

		// If a user with email does exist, return an error
		if (existingUser) {
			 
			return res.status(200).send({
				error: 'false'
			});
		}else{
           return res.status(200).send({
				error: 'true'
			});
		}

		 
	});

}