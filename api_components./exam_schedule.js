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

// Add Exam Schedule

router.route('/exam_schedule/:school_id')
    .post(function(req, res, next) {
        var school_id = req.params.school_id;
        var status = 1;
        subjects = [];
        var item = {
            exam_sch_id: 'getauto',
            school_id: school_id,
            exam_title: req.body.exam_title,          
            from_date: req.body.from_date,
            status: status,
        };
        mongo.connect(url, function(err, db) {
            autoIncrement.getNextSequence(db, 'exam_schedule', function(err, autoIndex) {
                var collection = db.collection('exam_schedule');
                collection.ensureIndex({
                    "exam_sch_id": 1,
                }, {
                    unique: true
                }, function(err, result) {
                    if (item.school_id == null || item.exam_title == null) {
                        res.end('null');
                    } else {
                        collection.insertOne(item, function(err, result) {
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
                                    exam_sch_id: school_id + '-EXM_SCH-' + autoIndex
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
        var school_id = req.params.school_id;
        var resultArray = [];
        mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            var cursor = db.collection('exam_schedule').find({ school_id });
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    exam_schedules: resultArray
                });
            });
        });
    });

router.route('/get_exam_schedule/:exam_sch_id')
    .get(function(req, res, next) {
      var exam_sch_id = req.params.exam_sch_id;
        var resultArray = [];
        mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            var cursor = db.collection('exam_schedule').find({exam_sch_id});
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    exam_schedule: resultArray
                });
            });
        });
    });


//  Modified
// Exam Schedule bulk upload via excel sheet


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

router.route('/bulk_upload_exam_schedule/:school_id')
    .post(function(req, res, next) {
        var school_id = req.params.school_id;
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
                                exam_sch_id: 'getauto',
                                school_id: school_id,
                                exam_title: key.examtitle,
                                exam_classes: key.examclasses,
                                from_date: key.fromdate,
                                status: status,
                            };
                            mongo.connect(url, function(err, db) {
                                autoIncrement.getNextSequence(db, 'exam_schedule', function(err, autoIndex) {

                                    var collection = db.collection('exam_schedule');
                                    collection.ensureIndex({
                                        "exam_sch_id": 1,
                                    }, {
                                        unique: true
                                    }, function(err, result) {
                                        if (item.school_id == null || item.exam_title == null) {
                                            res.end('null');
                                        } else {
                                            item.exam_sch_id = school_id + '-EXM_SCH-' + autoIndex;
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

router.route('/edit_exam_schedule/:exam_sch_id')
    .put(function(req, res, next) {
        var exam_sch_id = req.params.exam_sch_id;
        var name = req.body.name;
        var value = req.body.value;
        mongo.connect(url, function(err, db) {
            db.collection('exam_schedule').update({ exam_sch_id }, { $set: {
                    [name]: value } }, function(err, result) {
                assert.equal(null, err);
                db.close();
                res.send('true');
            });
        });
    });


router.route('/edit_examschedule/:exam_sch_id')
    .put(function(req, res, next) {
        var myquery = { exam_sch_id: req.params.exam_sch_id };
        var req_exam_title = req.body.exam_title;
     //   var req_exam_classes = req.body.exam_classes;
        var req_start_date = req.body.from_date;

        mongo.connect(url, function(err, db) {
            db.collection('exam_schedule').update(myquery, {
                $set: {
                    exam_title: req_exam_title,
                   // exam_classes: req_exam_classes,
                    from_date: req_start_date
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


router.route('/delete_examschedule/:exam_sch_id')
    .delete(function(req, res, next) {
        var myquery = { exam_sch_id: req.params.exam_sch_id };

        mongo.connect(url, function(err, db) {
            db.collection('exam_schedule').deleteOne(myquery, function(err, result) {
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