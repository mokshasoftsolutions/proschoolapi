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

router.route('/sec_attendence_b/:select_date/:class_id')
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
        var resultarray = [];
        var attendenceClass = [];
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

            sections.forEach(function (sec, err) {
                console.log("sections" + sec.section_id);
                if (sec.class_id == class_id) {
                    console.log("classSection");
                    present = absent = onLeave = 0;
                    data.forEach(function (doc, err) {
                        console.log("data");
                        if (sec.section_id == doc.section_id) {
                            if (doc.status == "Present") {
                                present += 1;
                                console.log("babu" + present);
                            }
                            else if (doc.status == "Absent") {
                                absent += 1;
                                console.log("babu1" + absent);
                            }
                            else if (doc.status == "On Leave") {
                                onLeave += 1;
                                console.log("babu2" + onLeave);
                            }
                        }
                    });
                    sectionName = sec.name;
                    attendenceSection.push(sectionName);
                    attendenceSection.push(present);
                    attendenceSection.push(absent);
                    attendenceSection.push(onLeave);

                    sectionArray.push(attendenceSection);
                }
            })

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
                        // class_name:{
                        //     "$first":"$name"
                        // }

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
                    count: count,
                    sections: sectionArray
                });
            });

        });
    });


router.route('/all_cses_att_date_testing/:select_date/:school_id')
    .get(function (req, res, next) {
        var resultArray = [];
        var school_id = req.params.school_id;
        var select_date = new Date(req.params.select_date);
        var present = 0, absent = 0, onLeave = 0;
        var endDate = new Date(select_date);
        var count, dataCount;
        var sectionArray = [];
        var preAtt = {};
        var attendanceArray = [];
        var Attendence = [];
        var classArray = [];
        var classSections = [];
        var classes = [];
        var sectionAttendence = classAttendence = [];
        var resultarray = [];
        var attendenceSection = [];
        var attendenceClass = [];
        var sectionName, className;
        endDate.setDate(endDate.getDate() + 1)


        mongo.connect(url, function (err, db) {

            async.waterfall(
                [
                    function getSchoolClassed(next) {
                        //  console.log("In First Step is classes");
                        db.collection('school_classes').find({
                            school_id
                        }).toArray(function (err, result) {
                            if (err) {
                                next(err, null);
                            }
                            next(null, result);
                        });
                    },
                    function getSectionsData(result, next) {

                        // classes.push(result);
                        // console.log(result +" I'm the god");
                        var count = 0;
                        var classResult = result;
                        var classResultLength = result.length;
                        if (classResultLength == 0) {
                            next(null, []);
                        } else {
                            //  console.log("In Second step sections")
                            classResult.forEach(function (classData) {
                                var class_id = classData.class_id;
                                // console.log(class_id);
                                db.collection('class_sections').find({
                                    class_id
                                }).toArray(function (err, results) {
                                    count++;
                                    if (err) {
                                        next(err, null);
                                    }
                                    classData.sections = results
                                    // console.log(classData.sections);

                                    if (classResultLength == count) {
                                        next(null, classResult);
                                        // next(null, classData);
                                    }


                                })
                            })
                        }
                    },
                    function getTotalSchoolAttendance(result, next) {
                        // console.log(result);
                        //  console.log("In third Step is attendence");
                        var data = db.collection('attendance').find({
                            date: { $gte: new Date(select_date.toISOString()), $lt: new Date(endDate.toISOString()) },
                            school_id: school_id
                        }).toArray(function (err, attResult) {
                            if (err) {
                                next(err, null);
                            }
                            next(null, result, attResult);
                        });
                    }, function getAttendanceData(result, attResult, next) {
                        //  console.log(attResult);
                        //  console.log(result);
                        var count = 0;

                        var classResult = result;
                        var classDataLength = result.length;
                        //  console.log(classData.sections);
                        if (classDataLength == 0) {
                            next(null, []);
                        } else {
                            // console.log("In fourth step sections attendance")
                            classResult.forEach(function (classData) {
                                classSections = [];
                                attendenceClass = [];

                                var sectionCount = 0;
                                // var classData=classData.sections;
                                //    console.log(classData.sections);

                                // console.log(attResult);
                                //   console.log(result);
                                var classesData = classData;
                                // console.log(classData);
                                //console.log(classesData);

                                var sectionDataLength = classData.sections.length;
                                var class_id = classData.class_id;
                                var className = classData.name;
                                if (sectionDataLength == 0) {
                                    count++;
                                    console.log("count 0")
                                } else {
                                    //  console.log(classesData);
                                    //    var className = classesData.name;
                                    //  console.log(className);
                                    var classes = classData.sections;
                                    // console.log(typeof (classes));
                                    var classesLength = classes.length;
                                    // console.log(classesLength);
                                    attendenceSection = [];
                                    sectionAttendence = [];
                                    for (var i = 0; i <= classesLength; i++) {
                                        preAtt = [];
                                        attendenceSection = [];
                                        if (classes[i] != undefined) {
                                            classSections.push(classes[i]);
                                            if (classSections[i] != undefined) {
                                                var sectionId = classSections[i].section_id;
                                                var sectionName = classSections[i].name;
                                                // console.log(sectionId);
                                                //  console.log(sectionName);
                                                //   console.log(typeof(attResult));
                                                // console.log(attResult[0]);
                                                var attLength = attResult.length;
                                                var present = absent = onLeave = 0;
                                                for (var k = 0; k <= attLength; k++) {
                                                    attendanceArray.push(attResult[k]);
                                                    if (attendanceArray[k] != undefined) {
                                                        attSectionId = attendanceArray[k].section_id;
                                                        //  console.log(attSectionId);
                                                        if (sectionId == attSectionId) {
                                                            var status = attendanceArray[k].status;
                                                            //  console.log(status);
                                                            if (status == "Present") {
                                                                present += 1;
                                                            }
                                                            else if (status == "Absent") {
                                                                absent += 1;
                                                            }
                                                            else if (status == "On Leave") {
                                                                onLeave += 1;
                                                            }
                                                        }
                                                    }
                                                }
                                                // console.log(present + "" + absent + "" + onLeave);
                                                preAtt.present = present;
                                                preAtt.absent = absent;
                                                preAtt.onLeave = onLeave;
                                                // console.log(preAtt);
                                                // preAtt.push(present);
                                                // preAtt.push(absent);
                                                // preAtt.push(onLeave);
                                            }
                                            attendenceSection.push(sectionName);
                                            attendenceSection.push(preAtt);

                                            //  console.log(attendenceSection);
                                            sectionAttendence.push(attendenceSection);
                                            //  console.log(sectionAttendence);
                                        }
                                        //  console.log(sectionAttendence);
                                    }
                                }
                                if (classDataLength == count) {
                                    next(null, classResult);
                                }
                                // console.log(sectionAttendence);
                                attendenceClass.push(className);
                                attendenceClass.push(sectionAttendence);
                             //   console.log(attendenceClass[1]);
                                 classAttendence.push(attendenceClass);
                                //console.log(classAttendence);
                               
                            }, function () {
                                // Attendence.push(classAttendence);
                                //  console.log("hemababu");
                                //db.close();
                                // res.send({
                                //     Attendence: "hema"
                                // });
                            });
                        }
                    }
                ],
                function (err, result1) {
                    console.log("testing");
                    //console.log(classAttendence+"hemababu");
                    db.close();
                    //    console.log(result1);
                    if (err) {
                        res.send({
                            error: err
                        });

                    } else {

                        res.send({
                            students: classAttendence
                        });

                    }
                }
             );


        });
    });


module.exports = router;