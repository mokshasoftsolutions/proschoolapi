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
                        //   console.log("getSchoolClassed");
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
                        //   console.log("getSectionsData");                      
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

                                    //  console.log(classResultLength+'=='+count);

                                    if (classResultLength == count) {
                                        //   console.log(JSON.stringify(classResult));
                                        next(null, classResult);
                                        // next(null, classData);
                                    }

                                })
                            })
                        }
                    },
                    function getTotalSchoolAttendance(result, next) {
                        //   console.log("getTotalSchoolAttendance");
                        // console.log(result);                        
                        var data = db.collection('attendance').find({
                            date: { $gte: new Date(select_date.toISOString()), $lt: new Date(endDate.toISOString()) },
                            school_id: school_id
                        }).toArray(function (err, attResult) {
                            if (err) {
                                next(err, null);
                            }
                            // console.log("total attenance result")
                            // console.log(attResult);
                            next(null, result, attResult);
                        });
                    }, function getAttendanceData(result, attResult, next) {
                        // console.log("getAttendanceData");
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
                                var classesData = classData;

                                var sectionDataLength = classData.sections.length;
                                var class_id = classData.class_id;
                                var className = classData.name;
                                if (sectionDataLength == 0) {
                                    count++;
                                    // console.log("count 0")
                                } else {

                                    var classes = classData.sections;
                                    // console.log(typeof (classes));
                                    var classesLength = classes.length;
                                    // console.log(classesLength);
                                    attendenceSection = [];
                                    sectionAttendence = [];
                                    for (var i = 0; i <= classesLength; i++) {
                                        preAtt = {};
                                        attendenceSection = [];
                                        if (classes[i] != undefined) {
                                            classSections.push(classes[i]);
                                            if (classSections[i] != undefined) {
                                                var sectionId = classSections[i].section_id;
                                                var sectionName = classSections[i].name;

                                                var attLength = attResult.length;
                                                var present = absent = onLeave = percent = 0;
                                                var prePercent = abPercent = onPercent = 0;
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
                                                percent = present + absent + onLeave;
                                                prePercent = (100 * present) / percent;
                                                prePercent = Math.round(prePercent);
                                                abPercent = (100 * absent) / percent;
                                                abPercent = Math.round(abPercent);
                                                onPercent = (100 * onLeave) / percent;
                                                onPercent = Math.round(onPercent);
                                              //  console.log(prePercent);
                                                preAtt.present = present;
                                                preAtt.absent = absent;
                                                preAtt.onLeave = onLeave;
                                                preAtt.presentPercent = prePercent+"%";
                                                preAtt.absentPercent = abPercent+"%";
                                                preAtt.onLeavePercent = onPercent+"%";
                                            }

                                            attendenceSection.push({ "sectionName": sectionName, "sectionId": sectionId, "attendance": preAtt });

                                            sectionAttendence.push(attendenceSection);

                                        }
                                    }
                                    count++;
                                }

                                attendenceClass.push({ "classId": class_id, "className": className, "sections": sectionAttendence });

                                //  attendenceClass.push({"sections":sectionAttendence});

                                classAttendence.push(attendenceClass);

                                if (classDataLength == count) {
                                    next(null, classAttendence);
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
                            students: result1
                        });

                    }
                }
            );


        });
    });


module.exports = router;

