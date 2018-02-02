// flow
var express = require("express");
var config = require("../config.json");
var bodyParser = require("body-parser");
var api_key = "api-key-KJFSI4924R23RFSDFSD7F94";
var mongo = require('mongodb').MongoClient;
var autoIncrement = require("mongodb-autoincrement");
var assert = require('assert');
var port = process.env.PORT || 4005;
var forEach = require('async-foreach').forEach;
var router = express.Router();
var url = 'mongodb://' + config.dbhost + ':27017/s_erp_data';

var cookieParser = require('cookie-parser');
router.use(function (req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
});

// Add Timetable

router.route('/messages/:school_id')
    .post(function (req, res, next) {
        var status = 1;
        var date = new Date();
        var school_id = req.params.school_id;

        var item = {
            message_id: 'getauto',
            message: req.body.message,
            subject: req.body.subject,
            sent_to: req.body.sent_to,
            posted_on: date,
            school_id: school_id,
            status: status,
        }

        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'messages', function (err, autoIndex) {
                var collection = db.collection('messages');
                collection.ensureIndex({
                    "message_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.message == null) {
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
                                            message_id: 'MSG-' + autoIndex
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
router.route('/messages/:receivers/:school_id')
    .get(function (req, res, next) {
        var resultArray = [];
        var receivers = req.params.receivers;
        var school_id = req.params.school_id;
        var cursor;
        if (receivers == "teachers") {
            receivers = "parents";
        }
        else if (receivers == "parents") {
            receivers = "teachers";
        }
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);

            if (receivers != "all") {
                cursor = db.collection('messages').find({ 'sent_to': { $ne: receivers }, school_id: school_id }).sort({ posted_on: -1 });
            }
            else if (receivers == "all") {
                cursor = db.collection('messages').find({ 'sent_to': receivers, school_id: school_id }).sort({ posted_on: -1 });
            }
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    messages: resultArray
                });
            });
        });
    });

router.route('/total_messages/:school_id')
    .get(function (req, res, next) {
        var resultArray = [];
        var school_id = req.params.school_id;
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('messages').find({ school_id: school_id });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    messages: resultArray
                });
            });
        });
    });

// Teacher send message to parent

router.route('/teacher_msg_all_parents/:section_id/:student_id/:parent_id')
    .post(function (req, res, next) {
        var status = 1;
        var date = new Date();
        var parent_id = req.params.parent_id;
        var student_id = req.params.student_id;
        var section_id = req.params.section_id;
        var splited = section_id.split("-");
        var school_id = splited[0] + '-' + splited[1];

        var item = {
            message_tacher_id: '',
            student_id: student_id,
            section_id: section_id,
            school_id: school_id,
            parent_id: parent_id,
            teacher_id: req.body.teacher_id,
            date: new Date(),
            message: req.body.message
        };

        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'teacher_messages', function (err, autoIndex) {
                var collection = db.collection('teacher_messages');
                collection.ensureIndex({
                    "message_tacher_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.message == null || item.parent_id == null) {
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
                                            message_tacher_id: 'Teacher-Msg-' + autoIndex
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
// Teacher send Message to parents
router.route('/teacher_msg_all_parents/:section_id/:school_id')
    .post(function (req, res, next) {

        // var class_id = req.params.class_id;
        var section_id = req.params.section_id;
        var school_id = req.params.school_id;
        var teacher_id = req.body.teacher_id;
        var d = new Date();
        var message = req.body.message;

        if (section_id == null || school_id == null || !req.body.parents) {
            res.end('null');
        } else {
            var count = 0;
            if (req.body.parents.length > 0) {
                forEach(req.body.parents, function (key, value) {

                    var item = {
                        message_tacher_id: '',
                        section_id: section_id,
                        school_id: school_id,
                        teacher_id: teacher_id,
                        date: new Date(),
                        student_id: key.student_id,
                        parent_id: key.parent_id,
                        message: message
                    };

                    mongo.connect(url, function (err, db) {
                        autoIncrement.getNextSequence(db, 'teacher_messages', function (err, autoIndex) {
                            var collection = db.collection('teacher_messages');
                            collection.ensureIndex({
                                "message_tacher_id": 1,
                            }, {
                                    unique: true
                                }, function (err, result) {
                                    if (item.section_id == null || item.message == null || item.parent_id == null) {
                                        res.end('null');
                                    } else {
                                        item.message_tacher_id = 'Teacher-Msg-' + autoIndex;
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

                                            if (count == req.body.parents.length) {
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
        }
    })


router.route('/parent_get_messages/:parent_id')
    .get(function (req, res, next) {
        var resultArray = [];
        var parent_id = req.params.parent_id;
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('teacher_messages').find({ parent_id: parent_id });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    messages: resultArray
                });
            });
        });
    });




module.exports = router;