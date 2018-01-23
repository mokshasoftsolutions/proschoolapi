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

router.route('/attendancechartbydate/:select_date/:class_id/:section_id')
    .get(function (req, res, next) {
        var select_date = new Date(req.params.select_date);
        var section_id = req.params.section_id;
        var class_id = req.params.class_id;
        var endDate = new Date(select_date);
        var present = 0, absent = 0, onLeave = 0;
        endDate.setDate(endDate.getDate() + 1);
        var count = 0, dataCount;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var data = db.collection('attendance').find({
                date: { $gte: new Date(select_date.toISOString()), $lt: new Date(endDate.toISOString()) },
                section_id: section_id
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

            var cursor = db.collection('attendance').aggregate([
                {
                    $match: {
                        'date': {
                            $gte: new Date(select_date.toISOString()),
                            $lt: new Date(endDate.toISOString())
                        },
                        section_id: section_id
                    }
                },
                {
                    "$lookup": {
                        "from": "students",
                        "localField": "student_id",
                        "foreignField": "student_id",
                        "as": "student_doc"
                    }
                },
                {
                    "$unwind": "$student_doc"
                },
                {
                    "$lookup": {
                        "from": "school_classes",
                        "localField": "class_id",
                        "foreignField": "class_id",
                        "as": "class_doc"
                    }
                },
                {
                    "$unwind": "$class_doc"
                },
                {
                    "$lookup": {
                        "from": "class_sections",
                        "localField": "section_id",
                        "foreignField": "section_id",
                        "as": "section_doc"
                    }
                },
                {
                    "$unwind": "$section_doc"
                },
                {
                    "$redact": {
                        "$cond": [{
                            "$eq": ["$section_id", section_id]
                        },
                            "$$KEEP",
                            "$$PRUNE"
                        ]
                    }
                },
                {
                    "$project": {
                        "_id": "$_id",
                        "student_id": "$student_id",
                        "first_name": "$student_doc.first_name",
                        "last_name": "$student_doc.last_name",
                        "status": "$status",
                        "gender": "$student_doc.gender",
                        "admission_no": "$student_doc.admission_no",
                        "roll_no": "$student_doc.roll_no",
                        "class_name": "$class_doc.name",
                        "section_name": "$section_doc.name",
                        "date": "$date",
                        //  "date": { $and: [{ $gte: ["$date", new Date(select_date.toISOString())] }, { $lt: ["$date", new Date(endDate.toISOString())] }] }
                        //  "date": { $cond: { if : { $and: [{ $gte: ["$date", new Date(select_date.toISOString())] }, { $lt: ["$date", new Date(endDate.toISOString())] }] } },then: "$date"}


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

router.route('/attendancechartbyStudentAndDate/:select_date/:student_id')
    .get(function (req, res, next) {
        var select_date = new Date(req.params.select_date);
        var student_id = req.params.student_id;
        var endDate = new Date(select_date);
        endDate.setDate(endDate.getDate() + 1);
        var present = 0, absent = 0, onLeave = 0;
        var count = 0, dataCount;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var data = db.collection('attendance').find({
                date: { $gte: new Date(select_date.toISOString()), $lt: new Date(endDate.toISOString()) },
                student_id: student_id
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

            var cursor = db.collection('attendance').aggregate([
                {
                    $match: {
                        'date': {
                            $gte: new Date(select_date.toISOString()),
                            $lt: new Date(endDate.toISOString())
                        },
                        student_id: student_id
                    }
                },
                {
                    "$lookup": {
                        "from": "students",
                        "localField": "student_id",
                        "foreignField": "student_id",
                        "as": "student_doc"
                    }
                },
                {
                    "$unwind": "$student_doc"
                },
                {
                    "$lookup": {
                        "from": "school_classes",
                        "localField": "class_id",
                        "foreignField": "class_id",
                        "as": "class_doc"
                    }
                },
                {
                    "$unwind": "$class_doc"
                },
                {
                    "$lookup": {
                        "from": "class_sections",
                        "localField": "section_id",
                        "foreignField": "section_id",
                        "as": "section_doc"
                    }
                },
                {
                    "$unwind": "$section_doc"
                },
                {
                    "$project": {
                        "_id": "$_id",
                        "student_id": "$student_id",
                        "first_name": "$student_doc.first_name",
                        "last_name": "$student_doc.last_name",
                        "status": "$status",
                        "gender": "$student_doc.gender",
                        "admission_no": "$student_doc.admission_no",
                        "roll_no": "$student_doc.roll_no",
                        "class_name": "$class_doc.name",
                        "section_name": "$section_doc.name",
                        "date": "$date",

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

router.route('/attendancechartbymonth/:select_month/:student_id')
    .get(function (req, res, next) {
        var select_month = req.params.select_month;
        //   var section_id = req.params.section_id;
        //   var class_id = req.params.class_id;
        var student_id = req.params.student_id;
        var date = new Date();
        var present = 0, absent = 0, onLeave = 0;
        var count = 0, dataCount;
        var firstDay = new Date(date.getFullYear(), select_month - 1, 1);
        var lastDay = new Date(date.getFullYear(), select_month, 1);
        //  console.log(firstDay);
        // console.log(lastDay);
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var data = db.collection('attendance').find({
                date: { $gt: firstDay, $lte: lastDay },
                student_id: student_id
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

            var cursor = db.collection('attendance').aggregate([
                {
                    $match: {
                        'date': {
                            $gte: firstDay,
                            $lt: lastDay
                        },
                        student_id: student_id
                    }
                },
                {
                    "$lookup": {
                        "from": "students",
                        "localField": "student_id",
                        "foreignField": "student_id",
                        "as": "student_doc"
                    }
                },
                {
                    "$unwind": "$student_doc"
                },
                {
                    "$lookup": {
                        "from": "school_classes",
                        "localField": "class_id",
                        "foreignField": "class_id",
                        "as": "class_doc"
                    }
                },
                {
                    "$unwind": "$class_doc"
                },
                {
                    "$lookup": {
                        "from": "class_sections",
                        "localField": "section_id",
                        "foreignField": "section_id",
                        "as": "section_doc"
                    }
                },
                {
                    "$unwind": "$section_doc"
                },
                {
                    "$redact": {
                        "$cond": [{
                            "$eq": ["$student_id", student_id]
                        },
                            "$$KEEP",
                            "$$PRUNE"
                        ]
                    }
                },
                {
                    "$project": {
                        "_id": "$_id",
                        "student_id": "$student_id",
                        "first_name": "$student_doc.first_name",
                        "last_name": "$student_doc.last_name",
                        "status": "$status",
                        "gender": "$student_doc.gender",
                        "admission_no": "$student_doc.admission_no",
                        "roll_no": "$student_doc.roll_no",
                        "class_name": "$class_doc.name",
                        "section_name": "$section_doc.name",
                        "date": "$date",

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

router.route('/sec_attendence/:select_date/:class_id')
    .get(function (req, res, next) {
        var class_id = req.params.class_id;
        var splited = class_id.split("-");
        var school_id = splited[0] + '-' + splited[1];
        var resultArray = [];
        var select_date = new Date(req.params.select_date);
        var present = 0, absent = 0, onLeave = 0;
        var endDate = new Date(select_date);
        var count, dataCount;
        var classArray = [];
        var resultarray = attendenceSection = [];
        var attendenceClass = sectionArray = [];
        var className;
        endDate.setDate(endDate.getDate() + 1)
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var sections = db.collection('class_sections').find({ class_id });
            var data = db.collection('attendance').find({
                date: { $gte: new Date(select_date.toISOString()), $lt: new Date(endDate.toISOString()) },
                class_id: class_id
            });

            dataCount = data.count(function (e, triggerCount) {
                if (triggerCount > 0) {
                    count = triggerCount;
                    //  console.log(count);
                }
            });

            var cursor = db.collection('attendance').aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(select_date.toISOString()),
                            $lt: new Date(endDate.toISOString())
                        },
                        class_id: class_id

                    },
                },
                {
                    $lookup: {
                        from: "class_sections",
                        localField: "section_id",
                        foreignField: "section_id",
                        as: "section_doc"
                    }
                },
                {
                    $unwind: "$section_doc"
                },
                {
                    $group: {
                        _id: '$_id',
                        section_name: {
                            "$first": "$section_doc.name"
                        },
                        status: {
                            "$first": "$status"
                        },

                    }
                }
            ])

            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    sectionAttendence: resultArray,
                    // count: count,
                    // sections: sectionArray
                });
            });

        });
    });

module.exports = router;


