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
      //  var assigned_to = [];
        var item = {
            task_id: 'getauto',
            task: req.body.task,
            school_id: school_id,
            department: req.body.department,
            priority: req.body.priority,
            assigned_to: req.body.assigned_to,
            posted_by: req.body.posted_by,
            employee_id: req.body.employee_id,
            assigned_on: date,
            status: "pending",
        }

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
            //var cursor = db.collection('tasks').find({ school_id: school_id });
            var cursor = db.collection('tasks').aggregate([
                {
                    $match: {
                        school_id: school_id
                    }
                },
                {
                    $lookup: {
                        from: "employee",
                        localField: "employee_id",
                        foreignField: "employee_id",
                        as: "employee_doc"
                    }
                },
                {
                    "$project": {
                        "_id": "$_id",
                        "task_id": "$task_id",
                        "task": "$task",
                        "employee_id": "$employee_doc.employee_id",
                        "school_id": "$school_id",
                        "department": "$department",
                        "priority": "$priority",
                        "assigned_to": "$assigned_to",
                        "status": "$status",
                        "assigned_on": "$assigned_on"
                    }
                }
            ]);
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



router.route('/currentDay_task/:select_date/:school_id')
    .get(function (req, res, next) {
        var resultArray = [];
        var school_id = req.params.school_id;
        var select_date = new Date(req.params.select_date);
        var endDate = new Date(select_date);
        endDate.setDate(endDate.getDate() + 1)
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('tasks').find({
                assigned_on: {
                    $gte: new Date(select_date.toISOString()),
                    $lt: new Date(endDate.toISOString())
                },
                school_id: school_id
            });
            // var cursor = db.collection('tasks').aggregate([
            //     {
            //         $match: {

            //             'assigned_on': {
            //                 $gte: new Date(select_date.toISOString()),
            //                 $lt: new Date(endDate.toISOString())
            //             },
            //             school_id: school_id

            //         }
            //     },
            //     {
            //         $lookup: {
            //             from: "employee",
            //             localField: "employee_id",
            //             foreignField: "employee_id",
            //             as: "employee_doc"
            //         }
            //     },
            //     {
            //         "$project": {
            //             "_id": "$_id",
            //             "task_id": "$task_id",
            //             "task": "$task",
            //             "employee_id": "$employee_doc.employee_id",
            //             "school_id": "$school_id",
            //             "department": "$department",
            //             "priority": "$priority",
            //             "assigned_to": "$assigned_to",
            //             "status": "$status",
            //             "assigned_on": "$assigned_on"
            //         }
            //     }
            // ]);
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



router.route('/edit_task_management/:task_id')
    .put(function (req, res, next) {
        var myquery = { task_id: req.params.task_id };
        var req_priority = req.body.priority;
        var req_department = req.body.department;
        var req_assigned_on = req.body.assigned_on;
        var assigned_to = req.body.assigned_to;
        var req_status = req.body.status;
        var req_task = req.body.task;


        mongo.connect(url, function (err, db) {
            db.collection('tasks').update(myquery, {
                $set: {
                    priority: req_priority,
                    assigned_on: req_assigned_on,
                    department: req_department,
                    assigned_to: assigned_to,
                    status: req_status,
                    task: req_task,
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


router.route('/delete_task_management/:task_id')
    .delete(function (req, res, next) {
        var myquery = { task_id: req.params.task_id };

        mongo.connect(url, function (err, db) {
            db.collection('tasks').deleteOne(myquery, function (err, result) {
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