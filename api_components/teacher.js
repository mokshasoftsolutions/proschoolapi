// flow
var express = require("express");
var config = require("../config.json");
var bodyParser = require("body-parser");
var api_key = "api-key-KJFSI4924R23RFSDFSD7F94";
var mongo = require('mongodb').MongoClient;
var autoIncrement = require("mongodb-autoincrement");
var assert = require('assert');
var multer = require('multer');
var xlstojson = require("xls-to-json-lc");
var xlsxtojson = require("xlsx-to-json-lc");
var port = process.env.PORT || 4005;
var router = express.Router();
var url = 'mongodb://' + config.dbhost + ':27017/s_erp_data';

var cookieParser = require('cookie-parser');
router.use(function (req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
});

// Add Teachers

router.route('/teachers/:school_id')
    .post(function (req, res, next) {
        var status = 1;
        var school_id = req.params.school_id;
        subjects = [];
        var item = {
            teacher_id: 'getauto',
            school_id: school_id,
            employee_id: req.body.employee_id,
            added_on: req.body.added_on,
            status: status,
        };
        var subjects = {
            subject_id: req.body.subject_id,
            subject_name: req.body.subject_name
        };
        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'teacher_subjects', function (err, autoIndex) {
                var collection = db.collection('teacher_subjects');
                collection.ensureIndex({
                    "teacher_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.school_id == null || item.employee_id == null || subjects.subject_name == null) {
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
                                            teacher_id: 'SUB-TCH-' + autoIndex
                                        },
                                        $push: {
                                            subjects
                                        }
                                    }, function (err, result) {
                                        db.close();
                                        res.end('true');
                                    });
                            });
                        }
                    });
            });
        });

    })

    .get(function (req, res, next) {
        var resultArray = [];
        var school_id = req.params.school_id;
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('teachers').find({ school_id });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    teachers: resultArray
                });
            });
        });
    });

router.route('/teacherslistbyschoolid/:school_id')
    .get(function (req, res, next) {
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('employee').find({ job_category: "teaching" });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    employee: resultArray
                });
            });
        });
    });

router.route('/addorupdatesubjectstoteacher/:school_id/:section_id')
    .post(function (req, res, next) {
        var status = 1;
        var school_id = req.params.school_id;
        var teacher_id = req.body.teacher_id;
        var subject_id = req.body.subject_id;
       
        var section_id = req.params.section_id;
        subjects = [];
        var item = {
            teacher_subject_id: 'getauto',
            school_id: school_id,
            teacher_id: req.body.teacher_id,
            // added_on: req.body.added_on,
            // section_id : req.body.section_id,
            status: status,
        };
        var subjects = {
            // subject_id: req.body.subject_id,
            section_id: section_id,
            subject_id: req.body.subject_id
        };

        mongo.connect(url, function (err, db) {
            var collection = db.collection('teacher_subjects');

            collection.find({
                "teacher_id": teacher_id
            }).toArray(function (err, results) {
                if (err) {
                    res.send('false')
                }

                if (results.length == 0) {
                    autoIncrement.getNextSequence(db, 'teacher_subjects', function (err, autoIndex) {
                        collection.ensureIndex({
                            "teacher_id": 1,
                        }, {
                                unique: true
                            }, function (err, result) {
                                if (item.school_id == null || item.teacher_id == null || subjects.section_id == null) {
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
                                                    teacher_subject_id: 'SUB-TCH-' + autoIndex
                                                },
                                                $push: {
                                                    subjects
                                                }
                                            }, function (err, result) {
                                                db.close();
                                                res.end('true');
                                            });
                                    });
                                }
                            });
                    });


                } else {
                    var data = collection.find({
                        subjects: { $elemMatch: { subject_id: subject_id } }
                    }).count(function (e, triggerCount) {

                        if (triggerCount > 0) {
                            res.send('false');
                        } else {


                            collection.update({
                                "teacher_id": teacher_id
                            }, {
                                    "$addToSet": {
                                        "subjects": {
                                            subject_id: req.body.subject_id,
                                            section_id: section_id
                                        }
                                    }
                                },
                                function (err, numAffected) {
                                    if (err) {
                                        res.send('false')
                                    }

                                    if (numAffected.result.nModified == 1) {
                                        res.send('true')
                                    } else {
                                        res.send('false')
                                    }
                                });
                            // res.send('false')
                        }
                    });
                }
            });


        });
    });

// delete subjects from teacher

router.route('/deleteassignedsubjects/:subject_id/:teacher_id')
    .put(function (req, res, next) {
        var teacher_id = req.params.teacher_id;
        var subject_id = req.params.subject_id;
        mongo.connect(url, function (err, db) {
            var collection = db.collection('teachers');

            collection.update({
                "teacher_id": teacher_id
            }, {
                    "$pull": {
                        "subjects": {
                            subject_id: subject_id

                        }
                    }
                },
                function (err, numAffected) {
                    if (numAffected.result.nModified == 1) {
                        db.close();
                        res.send('true')
                    } else {
                        db.close();
                        res.send('false')

                    }


                });

        });
    });

// List assigined subjects to teachers by school id 
router.route('/listsubjectstoteacher/:school_id')
    .get(function (req, res, next) {
        var school_id = req.params.school_id;
        //var employee_id = req.body.employee_id;
        var status = 1;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('teacher_subjects').aggregate([
                {
                    "$lookup": {
                        "from": "teachers",
                        "localField": "teacher_id",
                        "foreignField": "teacher_id",
                        "as": "teacher_doc"
                    }
                },
                {
                    "$unwind": "$teacher_doc"
                },
                {
                    "$unwind": "$subjects"
                },
                {
                    "$lookup": {
                        "from": "subjects",
                        "localField": "subjects.subject_id",
                        "foreignField": "subject_id",
                        "as": "subjects_doc"
                    }
                },
                {
                    "$unwind": "$subjects_doc"
                },
                // {
                //     "$lookup": {
                //         "from": "class_sections",
                //         "localField": "subjects.section_id",
                //         "foreignField": "section_id",
                //         "as": "section_doc"
                //     }
                // },
                // {
                //     "$unwind": "$section_doc"
                // },
                // {
                //     "$redact": {
                //         "$cond": [{
                //             "$eq": ["$employee_id", "$employee_doc.employee_id"]
                //         },
                //             "$$KEEP",
                //             "$$PRUNE"
                //         ]
                //     }
                // },
                {
                    "$project": {
                        "_id": "$_id",
                        "teacher_id": "$teacher_id",
                        "teacher_name": "$teacher_doc.teacher_name",
                        "school_id": "$school_id",
                        "employee_id": "$employee_id",
                       
                        "subjects": [{
                            "subjects": "$subjects_doc.name"

                        }]

                    }
                }
            ]);

            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    teachers: resultArray
                });
            });
        });
    });
// Add Subjects to Teachers For a Section 

router.route('/addsubjectstoteacher/:section_id')
    .post(function (req, res, next) {
        var status = 1;
        var section_id = req.params.section_id;
        var item = {
            teacher_id: 'getauto',
            subject_name: req.body.subject_name,
            // subject_id: req.body.subject_id,
            // employee_id: req.body.employee_id,
            teacher_name: req.body.teacher_name,
            section_id: section_id,
            status: status
        };

        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'teachers', function (err, autoIndex) {
                var collection = db.collection('teachers');
                collection.ensureIndex({
                    "teacher_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.section_id == null) {
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
                                            teacher_id: 'TCH-' + autoIndex
                                        }
                                    }, function (err, result) {
                                        db.close();
                                        res.end('true');
                                    });
                            });
                        }
                    });
            });
        });
    })
    .get(function (req, res, next) {
        var section_id = req.params.section_id;
        var status = 1;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('teachers').find({ section_id });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    teachers: resultArray
                });
            });
        });
    });

router.route('/add_subjects_to_teacher/:teacher_id')
    .post(function (req, res, next) {
        subjects = [];
        var teacher_id = req.params.teacher_id;
        var subjects = {
            subject_id: req.body.subject_id,
            subject_name: req.body.subject_name
        };
        mongo.connect(url, function (err, db) {
            db.collection('teachers').update({ teacher_id }, { $push: { subjects } }, function (err, result) {
                assert.equal(null, err);
                db.close();
                res.send('true');
            });
        });
    });


//  Modified
// Chapters bulk upload via excel sheet


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

router.route('/bulk_upload_teachers/:school_id')
    .post(function (req, res, next) {
        var school_id = req.params.school_id;
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
            console.log(req.file.path);
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
                    console.log(result[0]);
                    var test = result;
                    var count = 0;

                    if (test.length > 0) {
                        test.forEach(function (key, value) {

                            var item = {
                                teacher_id: 'getauto',
                                school_id: school_id,
                                employee_id: key.employeeid,
                                added_on: key.addedon,
                                status: status,
                            };
                            var subjects = {
                                subject_id: key.subjectid,
                                subject_name: key.subjectname
                            };
                            mongo.connect(url, function (err, db) {
                                autoIncrement.getNextSequence(db, 'teachers', function (err, autoIndex) {

                                    var collection = db.collection('teachers');
                                    collection.ensureIndex({
                                        "teacher_id": 1,
                                    }, {
                                            unique: true
                                        }, function (err, result) {
                                            if (item.school_id == null) {
                                                res.end('null');
                                            } else {
                                                item.teacher_id = 'SCH-TCH-' + autoIndex;
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
                                                            $set: {
                                                                teacher_id: 'SCH-TCH-' + autoIndex
                                                            },
                                                            $push: {
                                                                subjects
                                                            }
                                                        });
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
module.exports = router;
