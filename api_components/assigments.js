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
router.use(function(req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
});

// Add Schools

router.route('/assignment/:section_id/:lesson_id')
    .post(function(req, res, next) {
        var status = 1;
        var section_id = req.params.section_id;
        var lesson_id = req.params.lesson_id;
        // var chapter_name = req.params.chapter_name;
        books = [];
        var item = {
            assignment_id: 'getauto',
            section_id: section_id,
            lesson_id: lesson_id,
            chapter_name: req.body.chapter_name,
            assignment_title: req.body.assignment_title,
            subject_name: req.body.subject_name,
            due_date: req.body.due_date,
            description: req.body.description,
            status: status,
        };
        mongo.connect(url, function(err, db) {
            autoIncrement.getNextSequence(db, 'assignments', function(err, autoIndex) {
                var collection = db.collection('assignments');
                collection.ensureIndex({
                    "assignment_id": 1,
                }, {
                    unique: true
                }, function(err, result) {
                    if (item.assignment_title == null) {
                        res.end('null');
                    } else {
                        collection.insertOne(item, function(err, result) {
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
                                    assignment_id: 'ASMT-' + autoIndex
                                }
                            }, function(err, result) {
                                db.close();
                                res.end('true');
                            });
                        });
                    }
                });
            });
        });
    })


    .get(function(req, res, next) {
        var resultArray = [];
        mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            var cursor = db.collection('assignments').find();
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    assignments: resultArray
                });
            });
        });
    });

router.route('/assignment_edit/:assignment_id/:name/:value')
    .post(function(req, res, next) {
        var assignment_id = req.params.assignment_id;
        var name = req.params.name;
        var value = req.params.value;
        mongo.connect(url, function(err, db) {
            db.collection('assignments').update({ assignment_id }, { $set: {
                    [name]: value } }, function(err, result) {
                assert.equal(null, err);
                db.close();
                res.send('true');
            });
        });
    });

router.route('/assignment_edit/:assignment_id')
    .get(function(req, res, next) {
        var resultArray = [];
        var assignment_id = req.params.assignment_id;
        mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            var cursor = db.collection('assignments').find({ assignment_id });
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    removed: resultArray
                });
            });
        });
    });

     // Modified
    // Get Assignment Details By AssignmentId

router.route('/assignment_details/:assignment_id')
     .get(function(req, res, next) {
        var assignment_id= req.params.assignment_id;
        var status = 1;
        var resultArray = [];
          mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            var cursor = db.collection('assignments').find({assignment_id});
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    assignment: resultArray
                });
            });
        });
    }); 



//  Modified
// Assignments bulk upload via excel sheet


var storage = multer.diskStorage({ //multers disk storage settings
    destination: function(req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function(req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
    }
});

var upload = multer({ //multer settings
    storage: storage,
    fileFilter: function(req, file, callback) { //file filter
        if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
            return callback(new Error('Wrong extension type'));
        }
        callback(null, true);
    }
}).single('file');

router.route('/bulk_upload_assignments/:section_id/:lesson_id')
    .post(function(req, res, next) {
        var section_id = req.params.section_id;
        var lesson_id = req.params.lesson_id;
        var status = 1;
        var exceltojson;
        upload(req, res, function(err) {
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
                }, function(err, result) {
                    if (err) {
                        return res.json({ error_code: 1, err_desc: err, data: null });
                    }
                    res.json({ data: result });
                    console.log(result[0]);
                    var test = result;
                    var count = 0;

                    if (test.length > 0) {
                        test.forEach(function(key, value) {

                            var item = {
                                assignment_id: 'getauto',
                                section_id: section_id,
                                lesson_id: lesson_id,
                                chapter_name: key.chaptername,
                                assignment_title: key.assignmenttitle,
                                subject_name: key.subjectname,
                                due_date: key.duedate,
                                description: key.description,
                                status: status,
                            };
                            mongo.connect(url, function(err, db) {
                                autoIncrement.getNextSequence(db, 'assignments', function(err, autoIndex) {

                                    var collection = db.collection('assignments');
                                    collection.ensureIndex({
                                        "assignment_id": 1,
                                    }, {
                                        unique: true
                                    }, function(err, result) {
                                        if (item.section_id == null || item.assignment_title == null) {
                                            res.end('null');
                                        } else {
                                            item.assignment_id = 'ASMT-' + autoIndex;
                                            collection.insertOne(item, function(err, result) {
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



router.route('/edit_assignments/:assignment_id')
    .put(function(req, res, next) {
        var myquery = { assignment_id: req.params.assignment_id };
        var req_assignment_title = req.body.assignment_title;
        var req_chapter_name = req.body.chapter_name;
        var req_due_date = req.body.due_date;
        var req_description = req.body.description;

        mongo.connect(url, function(err, db) {
            db.collection('assignments').update(myquery, {
                $set: {
                    assignment_title: req_assignment_title,
                    chapter_name: req_chapter_name,
                    due_date: req_due_date,
                    description: req_description
                }
            }, function(err, result) {
                assert.equal(null, err);
                if (err) {
                    res.send('false');
                }
                db.close();
                res.send('true');
            });
        });
    });



router.route('/delete_assignments/:assignment_id')
    .delete(function(req, res, next) {
        var myquery = { assignment_id: req.params.assignment_id };

        mongo.connect(url, function(err, db) {
            db.collection('assignments').deleteOne(myquery, function(err, result) {
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