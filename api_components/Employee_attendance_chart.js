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
// var fixtureData = require('./fixture_data.json');
// app.locals.barChartHelper = require('./bar_chart_helper');
var url = 'mongodb://' + config.dbhost + ':27017/s_erp_data';

var cookieParser = require('cookie-parser');
router.use(function (req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
});

router.route('/employee_attendancebydate/:select_date/:school_id')
    .get(function (req, res, next) {
        var select_date = new Date(req.params.select_date);
        school_id = req.params.school_id;
        var endDate = new Date(select_date);
        endDate.setDate(endDate.getDate() + 1)
        var present = 0, absent = 0, onLeave = 0;
        var count = 0, dataCount;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
           
            var cursor = db.collection('employee_attendance').find({ date: new Date(select_date), school_id: school_id });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    donutchart: resultArray,
                    count: count,
                    present: present,
                    onleave: onLeave,
                    absent: absent
                });
            });
        });
    });


router.route('/employee_attendance_by_date/:select_date/:school_id')
    .get(function (req, res, next) {
        var select_date = new Date(req.params.select_date);
        var school_id = req.params.school_id;
        var endDate = new Date(select_date);
        endDate.setDate(endDate.getDate() + 1)
        var present = 0, absent = 0, onLeave = 0;
        var count = 0, dataCount;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var data = db.collection('employee_attendance').find({
                date: { $gte: new Date(select_date.toISOString()), $lt: new Date(endDate.toISOString()) },
                school_id: school_id
            })
            dataCount = data.count(function (e, triggerCount) {
                if (triggerCount > 0) {
                    count = triggerCount;
                }
            });

            data.forEach(function (doc, err) {
                if (doc.status == "Present") {
                    present += 1;
                }
                else if (doc.status == "Absent") {
                    absent += 1;
                }
                else if (doc.status == "On Leave") {
                    onLeave += 1;
                }
            })
            var cursor = db.collection('employee_attendance').aggregate([
                {
                    $match: {
                        'date': {
                            $gte: new Date(select_date.toISOString()),
                            $lt: new Date(endDate.toISOString())
                        },
                        'school_id': school_id
                    }
                },
                {
                    "$lookup": {
                        "from": "employee",
                        "localField": "employee_id",
                        "foreignField": "employee_id",
                        "as": "employee_doc"
                    }
                },
                {
                    "$unwind": "$employee_doc"
                },
                {
                    "$project": {
                        "_id": "$_id",
                        "employee_id": "$employee_id",
                        "first_name": "$employee_doc.first_name",
                        "last_name": "$employee_doc.last_name",
                        "status": "$status",
                        "gender": "$employee_doc.gender",
                        "employee_type": "$employee_doc.job_category",

                    }
                }
            ])
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    donutchart: resultArray, count: count,
                    present: present,
                    onleave: onLeave,
                    absent: absent
                });
            });
        });
    });






router.route('/employee_attendance_by_month/:select_month/:employee_id/:school_id')
    .get(function (req, res, next) {
        var select_month = req.params.select_month;
        var school_id = req.params.school_id;
        var employee_id = req.params.employee_id;
        var date = new Date();

        var firstDay = new Date(date.getFullYear(), select_month - 1, 1);
        var lastDay = new Date(date.getFullYear(), select_month, 1);
        //  console.log(firstDay);
        //  console.log(lastDay);
        var present = 0, absent = 0, onLeave = 0;
        var count = 0, dataCount;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var data = db.collection('employee_attendance').find({
                date: { $gt:firstDay, $lte: lastDay },
                school_id: school_id,
                employee_id:employee_id
            })
            dataCount = data.count(function (e, triggerCount) {
                if (triggerCount > 0) {
                    count = triggerCount;
                }
            });

            data.forEach(function (doc, err) {
                if (doc.status == "Present") {
                    present += 1;
                }
                else if (doc.status == "Absent") {
                    absent += 1;
                }
                else if (doc.status == "On Leave") {
                    onLeave += 1;
                }
            })
            // var cursor = db.collection('employee_attendance').find({ date: { $gte: firstDay, $lt: lastDay }, school_id: school_id });
            var cursor = db.collection('employee_attendance').aggregate([
                {
                    $match: {
                        'date': {
                            $gte: firstDay,
                            $lt: lastDay
                        },
                        'school_id': school_id,
                        'employee_id':employee_id
                    }
                },
                {
                    "$lookup": {
                        "from": "employee",
                        "localField": "employee_id",
                        "foreignField": "employee_id",
                        "as": "employee_doc"
                    }
                },
                {
                    "$unwind": "$employee_doc"
                },
                {
                    "$project": {
                        "_id": "$_id",
                        "employee_id": "$employee_id",
                        "first_name": "$employee_doc.first_name",
                        "last_name": "$employee_doc.last_name",
                        "status": "$status",
                        "date":"$date",
                        "gender": "$employee_doc.gender",
                        "employee_type": "$employee_doc.job_category",

                    }
                }
            ])
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    donutchart: resultArray,
                    count: count,
                    present: present,
                    onleave: onLeave,
                    absent: absent
                });
            });
        });
    });

module.exports = router;


