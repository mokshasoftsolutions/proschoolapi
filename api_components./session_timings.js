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

router.route('/session_timings/:school_id')
    .post(function (req, res, next) {
        var status = 1;
        var school_id = req.params.school_id;
        var item = {
            session_id: 'getauto',
            school_id: school_id,
            session: req.body.session,
            start_time: req.body.start_time,
            end_time: req.body.end_time,
            status: status,

        };
        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'session_timings', function (err, autoIndex) {
                var collection = db.collection('session_timings');
                collection.ensureIndex({
                    "session_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.session == null) {
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
                                            session_id: school_id + '-SESSION-' + autoIndex
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
            var cursor = db.collection('session_timings').find({ school_id: school_id });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    session_timings: resultArray
                });
            });
        });
    });

router.route('/edit_session/:session_id')
    .put(function (req, res, next) {
        var myquery = { session_id: req.params.session_id };
        var session = req.body.session;
        var start_time = req.body.start_time;
        var end_time = req.body.end_time;
        mongo.connect(url, function (err, db) {
            db.collection('session_timings').update(myquery, {
                $set: {
                    session: session,
                    start_time: start_time,
                    end_time: end_time,
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



router.route('/delete_session/:session_id')
    .delete(function (req, res, next) {
        var myquery = { session_id: req.params.session_id };

        mongo.connect(url, function (err, db) {
            db.collection('session_timings').deleteOne(myquery, function (err, result) {
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
