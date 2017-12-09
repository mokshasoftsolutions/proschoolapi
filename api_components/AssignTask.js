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

// Add Timetable

router.route('/task/:school_id')
    .post(function (req, res, next) {
        var date = new Date();
        var school_id = req.params.school_id;
        var assigned_to = [];
        var item = {
            task_id: 'getauto',
            task: req.body.task,
            school_id: school_id,
            priority: req.body.priority,
            posted_by: req.body.posted_by,
            assigned_on: date,
            status: "pending",
        }
        assigned_to = req.body.assigned_to;
        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'tasks', function (err, autoIndex) {
                var collection = db.collection('tasks');
                collection.ensureIndex({
                    "task_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.task == null) {
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
                                            task_id: 'TASK-' + autoIndex
                                        },
                                        $push: {
                                            assigned_to
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
router.route('/tasks/:sender_id')
    .get(function (req, res, next) {
        var resultArray = [];
        var sender_id = req.params.sender_id;
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('tasks').find({ "assigned_to": { sender_id: sender_id } });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    tasks: resultArray
                });
            });
        });
    });
router.route('/tasks_manager/:school_id')
    .get(function (req, res, next) {
        var resultArray = [];
        var school_id = req.params.school_id;
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('tasks').find({ school_id: school_id });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    tasks: resultArray
                });
            });
        });
    });

router.route('/edit_task/:task_id')
    .put(function (req, res, next) {
        var myquery = { task_id: req.params.task_id };
        var req_status = req.body.status;


        mongo.connect(url, function (err, db) {
            db.collection('tasks').update(myquery, {
                $set: {
                    status: req_status,
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




module.exports = router;