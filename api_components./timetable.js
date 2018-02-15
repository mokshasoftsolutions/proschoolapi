// flow
var express = require("express");
var config = require("../config.json");
var bodyParser = require("body-parser");
var api_key = "api-key-KJFSI4924R23RFSDFSD7F94";
var mongo = require('mongodb').MongoClient;
var autoIncrement = require("mongodb-autoincrement");
var assert = require('assert');
var forEach = require('async-foreach').forEach;
var async = require('async');
var waterfall = require('async-waterfall');
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

router.route('/class_timetable/:section_id/:subject_id')
    .post(function (req, res, next) {
        var status = 1;
        var section_id = req.params.section_id;
        var splited = section_id.split("-");
        var school_id = splited[0] + '-' + splited[1];
        var class_id = splited[0] + '-' + splited[1] + '-' + splited[2] + '-' + splited[3];
        var subject_id = req.params.subject_id;
        var Day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thrusday', 'friday', 'saturday'];
        var day = req.body.day;
        var date = new Date();
        day = Day[day - 1];


        var item = {
            timetable_id: 'getauto',
            section_id: section_id,
            day: day,
            start_time: req.body.start_time,
            end_time: req.body.end_time,
            class_id: class_id,
            school_id: school_id,
            room_no: req.body.room_no,
            teacher_id: req.body.teacher_id,
            subject_id: subject_id,
            date: date,
            status: status,
        }
        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'timetable', function (err, autoIndex) {
                var collection = db.collection('timetable');
                collection.ensureIndex({
                    "timetable_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.subject_id == null) {
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
                                            timetable_id: section_id + '-TTBL-' + autoIndex
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
router.route('/class_timetable/:subject_id')
    .get(function (req, res, next) {
        var resultArray = [];
        //var section_id = req.params.section_id;
        var subject_id = req.params.subject_id;

        mongo.connect(url, function (err, db) {
            assert.equal(null, err);

            var cursor = db.collection('timetable').aggregate([
                {
                    $match: {
                        subject_id: subject_id,
                    }
                },
                {
                    "$lookup": {
                        "from": "subjects",
                        "localField": "subject_id",
                        "foreignField": "subject_id",
                        "as": "subject_doc"
                    }
                },
                { "$unwind": "$subject_doc" },
                // {
                //     "$redact": {
                //         "$cond": [
                //             { "$eq": [subject_id, "$subject_doc.subject_id"] },
                //             "$$KEEP",
                //             "$$PRUNE"
                //         ]
                //     }
                // },
                {
                    "$project": {
                        "_id": "$_id",
                        "timetable_id": "$timetable_id",
                        "section_id": "$section_id",
                        "day": "$day",
                        "start_time": "$start_time",
                        "end_time": "$end_time",
                        "room_no": "$room_no",
                        "subject_id": "$subject_id",
                        "name": "$subject_doc.name",


                    }
                }
            ])
            // var cursor = db.collection('timetable').find({section_id});
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    timetable: resultArray
                });
            });
        });
    });

router.route('/class_timetables/:section_id')
    .get(function (req, res, next) {
        var resultArray = [];
        //var section_id = req.params.section_id;
        var section_id = req.params.section_id;

        mongo.connect(url, function (err, db) {
            assert.equal(null, err);

            var cursor = db.collection('timetable').aggregate([
                {
                    $match: {
                        section_id: section_id,
                    }
                },
                {
                    "$lookup": {
                        "from": "subjects",
                        "localField": "subject_id",
                        "foreignField": "subject_id",
                        "as": "subject_doc"
                    }
                },
                { "$unwind": "$subject_doc" },
                {
                    "$lookup": {
                        "from": "teachers",
                        "localField": "teacher_id",
                        "foreignField": "teacher_id",
                        "as": "teacher_doc"
                    }
                },
                { "$unwind": "$teacher_doc" },
                {
                    "$project": {
                        "_id": "$_id",
                        "timetable_id": "$timetable_id",
                        "teacher_name": "$teacher_doc.teacher_name",
                        "section_id": "$section_id",
                        "day": "$day",
                        "start_time": "$start_time",
                        "end_time": "$end_time",
                        "room_no": "$room_no",
                        "subject_id": "$subject_id",
                        "name": "$subject_doc.name",
                    }
                }
            ])
            // var cursor = db.collection('timetable').find({section_id});
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    timetable: resultArray
                });
            });
        });
    });

router.route('/classes_timetable_by_day/:select_day/:class_id')
    .get(function (req, res, next) {
        var resultArray = [];
        var class_id = req.params.class_id;
        var Day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thrusday', 'friday', 'saturday'];
        var day = req.params.select_day;
        day = Day[day - 1];

        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('timetable').aggregate([
                {
                    $match: {
                        day: day,
                        class_id: class_id,
                    }
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
                    $lookup: {
                        from: "school_classes",
                        localField: "class_id",
                        foreignField: "class_id",
                        as: "class_doc"
                    }
                },
                {
                    $unwind: "$class_doc"
                },
                {
                    $lookup: {
                        from: "subjects",
                        localField: "subject_id",
                        foreignField: "subject_id",
                        as: "subject_doc"
                    }
                },
                {
                    $unwind: "$subject_doc"
                },
                {
                    $group: {
                        _id: '$_id',
                        class_name: {
                            "$first": "$class_doc.name"
                        },
                        section_name: {
                            "$first": "$section_doc.name"
                        },
                        section_id: {
                            "$first": "$section_doc.section_id"
                        },
                        section_id: {
                            "$first": "$section_doc.section_id"
                        },
                        class_id: {
                            "$first": "$class_doc.class_id"
                        },
                        day: {
                            "$first": "$day"
                        },
                        subject_name: {
                            "$first": "$subject_doc.name"
                        },
                        start_time: {
                            "$first": "$start_time"
                        }
                    }
                },
            ])


            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    timetable: resultArray
                });
            });
        });
    });


router.route('/day_timetable_by_classId/:select_day/:class_id')
    .get(function (req, res, next) {
        var resultArray = [];
        var class_id = req.params.class_id;
        var splited = class_id.split("-");
        var school_id = splited[0] + '-' + splited[1];
        var Day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thrusday', 'friday', 'saturday'];
        var day = req.params.select_day;
        day = Day[day - 1];
        var sectionTimetable = sessionTimings = [];

        mongo.connect(url, function (err, db) {

            async.waterfall(
                [
                    function getClassSections(next) {
                        //   console.log("getSchoolClassed");
                        db.collection('class_sections').find({
                            class_id
                        }).toArray(function (err, result) {
                            if (err) {
                                next(err, null);
                            }
                            next(null, result);
                        });
                    },
                    function getSectionsData(result, next) {
                        //   console.log("getSectionsData");                      
                        var count = 0;
                        var sectionResult = result;
                        var sectionResultLength = result.length;
                        if (sectionResultLength == 0) {
                            next(null, []);
                        } else {
                            //  console.log("In Second step sections")
                            sectionResult.forEach(function (sectionData) {
                                var section_id = sectionData.section_id;
                                // console.log(class_id);
                                db.collection('timetable').aggregate([
                                    {
                                        $match: {
                                            day: day,
                                            section_id: section_id,
                                        }
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
                                    // {
                                    //     $lookup: {
                                    //         from: "school_classes",
                                    //         localField: "class_id",
                                    //         foreignField: "class_id",
                                    //         as: "class_doc"
                                    //     }
                                    // },
                                    // {
                                    //     $unwind: "$class_doc"
                                    // },
                                    {
                                        $lookup: {
                                            from: "subjects",
                                            localField: "subject_id",
                                            foreignField: "subject_id",
                                            as: "subject_doc"
                                        }
                                    },
                                    {
                                        $unwind: "$subject_doc"
                                    },
                                    {
                                        $group: {
                                            _id: '$_id',
                                            // class_name: {
                                            //     "$first": "$class_doc.name"
                                            // },
                                            section_name: {
                                                "$first": "$section_doc.name"
                                            },
                                            // section_id: {
                                            //     "$first": "$section_doc.section_id"
                                            // },
                                            section_id: {
                                                "$first": "$section_doc.section_id"
                                            },
                                            // class_id: {
                                            //     "$first": "$class_doc.class_id"
                                            // },
                                            day: {
                                                "$first": "$day"
                                            },
                                            subject_name: {
                                                "$first": "$subject_doc.name"
                                            },
                                            start_time: {
                                                "$first": "$start_time"
                                            },
                                            end_time: {
                                                "$first": "$end_time"
                                            }
                                        }
                                    },
                                ]).toArray(function (err, results) {
                                    count++;
                                    if (err) {
                                        next(err, null);
                                    }
                                    sectionData.timetable = results

                                    if (sectionResultLength == count) {

                                        next(null, sectionResult);
                                        // next(null, classData);
                                    }

                                })
                            })
                        }
                    },
                    function getsessionTimings(result, next) {
                        //   console.log("getTotalSchoolAttendance");
                        // console.log(result);                        
                        var data = db.collection('session_timings').find({
                            school_id: school_id
                        }).sort({ start_time: 1 }).toArray(function (err, sessionResult) {
                            if (err) {
                                next(err, null);
                            }
                            next(null, result, sessionResult);
                        });
                    }, function getAttendanceData(result, sessionResult, next) {

                        //  console.log(sessionResult);
                        var count = 0;
                        sessionTimings = sessionResult;
                        var sectionResult = result;
                        var sectionDataLength = result.length;
                        //  console.log(classData.sections);
                        if (sectionDataLength == 0) {
                            next(null, []);
                        } else {

                            sectionResult.forEach(function (sectionData) {

                                // attendenceClass = [];

                                var sectionCount = 0;
                                var sectionsData = sectionData;
                                var timetableData = [];
                                var timetableDataLength = sectionData.timetable.length;
                                var section_id = sectionData.section_id;
                                //console.log(section_id);
                                //   console.log(sectionData.timetable);
                                var sectionName = sectionData.name;


                                var timetable = sectionData.timetable;
                                // console.log(timetable);
                                var timetableLength = timetable.length;



                                for (j = 0; j < sessionTimings.length; j++) {
                                    var startTime = endTime = subject = "";

                                    for (i = 0; i < timetableLength; i++) {

                                        if (sessionTimings[j].start_time == timetable[i].start_time) {

                                            startTime = timetable[i].start_time;
                                            endTime = timetable[i].end_time;
                                            subject = timetable[i].subject_name;

                                        }

                                    }
                                    if (subject == "") {
                                        startTime = sessionTimings[j].start_time;
                                        endTime = sessionTimings[j].end_time;
                                        subject = "";
                                    }
                                    
                                    timetableData.push({ start_time: startTime, end_time: endTime, subject: subject })
                                }

                                count++;


                                sectionTimetable.push({ sectionName: sectionName, timetableData })

                                if (sectionDataLength == count) {
                                    next(null, sectionTimetable);
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
                            timetable: result1
                        });

                    }
                }
            );
        });
    });


router.route('/class_timetable_by_day/:select_day/:section_id')
    .get(function (req, res, next) {
        var resultArray = [];
        var section_id = req.params.section_id;
        var Day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thrusday', 'friday', 'saturday'];
        var day = req.params.select_day;
        day = Day[day - 1];

        mongo.connect(url, function (err, db) {
            assert.equal(null, err);

            var cursor = db.collection('timetable').aggregate([
                {
                    $match: {
                        day: day,
                        section_id: section_id
                    }
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
                    $lookup: {
                        from: "school_classes",
                        localField: "class_id",
                        foreignField: "class_id",
                        as: "class_doc"
                    }
                },
                {
                    $unwind: "$class_doc"
                },
                {
                    $lookup: {
                        from: "subjects",
                        localField: "subject_id",
                        foreignField: "subject_id",
                        as: "subject_doc"
                    }
                },
                {
                    $unwind: "$subject_doc"
                },
                {
                    $group: {
                        _id: '$_id',
                        class_name: {
                            "$first": "$class_doc.name"
                        },
                        section_name: {
                            "$first": "$section_doc.name"
                        },
                        day: {
                            "$first": "$day"
                        },
                        subject_name: {
                            "$first": "$subject_doc.name"
                        },
                        start_time: {
                            "$first": "$start_time"
                        }
                    }
                },
            ])


            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    timetable: resultArray
                });
            });
        });
    });


router.route('/teacher_timetable_by_day/:select_day/:teacher_id')
    .get(function (req, res, next) {
        var resultArray = [];
        var teacher_id = req.params.teacher_id;
        var Day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thrusday', 'friday', 'saturday'];
        var day = req.params.select_day;
        day = Day[day - 1];

        mongo.connect(url, function (err, db) {
            assert.equal(null, err);

            var cursor = db.collection('timetable').aggregate([
                {
                    $match: {
                        day: day,
                        teacher_id: teacher_id
                    }
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
                    $lookup: {
                        from: "school_classes",
                        localField: "class_id",
                        foreignField: "class_id",
                        as: "class_doc"
                    }
                },
                {
                    $unwind: "$class_doc"
                },
                {
                    $lookup: {
                        from: "subjects",
                        localField: "subject_id",
                        foreignField: "subject_id",
                        as: "subject_doc"
                    }
                },
                {
                    $unwind: "$subject_doc"
                },
                {
                    $lookup: {
                        from: "teachers",
                        localField: "teacher_id",
                        foreignField: "teacher_id",
                        as: "teacher_doc"
                    }
                },
                {
                    $unwind: "$teacher_doc"
                },
                {
                    $group: {
                        _id: '$_id',
                        class_name: {
                            "$first": "$class_doc.name"
                        },
                        teacher_name: {
                            "$first": "$teacher_doc.teacher_name"
                        },
                        section_name: {
                            "$first": "$section_doc.name"
                        },
                        day: {
                            "$first": "$day"
                        },
                        subject_name: {
                            "$first": "$subject_doc.name"
                        },
                        start_time: {
                            "$first": "$start_time"
                        }
                    }
                },
            ])


            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    timetable: resultArray
                });
            });
        });
    });



module.exports = router;