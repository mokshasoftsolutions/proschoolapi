// flow
var express = require("express");
var config = require("../config.json");
var bodyParser = require("body-parser");
var api_key = "api-key-KJFSI4924R23RFSDFSD7F94";
var mongo = require('mongodb').MongoClient;
var autoIncrement = require("mongodb-autoincrement");
var assert = require('assert');
var port = process.env.PORT || 4005;
var router = express.Router();
var multer = require('multer');
var url = 'mongodb://' + config.dbhost + ':27017/s_erp_data';
var mailer = require('nodemailer');
var schoolUserModule = require('../api_components/school_registration_user');
var cookieParser = require('cookie-parser');
router.use(function (req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
});

// Add Schools

// Use Smtp Protocol to send Email
var smtpTransport = mailer.createTransport({
    service: "gmail",
    auth: {
        user: "basinahemababu91@gmail.com",
        pass: "Jaasmith@"
    }
});




var storageImage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
        // cb(null, file.originalname);
    }
});

var uploadImage = multer({ //multer settings
    storage: storageImage,
    fileFilter: function (req, file, callback) { //file filter
        if (['jpg', 'png'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
            return callback(new Error('Wrong extension type'));
        }
        callback(null, true);
    }
}).single('file');


router.route('/schools')
    .post(function (req, res, next) {
        var status = 1;
        schools = [];
        uploadImage(req, res, function (err) {
            if (err) {
                res.json({ error_code: 1, err_desc: err });
                return;
            }
            /** Multer gives us file info in req.file object */
            if (!req.file) {
                res.json({ error_code: 1, err_desc: "No file passed" });
                return;
            }
            var SchoolImage = {
                filename: req.file.filename,
                originalname: req.file.originalname,
                imagePath: req.file.path,
                mimetype: req.file.mimetype,
            }
            var item = {
                school_id: 'getauto',
                name: req.body.name,
                // branch_type: req.body.branch_type,
                est_on: req.body.est_on,
                address: req.body.address,
                phone: req.body.phone,
                email: req.body.email,
                website: req.body.website,
                status: status,
            };
            var username = req.body.email;


            var mail = {
                from: "basinahemababu91@gmail.com",
                to: username,
                subject: "Authentication fields for PROSchool ",
                text: "email: "+username+"password : "+username,
                html: "<b> Username :</b>"+username+"<br>"+"<b> Password : </b>"+username
            }

            smtpTransport.sendMail(mail, function (error, response) {
                if (error) {
                    console.log(error);
                } else {
                    console.log("Message sent: ");
                }

                smtpTransport.close();
            });
            mongo.connect(url, function (err, db) {
                autoIncrement.getNextSequence(db, 'schools', function (err, autoIndex) {
                    var collection = db.collection('schools');
                    collection.ensureIndex({
                        "school_id": 1,
                    }, {
                            unique: true
                        }, function (err, result) {
                            if (item.name == null || item.email == null || item.phone == null) {
                                res.end('null');
                            } else {
                                collection.insertOne(item, function (err, result) {
                                    if (err) {
                                        if (err.code == 11000) {
                                            res.end('false');
                                        }
                                        res.end('false');
                                    }
                                    collection.update({
                                        _id: item._id
                                    }, {
                                            $set: {
                                                school_id: 'SCH-927' + autoIndex
                                            },
                                            $push: {
                                                SchoolImage
                                            }
                                        }, function (err, result) {
                                            db.close();
                                            res.end('true');
                                            var userData = {};
                                            userData.email = item.email;
                                            userData.password = item.email;
                                            userData.uniqueId = 'SCH-927' + autoIndex;
                                            userData.role = "admin";
                                            userData.school_id = 'SCH-927' + autoIndex;
                                            schoolUserModule.addAdminToSchool(userData);
                                        });
                                });
                            }
                        });
                });
            });
        });
    })
    .get(function (req, res, next) {
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('schools').find();
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    schools: resultArray
                });
            });
        });
    });



router.route('/school/:school_id')
    .post(function (req, res, next) {
        var school_id = req.params.school_id;
        var name = req.body.name;
        var value = req.body.value;
        mongo.connect(url, function (err, db) {
            db.collection('schools').update({ school_id }, { $set: { [name]: value } }, function (err, result) {
                assert.equal(null, err);
                db.close();
                res.send('true');
            });
        });
    });


module.exports = router;
