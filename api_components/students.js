// flow

var express = require("express");
var config = require("../config.json");
var bodyParser = require("body-parser");
var api_key = "api-key-KJFSI4924R23RFSDFSD7F94";
var mongo = require('mongodb').MongoClient;
var autoIncrement = require("mongodb-autoincrement");
var multer = require('multer');
var xlstojson = require("xls-to-json-lc");
var xlsxtojson = require("xlsx-to-json-lc");
var assert = require('assert');
var parentModule = require('../api_components/parent_module');
var port = process.env.PORT || 4005;
var router = express.Router();
var url = 'mongodb://' + config.dbhost + ':27017/s_erp_data';
var loginUrl = 'mongodb://' + config.dbhost + ':27017/auth';
router.use(bodyParser.json({ limit: '100mb' }));
router.use(bodyParser.urlencoded({ limit: '100mb', extended: false, parameterLimit: 10000 }));

var cookieParser = require('cookie-parser');
router.use(function (req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
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


// Add Stundents

router.route('/students/:section_id')
    .post(function (req, res, next) {
        var section_id = req.params.section_id;
        var splited = section_id.split("-");
        var school_id = splited[0] + '-' + splited[1];
        var class_id = splited[0] + '-' + splited[1] + '-' + splited[2] + '-' + splited[3];

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
            var studentImage = {
                filename: req.file.filename,
                originalname: req.file.originalname,
                imagePath: req.file.path,
                mimetype: req.file.mimetype,
            }
            var parent_account_details = {};
            parent_account_details.parent_account_create = req.body.parent_account_create;
            parent_account_details.parent_account_new = req.body.parent_account_new;
            parent_account_details.parent_id = req.body.parent_id;
            parent_account_details.school_id = school_id;
            parent_account_details.section_id = section_id;
            // console.log(parent_account_details);
            // console.log(req.body.parent_account_create);
            // console.log(req.body.parent_account_new);

            var status = 1;
            var item = {
                student_id: 'getauto',
                school_id: school_id,
                class_id: class_id,
                section_id: section_id,
                surname: req.body.surname,
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                gender: req.body.gender,
                dob: req.body.dob,
                aadhar_no: req.body.aadhar_no,
                religion: req.body.religion,
                phone: req.body.phone,
                email: req.body.email,
                category: req.body.category,
                admission_date: req.body.admission_date,
                admission_no: req.body.admission_no,
                roll_no: req.body.roll_no,
                academic_year: req.body.academic_year,
                blood_group: req.body.blood_group,
                bus_route_id: req.body.bus_route_id,

            };
            var current_address = {
                cur_address: req.body.cur_address,
                cur_city: req.body.cur_city,
                cur_state: req.body.cur_state,
                cur_pincode: req.body.cur_pincode,
                cur_long: req.body.cur_long,
                cur_lat: req.body.cur_lat
            };
            var permanent_address = {
                perm_address: req.body.perm_address,
                perm_city: req.body.perm_city,
                perm_state: req.body.perm_state,
                perm_pincode: req.body.perm_pincode,
                perm_long: req.body.perm_long,
                perm_lat: req.body.perm_lat
            };
            var parent_father = {
                parent_name: req.body.father_name,
                parent_contact: req.body.father_contact,
                parent_email: req.body.father_email,
                parent_relation: 'father',
                parent_address: req.body.cur_address + ' ' + req.body.perm_city + ' ' + req.body.perm_state + ' ' + req.body.perm_pincode,
                occupation: req.body.father_occupation
            };
            var parent_mother = {
                parent_name: req.body.mother_name,
                parent_contact: req.body.mother_contact,
                parent_email: req.body.mother_email,
                parent_relation: 'mother',
                parent_address: req.body.cur_address + ' ' + req.body.perm_city + ' ' + req.body.perm_state + ' ' + req.body.perm_pincode,
                occupation: req.body.mother_occupation
            };
            var parent_gaurdian = {
                parent_name: req.body.gaurdian_name,
                parent_contact: req.body.gaurdian_contact,
                parent_email: req.body.gaurdian_email,
                parent_relation: req.body.gaurdian_relation,
                parent_address: req.body.gaurdian_address,
                occupation: req.body.gaurdian_occupation
            };

            mongo.connect(url, function (err, db) {
                autoIncrement.getNextSequence(db, 'students', function (err, autoIndex) {
                    var collection = db.collection('students');
                    collection.createIndex({
                        "student_id": 1
                    }, {
                            unique: true
                        }, function (err, result) {
                            if (item.section_id == null || item.dob == null || item.phone == null) {
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
                                                student_id: class_id + '-STD-' + autoIndex
                                            },
                                            $push: {
                                                current_address,
                                                permanent_address,
                                                studentImage,
                                                parents: parent_father
                                            }
                                        }, function (err, result) {
                                            db.close();
                                            // res.end('true');
                                            res.send({ status: 'true', id: class_id + '-STD-' + autoIndex });
                                        });
                                    collection.update({
                                        _id: item._id
                                    }, {
                                            $push: {
                                                parents: parent_mother
                                            }
                                        });
                                    collection.update({
                                        _id: item._id
                                    }, {
                                            $push: {
                                                parents: parent_gaurdian
                                            }
                                        });
                                    // add parent
                                    // console.log(parent_account_details.parent_account_create);
                                    // console.log(typeof (parent_account_details.parent_account_create) + 'moksha');

                                    if (parent_account_details.parent_account_create == true || parent_account_details.parent_account_create == 'true') {
                                        // console.log("testing");
                                        var requestData = {}
                                        requestData.name = parent_father.parent_name;
                                        requestData.student_id = class_id + '-STD-' + autoIndex;
                                        requestData.parent_id = parent_account_details.parent_id;
                                        requestData.school_id = parent_account_details.school_id;
                                        requestData.section_id = parent_account_details.section_id;
                                        // console.log(requestData);
                                        // console.log(parent_account_details.parent_account_new);
                                        if (parent_account_details.parent_account_new == true || parent_account_details.parent_account_new == 'true') {
                                            // console.log("newaccount")
                                            parentModule.addParent(requestData);

                                        }
                                        if (parent_account_details.parent_account_new == false || parent_account_details.parent_account_new == 'false') {
                                            // console.log("existing")
                                            parentModule.addStudentToParent(requestData);
                                        }

                                    }

                                    // add parent

                                });
                            }
                        });
                    collection.ensureIndex({
                        "first_name": "text",
                        "last_name": "text"
                    });
                });
            });
        });

    })



router.route('/students/:section_id')
    .get(function (req, res, next) {
        var section_id = req.params.section_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('students').aggregate([{
                $match: {
                    section_id: section_id
                }
            },
            {
                $lookup: {
                    from: "school_classes",
                    localField: "class_id",
                    foreignField: "class_id",
                    as: "school_classes"
                }
            },
            {
                $lookup: {
                    from: "class_sections",
                    localField: "section_id",
                    foreignField: "section_id",
                    as: "sections"
                }
            }

            ]);
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    students: resultArray
                });
            });
        });
    });

router.route('/search_student/:academic_year/:class_id/:section/:search_key')
    .get(function (req, res, next) {
        var academic_year = req.params.academic_year;
        var class_id = req.params.class_id;
        var section = req.params.section.toUpperCase();
        var search_key = req.params.search_key;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('students').find({ academic_year, class_id, section, $text: { $search: search_key } });
            cursor.forEach(function (doc, err) {
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send(resultArray);
            });
        });
    });

router.route('/add_parent/:student_id')
    .post(function (req, res, next) {
        parents = [];
        var student_id = req.params.student_id;
        var parents = {
            parent_name: req.body.parent_name,
            parent_contact: req.body.parent_contact,
            parent_relation: req.body.parent_relation,
            occupation: req.body.occupation
        };
        mongo.connect(url, function (err, db) {
            db.collection('students').update({ student_id }, { $push: { parents } }, function (err, result) {
                assert.equal(null, err);
                db.close();
                res.send('true');
            });
        });
    });

router.route('/add_old_acadamic_details/:student_id')
    .post(function (req, res, next) {
        old_acadamic_details = [];
        var student_id = req.params.student_id;
        var old_acadamic_details = {
            school_name: req.body.school_name,
            class_name: req.body.class_name,
            percentage: req.body.percentage,
            rank: req.body.rank
        };
        mongo.connect(url, function (err, db) {
            db.collection('students').update({ student_id }, { $push: { old_acadamic_details } }, function (err, result) {
                assert.equal(null, err);
                db.close();
                res.send('true');
            });
        });
    });

router.route('/student_current_address/:student_id')
    .post(function (req, res, next) {
        current_address = [];
        var student_id = req.params.student_id;
        var cur_address = req.body.cur_address;
        var cur_city = req.body.cur_city;
        var cur_state = req.body.cur_state;
        var cur_pincode = req.body.cur_pincode;
        var cur_long = req.body.cur_long;
        var cur_lat = req.body.cur_lat;
        var current_address = {
            cur_address: cur_address,
            cur_city: cur_city,
            cur_state: cur_state,
            cur_pincode: cur_pincode,
            cur_long: cur_long,
            cur_lat: cur_lat
        };
        mongo.connect(url, function (err, db) {
            db.collection('students').findOneAndUpdate({ student_id }, { $set: { current_address } }, function (err, result) {
                assert.equal(null, err);
                db.close();
                res.send('true');
            });
        });
    });
router.route('/student_permanent_address/:student_id')
    .post(function (req, res, next) {
        permanent_address = [];
        var student_id = req.params.student_id;
        var perm_address = req.body.perm_address;
        var perm_city = req.body.perm_city;
        var perm_state = req.body.perm_state;
        var perm_pincode = req.body.perm_pincode;
        var perm_long = req.body.perm_long;
        var perm_lat = req.body.perm_lat;
        var permanent_address = {
            perm_address: perm_address,
            perm_city: perm_city,
            perm_state: perm_state,
            perm_pincode: perm_pincode,
            perm_long: perm_long,
            perm_lat: perm_lat
        };
        mongo.connect(url, function (err, db) {
            db.collection('students').findOneAndUpdate({ student_id }, { $set: { permanent_address } }, function (err, result) {
                assert.equal(null, err);
                db.close();
                res.send('true');
            });
        });
    });


router.route('/student_details/:student_id')
    .get(function (req, res, next) {
        var student_id = req.params.student_id;

        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            //var cursor = db.collection('students').find({ student_id });
            var cursor = db.collection('students').aggregate([
                {
                    $match: {
                        student_id: student_id
                    }
                },
                {
                    $lookup: {
                        from: "school_classes",
                        localField: "class_id",
                        foreignField: "class_id",
                        as: "school_classes"
                    }
                },
                {
                    $lookup: {
                        from: "schools",
                        localField: "school_id",
                        foreignField: "school_id",
                        as: "schools"
                    }
                },
                {
                    $lookup: {
                        from: "class_sections",
                        localField: "section_id",
                        foreignField: "section_id",
                        as: "sections"
                    }
                }
            ]);
            cursor.forEach(function (doc, err) {

                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({ students: resultArray });
            });
        });
    });





router.route('/get_parents/:student_id')
    .get(function (req, res, next) {
        var student_id = req.params.student_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('students').find({ student_id }, { 'parents': 1, '_id': 0 });
            cursor.forEach(function (doc, err) {
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send(resultArray[0]);
            });
        });
    });

router.route('/get_bus_route_by_student_id/:student_id/')
    .get(function (req, res, next) {
        var student_id = req.params.student_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('students').find({ student_id }, { 'bus_route_id': 1, '_id': 0 });
            cursor.forEach(function (doc, err) {
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send(resultArray[0]);
            });
        });
    });

router.route('/get_array_students/:student_id/:array_name')
    .get(function (req, res, next) {
        var student_id = req.params.student_id;
        var array_name = req.params.array_name;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('students').find({ student_id }, {
                [array_name]: 1,
                '_id': 0
            });
            cursor.forEach(function (doc, err) {
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send(resultArray[0]);
            });
        });
    });

// Modified

// Student Bulk Upload via excel sheet

var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
    }
});

var upload = multer({ //multer settings
    storage: storage,
    fileFilter: function (req, file, callback) { //file filter
        if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
            return callback(new Error('Wrong extension type'));
        }
        callback(null, true);
    }
}).single('file');

router.route('/bulk_upload_students/:section_id')
    .post(function (req, res, next) {
        var section_id = req.params.section_id;
        var splited = section_id.split("-");
        var school_id = splited[0] + '-' + splited[1];
        var class_id = splited[0] + '-' + splited[1] + '-' + splited[2] + '-' + splited[3];
        var status = 1;
        var exceltojson;
        upload(req, res, function (err) {
            if (err) {
                res.json({ error_code: 1, err_desc: err });
                return;
            }
            /** Multer gives us file info in req.file object */
            if (!req.file) {
                res.json({ error_code: 1, err_desc: "No file passed" });
                return;
            }
            /** Check the extension of the incoming file and 
             *  use the appropriate module
             */
            if (req.file.originalname.split('.')[req.file.originalname.split('.').length - 1] === 'xlsx') {
                exceltojson = xlsxtojson;
            } else {
                exceltojson = xlstojson;
            }
            //  console.log(req.file.path);
            try {
                exceltojson({
                    input: req.file.path,
                    output: null, //since we don't need output.json
                    lowerCaseHeaders: true
                }, function (err, result) {
                    if (err) {
                        return res.json({ error_code: 1, err_desc: err, data: null });
                    }
                    res.json({ data: result });

                    var test = result;
                    var count = 0;

                    if (test.length > 0) {
                        test.forEach(function (key, value) {
                            var parent_account_details = {};
                            parent_account_details.parent_account_create = key.parent_account_create;
                            parent_account_details.parent_account_new = key.parent_account_new;
                            parent_account_details.parent_id = key.parent_id;
                            parent_account_details.school_id = school_id;

                            var item = {
                                student_id: 'getauto',
                                school_id: school_id,
                                class_id: class_id,
                                section_id: section_id,
                                surname: key.surname,
                                first_name: key.firstname,
                                last_name: key.lastname,
                                gender: key.gender,
                                dob: key.dob,
                                aadhar_no: key.aadharno,
                                phone: key.phone,
                                email: key.email,
                                category: key.category,
                                admission_date: key.admissiondate,
                                admission_no: key.admissionno,
                                roll_no: key.rollno,
                                academic_year: key.academicyear,
                                bus_route_id: key.busrouteid,
                                status: status,
                            };

                            var current_address = {
                                cur_address: key.curaddress,
                                cur_city: key.curcity,
                                cur_state: key.curstate,
                                cur_pincode: key.curpincode,
                                cur_long: key.curlong,
                                cur_lat: key.curlat
                            };
                            var permanent_address = {
                                perm_address: key.permaddress,
                                perm_city: key.permcity,
                                perm_state: key.permstate,
                                perm_pincode: key.permpincode,
                                perm_long: key.permlong,
                                perm_lat: key.permlat
                            };
                            var parent_father = {
                                parent_name: key.fathername,
                                parent_contact: key.fathercontact,
                                parent_relation: 'father',
                                parent_address: key.curaddress + ' ' + key.permcity + ' ' + key.permstate + ' ' + key.permpincode,
                                occupation: key.fatheroccupation
                            };
                            var parent_mother = {
                                parent_name: key.mothername,
                                parent_contact: key.mothercontact,
                                parent_relation: 'mother',
                                parent_address: key.curaddress + ' ' + key.permcity + ' ' + key.permstate + ' ' + key.permpincode,
                                occupation: key.motheroccupation
                            };
                            var parent_gaurdian = {
                                parent_name: key.gaurdianname,
                                parent_contact: key.gaurdiancontact,
                                parent_relation: key.gaurdianrelation,
                                parent_address: key.gaurdianaddress,
                                occupation: key.gaurdianoccupation
                            };

                            mongo.connect(url, function (err, db) {
                                autoIncrement.getNextSequence(db, 'students', function (err, autoIndex) {

                                    var collection = db.collection('students');
                                    collection.ensureIndex({
                                        "student_id": 1,
                                    }, {
                                            unique: true
                                        }, function (err, result) {
                                            if (item.section_id == null || item.phone == null) {
                                                res.end('null');
                                            } else {
                                                item.student_id = class_id + '-STD-' + autoIndex;
                                                collection.insertOne(item, function (err, result) {
                                                    if (err) {
                                                        console.log(err);
                                                        if (err.code == 11000) {

                                                            res.end('false');
                                                        }
                                                        res.end('false');
                                                    }
                                                    collection.update({
                                                        _id: item._id
                                                    }, {
                                                            $push: {
                                                                current_address,
                                                                permanent_address,
                                                                parents: parent_father
                                                            }
                                                        });
                                                    collection.update({
                                                        _id: item._id
                                                    }, {
                                                            $push: {
                                                                parents: parent_mother
                                                            }
                                                        });
                                                    collection.update({
                                                        _id: item._id
                                                    }, {
                                                            $push: {
                                                                parents: parent_gaurdian
                                                            }
                                                        });
                                                    if (parent_account_details.parent_account_create == true || parent_account_details.parent_account_create == 'true' || parent_account_details.parent_account_create == 'TRUE') {
                                                        // console.log("testing");
                                                        var requestData = {}
                                                        requestData.name = parent_father.parent_name;
                                                        requestData.student_id = class_id + '-STD-' + autoIndex;
                                                        requestData.parent_id = parent_account_details.parent_id;
                                                        requestData.school_id = parent_account_details.school_id;
                                                        // console.log(requestData);
                                                        // console.log(parent_account_details.parent_account_new);
                                                        if (parent_account_details.parent_account_new == true || parent_account_details.parent_account_new == 'true' || parent_account_details.parent_account_new == 'TRUE') {
                                                            // console.log("newaccount")
                                                            parentModule.addParent(requestData);

                                                        }
                                                        if (parent_account_details.parent_account_new == false || parent_account_details.parent_account_new == 'false' || parent_account_details.parent_account_new == 'FALSE') {
                                                            // console.log("existing")
                                                            parentModule.addStudentToParent(requestData);
                                                        }

                                                    }

                                                    count++;
                                                    db.close();

                                                    if (count == test.length) {
                                                        res.end('true');
                                                    }


                                                });
                                            }
                                        });

                                });
                            });

                        });


                    } else {
                        res.end('false');
                    }


                });
            } catch (e) {
                res.json({ error_code: 1, err_desc: "Corupted excel file" });
            }
        })
    });






router.route('/edit_students/:student_id')
    .put(function (req, res, next) {
        var myquery = { student_id: req.params.student_id };
        // var req_class_id = req.body.class_id;
        // var req_section = req.body.section;         
        // var req_first_name = req.body.first_name;
        // var req_last_name = req.body.last_name;          
        var req_gender = req.body.gender;
        var req_dob = req.body.dob;
        var req_phone = req.body.phone;
        // var req_father_name = req.body.father_name;
        // var req_email = req.body.email;
        var req_category = req.body.category;
        // var req_admission_date = req.body.admission_date;
        // var req_admission_no = req.body.admission_no;         
        //  var req_roll_no = req.body.roll_no;
        //  var splited = req_class_id.split("-");
        //  var req_class_name = req.body.class_name;

        mongo.connect(url, function (err, db) {
            db.collection('students').update(myquery, {
                $set: {
                    //section:req_section,
                    //  class_name:req_class_name,
                    //  first_name:req_first_name,
                    //   last_name:req_last_name,
                    gender: req_gender,
                    category: req_category,
                    dob: req_dob,
                    phone: req_phone,
                    // parent_name:req_father_name
                    //  email:req_email,
                    //  admission_no:req_admission_no,
                    //   admission_date:req_admission_date,
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



router.route('/edit_student_details/:student_id')
    .put(function (req, res, next) {
        var myquery = { student_id: req.params.student_id };


        var req_first_name = req.body.first_name;
        var req_last_name = req.body.last_name;
        var req_gender = req.body.gender;
        var req_dob = req.body.dob;
        var req_phone = req.body.phone;
        // var req_father_name = req.body.father_name;
        // var req_email = req.body.email;
        var req_category = req.body.category;
        // var req_admission_date = req.body.admission_date;
        // var req_admission_no = req.body.admission_no;         
        //  var req_roll_no = req.body.roll_no;
        //  var splited = req_class_id.split("-");
        //  var req_class_name = req.body.class_name;

        mongo.connect(url, function (err, db) {
            db.collection('students').update(myquery, {
                $set: {
                    //section:req_section,
                    //  class_name:req_class_name,
                    //  first_name:req_first_name,
                    //   last_name:req_last_name,
                    gender: req_gender,
                    category: req_category,
                    dob: req_dob,
                    phone: req_phone,
                    // parent_name:req_father_name
                    //  email:req_email,
                    //  admission_no:req_admission_no,
                    //   admission_date:req_admission_date,
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



router.route('/edit_student_details/:student_id')
    .put(function (req, res, next) {
        var myquery = { student_id: req.params.student_id };
        var req_first_name = req.body.first_name;
        var req_last_name = req.body.last_name;
        var req_gender = req.body.gender;
        var religion = req.body.religion;
        var req_dob = req.body.dob;
        var aadhar_no = req.body.aadhar_no;
        var req_phone = req.body.phone;
        var req_father_name = req.body.father_name;
        var req_email = req.body.email;
        var req_category = req.body.category;
        var req_admission_date = req.body.admission_date;
        var req_admission_no = req.body.admission_no;
        var req_roll_no = req.body.roll_no;
        var blood_group = req.body.blood_group;
        var father_occupation = req.body.father_occupation;
        var gaurdian_occupation = req.body.gaurdian_occupation;
        var mother_contact = req.body.mother_contact;
        var gaurdian_contact = req.body.gaurdian_contact;
        var father_contact = req.body.father_contact;
        var gaurdian_name = read.body.gaurdian_name;
        var mother_name = req.body.mother_name;
        var mother_occupation = req.body.mother_occupation;
        var gaurdian_relation = req.body.gaurdian_relation;
        var bus_route_id = req.body.bus_route_id;
        var cur_address = req.body.cur_address;
        var perm_address = req.body.perm_address;

        mongo.connect(url, function (err, db) {
            db.collection('students').update(myquery, {
                $set: {
                    first_name: req_first_name,
                    last_name: req_last_name,
                    gender: req_gender,
                    religion: religion,
                    aadhar_no: aadhar_no,
                    category: req_category,
                    dob: req_dob,
                    phone: req_phone,
                    email: req_email,
                    admission_no: req_admission_no,
                    admission_date: req_admission_date,
                    roll_no: req_roll_no,
                    blood_group: blood_group,
                    // parents: [{
                    //     0: [{ parent_name: req_father_name, parent_contact: father_contact, parent_relation: "father", occupation: father_occupation }],
                    //     1: [{ parent_name: mother_name, parent_contact: mother_contact, parent_relation: "mother", occupation: mother_occupation }],
                    //     2: [{ parent_name: gaurdian_name, parent_contact: gaurdian_contact, parent_relation: gaurdian_relation, occupation: gaurdian_occupation }]
                    // }]
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





// router.route('/delete_student/:student_id')
//     .delete(function (req, res, next) {
//         var myquery = { student_id: req.params.student_id };

//         mongo.connect(url, function (err, db) {
//             db.collection('students').deleteOne(myquery, function (err, result) {
//                 assert.equal(null, err);
//                 if (err) {
//                     res.send('false');
//                 }
//                 db.close();
//                 res.send('true');
//             });
//         });
//     });

router.route('/delete_student/:student_id')
    .delete(function (req, res, next) {
        var resultArray = [];
        var student_id = req.params.student_id;
        var myquery = { student_id: student_id };
        mongo.connect(url, function (err, db) {
            db.collection('students').deleteOne(myquery, function (err, result) {
                assert.equal(null, err);
                if (err) {
                    res.send('false');
                }
                else {

                    mongo.connect(url, function (err, db) {
                        assert.equal(null, err);
                        var cursor = db.collection('parents').aggregate(
                            [
                                {
                                    $match:
                                        {
                                            "students": { $elemMatch: { "student_id": student_id } }

                                        }
                                },
                                {
                                    "$project":
                                        {
                                            "parent_id": "$parent_id",
                                            "parent_name": "$parent_name",
                                            "students":
                                                {
                                                    "$map":
                                                        {
                                                            "input": "$students",
                                                            "as": "students",
                                                            "in":
                                                                {
                                                                    "length": { "$size": "$students" }
                                                                }
                                                        }
                                                }
                                        }
                                }
                            ]
                        );
                        cursor.forEach(function (doc, err) {
                            assert.equal(null, err);
                            resultArray.push(doc);
                        }, function () {
                            //console.log(resultArray);
                            length = resultArray[0].students[0].length;
                            parentId = resultArray[0].parent_id;
                            // console.log(parentId);
                            if (length > 1) {

                                mongo.connect(url, function (err, db) {
                                    db.collection('parents').update({ "students": { $elemMatch: { "student_id": student_id } } },
                                        { $pull: { "students": { "student_id": student_id } } })

                                    assert.equal(null, err);
                                    if (err) {
                                        res.send('false');
                                    }

                                });
                            }
                            else if (length == 1) {
                                mongo.connect(url, function (err, db) {
                                    db.collection('parents').deleteOne({ "students": { $elemMatch: { "student_id": student_id } } })
                                    assert.equal(null, err);
                                    if (err) {
                                        res.send('false');
                                    }
                                    else {
                                        mongo.connect(loginUrl, function (err, db) {
                                            db.collection('users').deleteOne({ uniqueId: parentId })
                                            assert.equal(null, err);
                                            if (err) {
                                                res.send('false');
                                            }

                                        });
                                    }

                                });

                            }

                            db.close();
                            res.send('true');
                        });
                    });
                }
            });
        });
    });

router.route('/student_photo_edit/:student_id')
    .post(function (req, res, next) {
        var status = 1;

        var myquery = { student_id: req.params.student_id };
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
                db.collection('students').update(myquery, {
                    $set:
                        ({ studentImage: [{ filename: filename, originalname: originalname, imagePath: imagePath, mimetype: mimetype }] })
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


module.exports = router;