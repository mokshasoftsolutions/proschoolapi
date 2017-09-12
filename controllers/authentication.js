const jwt = require('jwt-simple');
const User = require('../models/user');
const config = require('../config');
var emailregex = require('regex-email');

function tokenForUser(user) {
	// console.log(user)
	const timestamp = new Date().getTime();
	return jwt.encode({ sub: user._id, unid: user.uniqueId, role:user.role, school_id:user.school_id, iat: timestamp }, "ex23hf9284y9er2ehfbdbvcv83yehrdf8273");
}
exports.signin = function(req, res, next){
	// User has already had their email and password auth'd
	// we just need to give them a token

	res.send({ token: tokenForUser(req.user),role:req.user.role,uniqueId: req.user.uniqueId});
}
exports.signup = function(req, res, next){
	const email = req.body.email;
	const password = req.body.password;
	const uniqueId = req.body.uniqueId;
	const role = req.body.role;
	const school_id = req.body.school_id;

	if (!email || !password){
		return res.status(422).send({ error: 'You must provide email and password' });
	}

	if(emailregex.test(email) != true){
    return res.status(422).send({ error: 'Not a valid email'});
  }

	// See if a user with the given email exists
	User.findOne({ email: email }, function(err, existingUser){
		if (err) { return next (err); }

		// If a user with email does exist, return an error
		if (existingUser) {
			return res.status(422).send({error: 'Email is in use'});
		}

		// If a user with email does Not exists, create and save user record
		const user = new User({
			email: email,
			password: password,
			uniqueId: uniqueId,
			role: role,
			school_id: school_id
		});

		user.save(function(err) {
			if (err) { return next(err); }

			// Respond to request indicating the user was created
			res.json({ token: tokenForUser(user) });
		});
	});

}