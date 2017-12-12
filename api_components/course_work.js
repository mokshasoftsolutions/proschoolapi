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

// Add Exams

router.route('/course_works/:subject_id')
    .post(function (req, res, next) {

        var status = 1;
        var subject_id = req.params.subject_id;
        // var subject_name = req.params.subject_name;

        var item = {
            lession_id: 'getauto',
            subject_id: subject_id,
            title: req.body.title,
            chapter_code: req.body.chapter_code,
            no_of_topics: req.body.no_of_topics,
            description: req.body.description,
            status: status,

        };
        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'coursework', function (err, autoIndex) {
                var collection = db.collection('coursework');
                collection.ensureIndex({
                    "lession_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.title == null || item.chapter_code == null || item.no_of_topics == null) {
                            res.end('null');
                        } else {
                            collection.insertOne(item, function (err, result) {
                                if (err) {
                                    if (err.code == 11000) {
                                        console.log(err);
                                        res.end('false');
                                    }
                                    res.end('false');
                                }
                                collection.update({
                                    _id: item._id
                                }, {
                                        $set: {
                                            lession_id: subject_id + '-LES-' + autoIndex
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
        var subject_id = req.params.subject_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            //  var cursor = db.collection('coursework').find({ subject_id });
            var cursor = db.collection('coursework').aggregate([
                {
                    $match: {
                        'subject_id': subject_id
                    }
                },
                {
                    "$lookup": {
                        "from": "subjects",
                        "localField": "subject_id",
                        "foreignField": "subject_id",
                        "as": "subjects"
                    }
                }
            ])
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    chapters: resultArray
                });
            });
        });
    });

// MOdified
// New api of chapter completion result

router.route('/no_of_classes_to_chapter/:subject_id')
    .post(function (req, res, next) {

        var status = 1;
        var subject_id = req.params.subject_id;
        var start_date = req.body.start_date;
        var end_date = req.body.end_date;
        start_date = new Date(start_date);
        end_date = new Date(end_date);
        var start_date_milliSeconds = start_date.getTime();
        var end_date_milliSeconds = end_date.getTime();
        var no_of_days = (end_date_milliSeconds - start_date_milliSeconds) / (1000 * 24 * 60 * 60);
        var totalSundays = 0;
        var class_status = count = 0;


        for (var i = start_date; i <= end_date;) {
            if (i.getDay() == 0) {
                totalSundays++;
            }
            i.setTime(i.getTime() + 1000 * 60 * 60 * 24);
        }
        var no_of_days_except_sundays = no_of_days - totalSundays + 1;

        var item = {
            chapter_id: 'getauto',
            lession_id: req.body.lession_id,
            start_date: req.body.start_date,
            end_date: req.body.end_date,
            subject_id: subject_id,
            title: req.body.title,
            classes: no_of_days_except_sundays,
            class_status: class_status,
            count: count,
            chapter_code: req.body.chapter_code,
            no_of_topics: req.body.no_of_topics,
            description: req.body.description,
            status: status,

        };
        // console.log(no_of_days + "hema");
        // console.log(totalSundays + "babu");
        // console.log(no_of_days_except_sundays);

        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'chapters', function (err, autoIndex) {
                var collection = db.collection('chapters');
                collection.ensureIndex({
                    "chapter_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.title == null || item.start_date == null || item.end_date == null) {
                            res.end('null');
                        } else {
                            collection.insertOne(item, function (err, result) {
                                if (err) {
                                    if (err.code == 11000) {
                                        console.log(err);
                                        res.end('false');
                                    }
                                    res.end('false');
                                }
                                collection.update({
                                    _id: item._id
                                }, {
                                        $set: {
                                            chapter_id: subject_id + '-CHP-' + autoIndex
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
        var subject_id = req.params.subject_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            //  var cursor = db.collection('coursework').find({ subject_id });
            var cursor = db.collection('chapters').aggregate([
                {
                    $match: {
                        'subject_id': subject_id
                    }
                },
                {
                    "$lookup": {
                        "from": "subjects",
                        "localField": "subject_id",
                        "foreignField": "subject_id",
                        "as": "subjects"
                    }
                }
            ])
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    chapters: resultArray
                });
            });
        });
    });


router.route('/edit_chapters/:chapter_id')
    .put(function (req, res, next) {
        var myquery = { chapter_id: req.params.chapter_id };
        var req_count = req.body.no_of_completed_classes;
        var req_classes = req.body.classes;
        var req_class_status = (req_count / req_classes) * 100;


        mongo.connect(url, function (err, db) {
            db.collection('chapters').update(myquery, {
                $set: {
                    count: req_count,
                    class_status: req_class_status,
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



router.route('/topics/:lession_id')
    .post(function (req, res, next) {
        var lession_id = req.params.lession_id;
        var status = 1;
        subjects = [];
        var item = {
            topic_id: 'getauto',
            lession_id: lession_id,
            title: req.body.title,
            description: req.body.description,
            status: status,
        };
        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'topics', function (err, autoIndex) {
                var collection = db.collection('topics');
                collection.ensureIndex({
                    "topic_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.lession_id == null || item.title == null) {
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
                                            topic_id: lession_id + '-TOPIC' + autoIndex
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
        var lession_id = req.params.lession_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('topics').find({ lession_id });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    chapters: resultArray
                });
            });
        });
    });


// Modified
// Get Chapter Details By LessionId

router.route('/course_details/:lession_id')
    .get(function (req, res, next) {
        var lession_id = req.params.lession_id;
        var status = 1;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('coursework').find({ lession_id });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    coursework: resultArray
                });
            });
        });
    });



router.route('/topic_notes/:topic_id')
    .post(function (req, res, next) {
        var topic_id = req.params.topic_id;
        var status = 1;
        subjects = [];
        var item = {
            notes_id: 'getauto',
            topic_id: topic_id,
            file_name: req.body.file_name,
            link_path: req.body.link_path,
            description: req.body.description,
            status: status,
        };
        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'topic_notes', function (err, autoIndex) {
                var collection = db.collection('topic_notes');
                collection.ensureIndex({
                    "notes_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.file_name == null || item.link_path == null) {
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
                                            notes_id: topic_id + '-NOTES' + autoIndex
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
        var topic_id = req.params.topic_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('topic_notes').find({ topic_id });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    [topic_id]: resultArray
                });
            });
        });
    });


//
// router.route('/exam_edit/:exam_id')
//     .post(function(req, res, next){
//       var exam_id = req.params.exam_id;
//       var name = req.body.name;
//       var value = req.body.value;
//       mongo.connect(url, function(err, db){
//             db.collection('schools').update({exam_id},{$set:{[name]: value}}, function(err, result){
//               assert.equal(null, err);
//                db.close();
//                res.send('true');
//             });
//       });
//     });



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

router.route('/bulk_upload_courseworks/:subject_id')
    .post(function (req, res, next) {
        var subject_id = req.params.subject_id;
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
                    console.log(result);
                    var test = result;
                    var count = 0;

                    if (test.length > 0) {
                        test.forEach(function (key, value) {

                            var item = {
                                lession_id: 'getauto',
                                subject_id: subject_id,
                                title: key.title,
                                chapter_code: key.chapter_code,
                                no_of_topics: key.no_of_topics,
                                description: key.description,
                                status: status,

                            };
                            mongo.connect(url, function (err, db) {
                                autoIncrement.getNextSequence(db, 'coursework', function (err, autoIndex) {

                                    var collection = db.collection('coursework');
                                    collection.ensureIndex({
                                        "lession_id": 1,
                                    }, {
                                            unique: true
                                        }, function (err, result) {
                                            if (item.subject_id == null || item.title == null) {
                                                res.end('null');
                                            } else {
                                                item.lession_id = subject_id + '-LES-' + autoIndex;
                                                collection.insertOne(item, function (err, result) {
                                                    if (err) {
                                                        console.log(err);
                                                        if (err.code == 11000) {

                                                            res.end('false');
                                                        }
                                                        res.end('false');
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




router.route('/edit_course_work/:lession_id')
    .put(function (req, res, next) {
        var myquery = { lession_id: req.params.lession_id };
        var req_title = req.body.title;
        var req_chapter_code = req.body.chapter_code;
        var req_no_of_topics = req.body.no_of_topics;
        var req_description = req.body.description;

        mongo.connect(url, function (err, db) {
            db.collection('coursework').update(myquery, {
                $set: {
                    title: req_title,
                    chapter_code: req_chapter_code,
                    no_of_topics: req_no_of_topics,
                    description: req_description
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


router.route('/delete_course_work/:lession_id')
    .delete(function (req, res, next) {
        var myquery = { lession_id: req.params.lession_id };

        mongo.connect(url, function (err, db) {
            db.collection('coursework').deleteOne(myquery, function (err, result) {
                assert.equal(null, err);
                if (err) {
                    res.send('false');
                }
                db.close();
                res.send('true');
            });
        });
    });


module.exports = router;