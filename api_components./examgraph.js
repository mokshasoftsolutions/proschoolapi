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
var forEach = require('async-foreach').forEach;
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

router.route('/examevaluation/:exam_paper_id')
    .get(function (req, res, next) {
        var exam_paper_id = req.params.exam_paper_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            //commented and replaced old code
            //    var cursor = db.collection('exam_evaluation').find({exam_paper_id:exam_paper_id });
            // var cursor = db.collection('exam_evaluation').aggregate([
            //             { "$lookup": { 
            //                 "from": "students", 
            //                 "localField": "student_id", 
            //                 "foreignField": "student_id", 
            //                 "as": "student_doc"
            //             }}, 
            //             { "$unwind": "$student_doc" },
            //             { "$redact": { 
            //                 "$cond": [
            //                     { "$eq": [ "$student_id", "$student_doc.student_id" ] }, 
            //                     "$$KEEP", 
            //                     "$$PRUNE"
            //                 ]
            //             }}, 
            //             { "$project": { 
            //                 "_id": "$_id",
            //                 "paper_result_id": "$paper_result_id",
            //                  "exam_paper_id": "$exam_paper_id", 
            //                 "student_id": "$student_id",
            //                 "marks": "$marks",
            //                 "comment": "$comment",
            //                 "date": "$date",
            //                 "status": "$status",
            //                 "student_name": "$student_doc.first_name", 
            //                 "roll_no": "$student_doc.roll_no" 

            //             }}
            //         ])

            var cursor = db.collection('exam_evaluation').aggregate([
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
                        "from": "exams",
                        "localField": "exam_paper_id",
                        "foreignField": "exam_paper_id",
                        "as": "exams_doc"
                    }
                },
                {
                    "$unwind": "$exams_doc"
                },
                {
                    "$redact": {
                        "$cond": [{
                            "$eq": ["$exam_paper_id", exam_paper_id]
                        },
                            "$$KEEP",
                            "$$PRUNE"
                        ]
                    }
                },
                {
                    "$project": {
                        "_id": "$_id",
                        "paper_result_id": "$paper_result_id",
                        "exam_paper_id": "$exam_paper_id",
                        "student_id": "$student_id",
                        "marks": "$marks",
                        "comment": "$comment",
                        "date": "$date",
                        "status": "$status",
                        "student_name": "$student_doc.first_name",
                        "roll_no": "$student_doc.roll_no",
                        "max_marks": "$exams_doc.max_marks",

                    }
                }
            ])

            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    barchart: resultArray
                });
            });
        });
    });



router.route('/examevaluationlistbystudentid/:exam_sch_id/:student_id')
    .get(function (req, res, next) {
        var exam_sch_id = req.params.exam_sch_id;
        var student_id = req.params.student_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);

            var cursor = db.collection('exam_schedule').aggregate([
                {
                    $match: {
                        exam_sch_id: exam_sch_id
                    }
                },
                {
                    $lookup: {
                        from: "exams",
                        localField: "exam_sch_id",
                        foreignField: "exam_sch_id",
                        as: "exams"
                    }
                },
                {
                    $unwind: "$exams"
                },
                {
                    $match: {
                        "exams.status": 1
                    }
                },

                {
                    $group: {
                        _id: '$_id',
                        exam_sch_id: {
                            "$first": "$exam_sch_id"
                        },
                        school_id: {
                            "$first": "$school_id"
                        },
                        exam_title: {
                            "$first": "$exam_title"
                        },
                        exam_classes: {
                            "$first": "$exam_classes"
                        },
                        from_date: {
                            "$first": "$from_date"
                        },
                        exams: {
                            $push: "$exams"
                        }
                    }
                },


            ]).toArray(function (err, results) {

                if (results.length > 0) {
                    if (results[0].exams.length > 0) {
                        var count = 0;
                        forEach(results[0].exams, function (key, value) {

                            key.exam_evaluation = [];
                            var examEvaluation = db.collection('exam_evaluation').aggregate([{
                                $match: {
                                    exam_paper_id: key.exam_paper_id,
                                    student_id: student_id,
                                    status: 1
                                }
                            }])
                            examEvaluation.forEach(function (data, err) {

                                key.exam_evaluation.push(data);
                                count++;

                            }, function () {
                                if (count === results[0].exams.length) {
                                    db.close();
                                    res.send({
                                        barchart: results
                                    });
                                }
                            });

                        })
                    } else {
                        db.close();
                        res.send({
                            barchart: results
                        });

                    }
                } else {
                    db.close();
                    res.send({
                        barchart: results
                    });

                }

            })

        });
    });

 module.exports = router;
// var data = collection.find({
//     stations: { $elemMatch: { station_name: station_name } } 
