// flow
var express = require("express");
var config = require("../config.json");
var bodyParser = require("body-parser");
var api_key = "api-key-KJFSI4924R23RFSDFSD7F94";
var mongo = require('mongodb').MongoClient;
var autoIncrement = require("mongodb-autoincrement");
var assert = require('assert');
var multer = require('multer');
var forEach = require('async-foreach').forEach;
var async = require('async');
var waterfall = require('async-waterfall');
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

// Add Schools

router.route('/subjects/:section_id')
    .post(function (req, res, next) {
        var status = 1;
        var section_id = req.params.section_id;
        subjects = [];
        var item = {
            subject_id: 'getauto',
            section_id: section_id,
            name: req.body.name,
        };
        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'subjects', function (err, autoIndex) {
                var collection = db.collection('subjects');
                collection.ensureIndex({
                    "subject_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.name == null) {
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
                                            subject_id: section_id + '-SUB-' + autoIndex
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
        var section_id = req.params.section_id;
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('subjects').find({ section_id });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    subjects: resultArray
                });
            });
        });
    });

router.route('/get_subject_ids/:section_id')
    .get(function (req, res, next) {
        var section_id = req.params.section_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('subjects').aggregate([
                { $match: { section_id } },
                {
                    $group: {
                        _id: '$section_id',
                        subject_ids: { $push: '$subject_id' }
                    }
                }
            ]);
            cursor.forEach(function (doc, err) {
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send(resultArray[0]);
            });
        });
    });

router.route('/get_subject_name/:subject_id')
    .get(function (req, res, next) {
        var subject_id = req.params.subject_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('subjects').aggregate([
                { $match: { subject_id } },
                {
                    $group: {
                        _id: '$subject_id',
                        subject_names: { $push: '$name' }
                    }
                }
            ]);
            cursor.forEach(function (doc, err) {
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send(resultArray[0]);
            });
        });
    });

router.route('/subject_edit/:subject_id/:name/:value')
    .post(function (req, res, next) {
        var subject_id = req.params.subject_id;
        var name = req.params.name;
        var value = req.params.value;
        mongo.connect(url, function (err, db) {
            db.collection('subjects').update({ subject_id }, {
                $set: {
                    [name]: value
                }
            }, function (err, result) {
                assert.equal(null, err);
                db.close();
                res.send('true');
            });
        });
    });


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

router.route('/bulk_upload_subjects/:section_id')
    .post(function (req, res, next) {
        var section_id = req.params.section_id;
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
                    //  console.log(result[0]);
                    var test = result;
                    var count = 0;

                    if (test.length > 0) {
                        test.forEach(function (key, value) {

                            var item = {
                                subject_id: 'getauto',
                                section_id: section_id,
                                name: req.body.name,
                            };
                            mongo.connect(url, function (err, db) {
                                autoIncrement.getNextSequence(db, 'subjects', function (err, autoIndex) {

                                    var collection = db.collection('subjects');
                                    collection.createIndex({
                                        "subject_id": 1,
                                    }, {
                                            unique: true
                                        }, function (err, result) {
                                            if (item.section_id == null || item.name == null) {
                                                res.end('null');
                                            } else {
                                                item.subject_id = section_id + '-SUB-' + autoIndex;
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


router.route('/edit_subjects/:subject_id')
    .put(function (req, res, next) {
        var myquery = { subject_id: req.params.subject_id };
        var req_name = req.body.name;


        mongo.connect(url, function (err, db) {
            db.collection('subjects').update(myquery, { $set: { name: req_name } }, function (err, result) {
                assert.equal(null, err);
                if (err) {
                    res.send('false');
                }
                db.close();
                res.send('true');
            });
        });
    });


router.route('/delete_subjects/:subject_id')
    .delete(function (req, res, next) {
        var myquery = { subject_id: req.params.subject_id };

        mongo.connect(url, function (err, db) {
            db.collection('subjects').deleteOne(myquery, function (err, result) {
                assert.equal(null, err);
                if (err) {
                    res.send('false');
                }
                else {
                    mongo.connect(url, function (err, db) {
                        db.collection('coursework').deleteOne(myquery, function (err, result) {
                            assert.equal(null, err);
                            if (err) {
                                res.send('false');
                            }
                            else {
                                mongo.connect(url, function (err, db) {
                                    db.collection('assignments').deleteOne(myquery, function (err, result) {
                                        assert.equal(null, err);
                                        if (err) {
                                            res.send('false');
                                        }
                                        else {
                                            mongo.connect(url, function (err, db) {
                                                db.collection('assignment_marks').deleteOne(myquery, function (err, result) {
                                                    assert.equal(null, err);
                                                    if (err) {
                                                        res.send('false');
                                                    }
                                                });
                                            });
                                        }
                                    });
                                });
                            }
                        });
                    });
                }
                db.close();
                res.send('true');
            });
        });
    });


router.route('/all_subjects_of_chapters_completed_topics/:section_id')
    .get(function (req, res, next) {
        var resultArray = [];
        var section_id = req.params.section_id;
        var chaptersObject = [];
        var subjectsObject = [];

        mongo.connect(url, function (err, db) {

            async.waterfall(
                [
                    function getSubjects(next) {
                        //   console.log("getSubjects");
                        db.collection('subjects').find({
                            section_id
                        }).toArray(function (err, result) {
                            if (err) {
                                next(err, null);
                            }
                            next(null, result);
                        });
                    },
                    function getChaptersData(result, next) {
                        //   console.log("getChaptersData");                      
                        var count = 0;
                        var subjectResult = result;
                        var subjectResultLength = result.length;
                        if (subjectResultLength == 0) {
                            next(null, []);
                        } else {
                            //  console.log("In Second step sections")
                            subjectResult.forEach(function (subjectData) {
                                var subject_id = subjectData.subject_id;
                                // console.log(subject_id);
                                db.collection('coursework').find({
                                    subject_id
                                }).sort({ name: 1 }).toArray(function (err, results) {
                                    count++;
                                    if (err) {
                                        next(err, null);
                                    }
                                    subjectData.chapters = results
                                    // console.log(subjectData.chapters);

                                    if (subjectResultLength == count) {

                                        next(null, subjectResult);
                                        // next(null, classData);
                                    }

                                })
                            })
                        }
                    }, function getchaptersTopicsData(result, next) {
                        //  console.log(result);
                        var count = 0;
                        var subjectResult = result;
                        var subjectDataLength = result.length;
                        //  console.log(classData.sections);
                        if (subjectDataLength == 0) {
                            next(null, []);
                        } else {
                           // console.log("In fourth step sections attendance")
                            subjectResult.forEach(function (subjectData) {
                                subjectChapters = [];
                                // attendenceClass = [];

                                var chaptersCount = 0;
                                var subjectName = subjectData.name;
                                var subjectsData = subjectData;
                                var subject_id = subjectData.subject_id;
                               
                                subjectChapters = subjectData.chapters;
                                //  console.log(subject_id);
                                //  console.log(subjectData.chapters +"hema"+ chaptersCount);
                                chaptersObject = [];
                                for (i = 0; i < subjectChapters.length; i++) {
                                    var chapterName = subjectChapters[i].title;
                                    var no_of_topics = subjectChapters[i].no_of_topics;
                                    // console.log(subjectChapters[i]);
                                    var completed_topics = subjectChapters[i].completed_topics;
                                    var percent = completed_topics*100/no_of_topics;
                                    var chapter_code=subjectChapters[i] .chapter_code;
                                    chaptersObject.push({ "chapterName": chapterName, "no_of_topics":no_of_topics,"percent":percent+"%","completed_topics": completed_topics,"chapter_code":chapter_code });

                                }
                                subjectsObject.push({ "subjectName": subjectName, "chapters": chaptersObject })

                                count++;

                                if (subjectDataLength == count) {
                                    next(null, subjectsObject);
                                }

                            });

                        }
                    }
                ],
                function (err, result1) {

                    db.close();
                    if (err) {
                        res.send({
                            error: err
                        });

                    } else {

                        res.send({
                            subjects: result1
                        });

                    }
                }
            );
        });
    });


module.exports = router;