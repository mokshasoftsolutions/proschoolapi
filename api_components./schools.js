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
// var mailer = require('nodemailer');
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
// var smtpTransport = mailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: "basinahemababu91@gmail.com",
//         pass: "Jaasmith@"
//     }
// });

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
                est_on: req.body.est_on,
                address: req.body.address,
                phone: req.body.phone,
                email: req.body.email,
                website: req.body.website,
                academic_year: req.body.academic_year,
                description: req.body.description,
                founder: req.body.founder,
                chairman: req.body.chairman,
                vice_principal: req.body.vice_principal,
                extra_curricular_activites: req.body.extra_curricular_activites,
                coordinator: req.body.coordinator,
                principal: req.body.principal,
                alternate_phone: req.body.alternate_phone,
                class_from: req.body.class_from,
                timings: req.body.timings,
                alternate_email: req.body.alternate_email,
                medium: req.body.medium,
                facilities_available: req.body.facilities_available,
                afflication: req.body.afflication,
                status: status,
            };
            var username = req.body.email;
            // var mail = {
            //     from: "basinahemababu91@gmail.com",
            //     to: username,
            //     subject: "Authentication fields for PROSchool ",
            //     text: "email: " + username + "password : " + username,
            //     html: "<b> Username :</b>" + username + "<br>" + "<b> Password : </b>" + username
            // }

            // smtpTransport.sendMail(mail, function (error, response) {
            //     if (error) {
            //         console.log(error);
            //     } else {
            //         console.log("Message sent: ");
            //     }

            //     smtpTransport.close();
            // });
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
                                            res.send('username and password sent to your email');
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

router.route('/school_details/:school_id')
    .get(function (req, res, next) {
        var school_id = req.params.school_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('schools').find({ school_id });
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


router.route('/edit_school_details/:school_id')
    .put(function (req, res, next) {

        var myquery = { school_id: req.params.school_id };
        var req_name = req.body.name;
        var req_medium = req.body.medium;
        var req_academic_year = req.body.academic_year;
        var req_extra_curricular_activites = req.body.extra_curricular_activites;
        var req_facilities_available = req.body.facilities_available;
        var req_timings = req.body.timings;
        var req_afflication = req.body.afflication;
        var req_class_from = req.body.class_from;
        var req_website = req.body.website;
        var req_email = req.body.email;
        var req_phone = req.body.phone;
        var req_alternate_phone = req.body.alternate_phone;
        var req_address = req.body.address;
        var req_founder = req.body.founder;
        var req_chairman = req.body.chairman;
        var req_principal = req.body.principal;
        var req_vice_principal = req.body.vice_principal;
        var req_coordinator = req.body.coordinator;
        var req_est_on = req.body.est_on;

        mongo.connect(url, function (err, db) {
            db.collection('schools').update(myquery, {
                $set: {
                    name: req_name,
                    medium: req_medium,
                    academic_year: req_academic_year,
                    timings: req_timings,
                    extra_curricular_activites: req_extra_curricular_activites,
                    facilities_available: req_facilities_available,
                    afflication: req_afflication,
                    class_from: req_class_from,
                    founder: req_founder,
                    chairman: req_chairman,
                    principal: req_principal,
                    vice_principal: req_vice_principal,
                    coordinator: req_coordinator,
                    website: req_website,
                    email: req_email,
                    phone: req_phone,
                    est_on: req_est_on,
                    alternate_phone: req_alternate_phone,
                    address: req_address,
                }
            }, function (err, result) {
                assert.equal(null, err);
                if (err) {
                    res.send('false');
                }
                db.close();
                res.send('true');
            });
        });
    });



router.route('/schools_photo_edit/:school_id')
    .post(function (req, res, next) {
        var status = 1;
        var school_id = req.params.school_id;
        var myquery = { school_id: req.params.school_id };
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
            // var SchoolImage = {
            filename = req.file.filename;
            originalname = req.file.originalname;
            imagePath = req.file.path;
            mimetype = req.file.mimetype;
            // }
         //   var filename = req.file.filename;
         //   console.log(filename);

            mongo.connect(url, function (err, db) {
                db.collection('schools').update(myquery, {
                    $set:
                        ({ SchoolImage: [{ filename: filename, originalname: originalname, imagePath: imagePath, mimetype: mimetype }] })
                    // SchoolImage: SchoolImage
                }, function (err, result) {
                    if (err) {
                        res.send('false');
                    }
                    db.close();
                    res.send('true');
                });
            });
        })
    });
// db.getCollection('schools').update({"school_id":"SCH-9274"},{$set: ({SchoolImage: [ { filename: "HEMABABU.jpg"}]})});

// router.route('/edit_school_management_details/:school_id')
//     .put(function (req, res, next) {

//         var myquery = { school_id: req.params.school_id };
//         var req_founder = req.body.founder;
//         var req_chairman = req.body.chairman;
//         var req_principal = req.body.principal;
//         var req_vice_principal = req.body.vice_principal;
//         var req_coordinator = req.body.coordinator;

//         mongo.connect(url, function (err, db) {
//             db.collection('schools').update(myquery, {
//                 $set: {
//                     founder: req_founder,
//                     chairman: req_chairman,
//                     principal: req_principal,
//                     vice_principal: req_vice_principal,
//                     coordinator: req_coordinator,
//                 }
//             }, function (err, result) {
//                 assert.equal(null, err);
//                 if (err) {
//                     res.send('false');
//                 }
//                 db.close();
//                 res.send('true');
//             });
//         });
//     });


// router.route('/edit_school_contact_details/:school_id')
//     .put(function (req, res, next) {

//         var myquery = { school_id: req.params.school_id };
//         var req_website = req.body.website;
//         var req_email = req.body.email;
//         var req_phone = req.body.phone;
//         var req_alternate_phone = req.body.alternate_phone;
//         var req_address = req.body.address;

//         mongo.connect(url, function (err, db) {
//             db.collection('schools').update(myquery, {
//                 $set: {
//                     website: req_website,
//                     email: req_email,
//                     phone: req_phone,
//                     alternate_phone: req_alternate_phone,
//                     address: req_address,
//                 }
//             }, function (err, result) {
//                 assert.equal(null, err);
//                 if (err) {
//                     res.send('false');
//                 }
//                 db.close();
//                 res.send('true');
//             });
//         });
//     });



module.exports = router;
