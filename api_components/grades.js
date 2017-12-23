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
var url = 'mongodb://' + config.dbhost + ':27017/s_erp_data';

var cookieParser = require('cookie-parser');
router.use(function (req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
});

// Add Schools

router.route('/grades/:school_id')
    .post(function (req, res, next) {
        var status = 1;
        var school_id = req.params.school_id;
        var item = {
            grade_id: 'getauto',
            school_id: school_id,
            grade: req.body.grade,
            range_from: req.body.range_from,
            range_to: req.body.range_to,
            status: status,

        };
        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'grades', function (err, autoIndex) {
                var collection = db.collection('grades');
                collection.ensureIndex({
                    "grade_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.grade == null) {
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
                                            grade_id: school_id + '-GRADE-' + autoIndex
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
        var school_id = req.params.school_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('grades').find({ school_id: school_id });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    grades: resultArray
                });
            });
        });
    });

router.route('/grades_edit/:grade_id')
    .put(function (req, res, next) {
        var myquery = { grade_id: req.params.grade_id };
        var grade = req.body.grade;
        var range_from = req.body.range_from;
        var range_to = req.body.range_to;
        mongo.connect(url, function (err, db) {
            db.collection('grades').update(myquery, {
                $set: {
                    grade: grade,
                    range_from: range_from,
                    range_to: range_to,
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



router.route('/grades_delete/:grade_id')
    .delete(function (req, res, next) {
        var myquery = { grade_id: req.params.grade_id };

        mongo.connect(url, function (err, db) {
            db.collection('grades').deleteOne(myquery, function (err, result) {
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
