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
                                }).sort({ name: 1 }).toArray(function (err, results) {
                                    count++;
                                    if (err) {
                                        next(err, null);
                                    }
                                    classData.sections = results

                                    if (classResultLength == count) {

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
                                                // prePercent = Math.round(prePercent);
                                                abPercent = (100 * absent) / percent;
                                                // abPercent = Math.round(abPercent);
                                                onPercent = (100 * onLeave) / percent;
                                                // onPercent = Math.round(onPercent);
                                                //  console.log(prePercent);
                                                preAtt.present = present;
                                                preAtt.absent = absent;
                                                preAtt.onLeave = onLeave;
                                                preAtt.presentPercent = prePercent + "%";
                                                preAtt.absentPercent = abPercent + "%";
                                                preAtt.onLeavePercent = onPercent + "%";
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

router.route('/student_tillDate_attendence/:student_id')
    .get(function (req, res, next) {
        var student_id = req.params.student_id;
        var resultArray = [];
        var present = 0, absent = 0, onLeave = 0;
        var resultMonth, AttendenceMonth;
        var studentAttendence = [];

        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('attendance').aggregate([
                {
                    $match: {
                        student_id: student_id
                    },
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
                        from: "students",
                        localField: "student_id",
                        foreignField: "student_id",
                        as: "student_doc"
                    }
                },
                {
                    $unwind: "$student_doc"
                },
                {
                    $project:
                        {
                            Name: "$student_doc.first_name",
                            className: "$class_doc.name",
                            sectionName: "$section_doc.name",
                            status: "$status",
                            month: { $month: "$date" },
                            date: "$date"
                        }
                }
            ])

            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                monthArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
                monthString = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
                // console.log(attendanceArray[0]);
                for (i = 0; i < monthArray.length; i++) {
                    monthValue = monthArray[i];
                    monthName = monthString[i];
                    // console.log(resultMonth);
                    present = absent = onLeave = 0;
                    monthAttendence = {};
                    for (j = 0; j < resultArray.length; j++) {

                        if (monthValue == resultArray[j].month) {
                            // console.log("hema");
                            if (resultArray[j].status == "Present") {
                                present += 1;
                            }
                            else if (resultArray[j].status == "Absent") {
                                absent += 1;
                            }
                            else if (resultArray[j].status == "On Leave") {
                                onLeave += 1;
                            }
                        }

                    }
                    percent = present + absent + onLeave;
                    prePercent = (100 * present) / percent;
                    // prePercent = Math.round(prePercent);
                    abPercent = (100 * absent) / percent;
                    // abPercent = Math.round(abPercent);
                    onPercent = (100 * onLeave) / percent;
                    // onPercent = Math.round(onPercent);
                    monthAttendence.present = present;
                    monthAttendence.absent = absent;
                    monthAttendence.onLeave = onLeave;
                    // console.log(monthAttendence);
                    monthAttendence.presentPercent = prePercent + "%";
                    monthAttendence.absentPercent = abPercent + "%";
                    monthAttendence.onLeavePercent = onPercent + "%";
                    studentAttendence.push({ "monthName": monthName, "month": monthValue, "count": percent, "attendance": monthAttendence })
                }
                db.close();
                res.send({
                    studentAttendence: studentAttendence
                });
            });
        });
    });


router.route('/presentDay_student_attendence/:select_date/:student_id')
    .get(function (req, res, next) {
        var student_id = req.params.student_id;
        var resultArray = [];
        var resultArray1 = [];
        var select_date = new Date(req.params.select_date);
        var endDate = new Date(select_date);
        var cursor;
        endDate.setDate(endDate.getDate() + 1)
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var data = db.collection('attendance').find({
                date: { $gte: new Date(select_date.toISOString()), $lt: new Date(endDate.toISOString()) },
                student_id: student_id
            });
            data.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                // console.log(resultArray);

                if (resultArray == "") {
                    //  console.log("rfgweqrg");
                    cursor = db.collection('students').aggregate([
                        {
                            $match: {
                                student_id: student_id
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
                            $group: {
                                _id: '$_id',
                                section_name: {
                                    "$first": "$section_doc.name"
                                },
                                status: {
                                    "$first": "Attendence not taken Yet"
                                },
                                student_name: {
                                    "$first": "$first_name"
                                },
                                Admission_no: {
                                    "$first": "$admission_no"
                                },
                                roll_no: {
                                    "$first": "$roll_no"
                                },
                                studentImage: {
                                    "$first": "$studentImage"
                                },

                            }
                        }
                    ])


                }
                else if (resultArray != "") {
                    //  console.log("");
                    cursor = db.collection('attendance').aggregate([
                        {
                            $match: {
                                date: {
                                    $gte: new Date(select_date.toISOString()),
                                    $lt: new Date(endDate.toISOString())
                                },
                                student_id: student_id
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
                            $lookup: {
                                from: "students",
                                localField: "student_id",
                                foreignField: "student_id",
                                as: "student_doc"
                            }
                        },
                        {
                            $unwind: "$student_doc"
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
                                student_name: {
                                    "$first": "$student_doc.first_name"
                                },
                                Admission_no: {
                                    "$first": "$student_doc.admission_no"
                                },
                                roll_no: {
                                    "$first": "$student_doc.roll_no"
                                },
                                studentImage: {
                                    "$first": "$student_doc.studentImage"
                                },

                            }
                        }
                    ])
                }
                cursor.forEach(function (doc, err) {
                    assert.equal(null, err);
                    resultArray1.push(doc);
                }, function () {
                    db.close();
                    res.send({
                        studentAttendence: resultArray1,

                    });
                });
            })
        });
    });

router.route('/employee_tillDate_attendence/:employee_id')
    .get(function (req, res, next) {
        var employee_id = req.params.employee_id;
        var resultArray = [];
        var present = 0, absent = 0, onLeave = 0;
        var resultMonth, AttendenceMonth;
        var employeeAttendence = [];

        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('employee_attendance').aggregate([
                {
                    $match: {
                        employee_id: employee_id
                    },
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
                    $unwind: "$employee_doc"
                },
                {
                    $project:
                        {
                            Name: "$employee_doc.first_name",
                            status: "$status",
                            month: { $month: "$date" },
                            date: "$date"
                        }
                }
            ])

            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                monthArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
                monthString = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
                // console.log(attendanceArray[0]);
                for (i = 0; i < monthArray.length; i++) {
                    monthValue = monthArray[i];
                    monthName = monthString[i];
                    // console.log(resultMonth);
                    present = absent = onLeave = 0;
                    monthAttendence = {};
                    for (j = 0; j < resultArray.length; j++) {

                        if (monthValue == resultArray[j].month) {
                            // console.log("hema");
                            if (resultArray[j].status == "Present") {
                                present += 1;
                            }
                            else if (resultArray[j].status == "Absent") {
                                absent += 1;
                            }
                            else if (resultArray[j].status == "On Leave") {
                                onLeave += 1;
                            }
                        }

                    }
                    percent = present + absent + onLeave;
                    prePercent = (100 * present) / percent;
                    // prePercent = Math.round(prePercent);
                    abPercent = (100 * absent) / percent;
                    // abPercent = Math.round(abPercent);
                    onPercent = (100 * onLeave) / percent;
                    // onPercent = Math.round(onPercent);
                    monthAttendence.present = present;
                    monthAttendence.absent = absent;
                    monthAttendence.onLeave = onLeave;
                    // console.log(monthAttendence);
                    monthAttendence.presentPercent = prePercent + "%";
                    monthAttendence.absentPercent = abPercent + "%";
                    monthAttendence.onLeavePercent = onPercent + "%";
                    employeeAttendence.push({ "monthName": monthName, "month": monthValue, "count": percent, "attendance": monthAttendence })
                }
                db.close();
                res.send({
                    employeeAttendence: employeeAttendence
                });
            });
        });
    });

router.route('/presentDay_employee_attendence/:select_date/:employee_id')
    .get(function (req, res, next) {
        var employee_id = req.params.employee_id;
        var resultArray = [];
        var resultArray1 = [];
        var select_date = new Date(req.params.select_date);
        var endDate = new Date(select_date);
        var cursor;
        endDate.setDate(endDate.getDate() + 1)
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var data = db.collection('employee_attendance').find({
                date: { $gte: new Date(select_date.toISOString()), $lt: new Date(endDate.toISOString()) },
                employee_id: employee_id
            });
            data.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                // console.log(resultArray);

                if (resultArray == "") {
                    //  console.log("rfgweqrg");
                    cursor = db.collection('employee').aggregate([
                        {
                            $match: {
                                employee_id: employee_id
                            }
                        },
                        {
                            $group: {
                                _id: '$_id',
                                status: {
                                    "$first": "Attendence not taken Yet"
                                },
                                employee_name: {
                                    "$first": "$first_name"
                                },
                                employeeImage: {
                                    "$first": "$employeeImage"
                                },

                            }
                        }
                    ])

                }
                else if (resultArray != "") {
                    //  console.log("");
                    cursor = db.collection('employee_attendance').aggregate([
                        {
                            $match: {
                                date: {
                                    $gte: new Date(select_date.toISOString()),
                                    $lt: new Date(endDate.toISOString())
                                },
                                employee_id: employee_id
                            },
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
                            $unwind: "$employee_doc"
                        },
                        {
                            $group: {
                                _id: '$_id',
                                status: {
                                    "$first": "$status"
                                },
                                employee_name: {
                                    "$first": "$employee_doc.first_name"
                                },
                                employeeImage: {
                                    "$first": "$employee_doc.employeeImage"
                                },

                            }
                        }
                    ])
                }
                cursor.forEach(function (doc, err) {
                    assert.equal(null, err);
                    resultArray1.push(doc);
                }, function () {
                    db.close();
                    res.send({
                        employeeAttendence: resultArray1,

                    });
                });
            })
        });
    });

router.route('/section_monthly_attendence/:select_month/:section_id')
    .get(function (req, res, next) {
        var resultArray = [];
        var section_id = req.params.section_id;
        var monthValue = req.params.select_month;
        var studentAttendenceReport = [];
        var attendanceReport = [];
        var totalPercent = totalPresent = totalAbsent = totalOnLeave = 0;
        // console.log(monthValue);


        mongo.connect(url, function (err, db) {

            async.waterfall(
                [
                    function getStudents(next) {
                        //   console.log("getSubjects");
                        db.collection('students').find({
                            section_id
                        }).toArray(function (err, result) {
                            if (err) {
                                next(err, null);
                            }
                            next(null, result);
                        });
                    },
                    function getstudentsData(result, next) {
                        //   console.log("getChaptersData");                      
                        var count = 0;
                        var studentResult = result;
                        var studentResultLength = result.length;
                        if (studentResultLength == 0) {
                            next(null, []);
                        } else {
                            //  console.log("In Second step sections")
                            studentResult.forEach(function (studentData) {
                                var student_id = studentData.student_id;
                                monthValue = parseInt(monthValue);
                                db.collection('attendance').aggregate([
                                    {
                                        $match: {
                                            student_id: student_id
                                        },
                                    },
                                    {
                                        "$redact": {
                                            "$cond": [
                                                { "$eq": [{ "$month": "$date" }, monthValue] },
                                                "$$KEEP",
                                                "$$PRUNE"
                                            ]
                                        }
                                    }
                                ]).toArray(function (err, results) {
                                    count++;
                                    if (err) {
                                        next(err, null);
                                    }
                                    studentData.attendance = results
                                    //  console.log(studentData.attendance);

                                    if (studentResultLength == count) {
                                        next(null, studentResult);
                                    }

                                })
                            })
                        }
                    }, function getAttendenceTopicsData(result, next) {
                        //  console.log(result);
                        var count = 0;
                        var studentResult = result;
                        var studentDataLength = result.length;
                        //  console.log(classData.sections);
                        if (studentDataLength == 0) {
                            next(null, []);
                        } else {
                            // console.log("In fourth step sections attendance")
                            studentResult.forEach(function (studentData) {
                                studentAttendence = [];
                                // attendenceClass = [];

                                var attendenceCount = 0;
                                var studentName = studentData.first_name;
                                var studentId = studentData.student_id;

                                studentAttendence = studentData.attendance;
                                //  console.log(student_id);
                                //   console.log(studentData.attendance);
                                present = absent = onLeave = 0;
                                monthAttendence = {};
                                for (i = 0; i < studentAttendence.length; i++) {

                                    if (studentAttendence[i].status == "Present") {
                                        present += 1;
                                    }
                                    else if (studentAttendence[i].status == "Absent") {
                                        absent += 1;
                                    }
                                    else if (studentAttendence[i].status == "On Leave") {
                                        onLeave += 1;
                                    }
                                }
                                percent = present + absent + onLeave;
                                totalPercent += percent;
                                totalPresent += present;
                                totalAbsent += absent;
                                totalOnLeave += onLeave;
                                prePercent = (100 * present) / percent;
                                // prePercent = Math.round(prePercent);
                                abPercent = (100 * absent) / percent;
                                // abPercent = Math.round(abPercent);
                                onPercent = (100 * onLeave) / percent;
                                // onPercent = Math.round(onPercent);
                                monthAttendence.present = present;
                                monthAttendence.absent = absent;
                                monthAttendence.onLeave = onLeave;
                                monthAttendence.presentPercent = prePercent + "%";
                                monthAttendence.absentPercent = abPercent + "%";
                                monthAttendence.onLeavePercent = onPercent + "%";
                                studentAttendenceReport.push({ "Name": studentName, "studentId": studentId, "month": monthValue, "count": percent, "attendance": monthAttendence })

                                count++;

                                if (studentDataLength == count) {
                                    attendanceReport.push({ "totalCount": totalPercent, "totalPresent": totalPresent, "totaAbsent": totalAbsent, "totalOnLeave": totalOnLeave, "StudentAttendanceReport": studentAttendenceReport })
                                    next(null, attendanceReport);
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
                            sectionMonthlyAttendence: result1
                        });

                    }
                }
            );
        });
    });

router.route('/employee_monthly_attendence/:select_month/:school_id')
    .get(function (req, res, next) {
        var resultArray = [];
        var school_id = req.params.school_id;
        var monthValue = req.params.select_month;
        var employeeAttendenceReport = [];
        var attendanceReport = [];
        var totalPercent = totalPresent = totalAbsent = totalOnLeave = 0;
        // console.log(monthValue);


        mongo.connect(url, function (err, db) {

            async.waterfall(
                [
                    function getEmployees(next) {
                        //   console.log("getSubjects");
                        db.collection('employee').find({
                            school_id
                        }).toArray(function (err, result) {
                            if (err) {
                                next(err, null);
                            }
                            next(null, result);
                        });
                    },
                    function getEmployeesData(result, next) {
                        //   console.log("getChaptersData");                      
                        var count = 0;
                        var employeeResult = result;
                        var employeeResultLength = result.length;
                        if (employeeResultLength == 0) {
                            next(null, []);
                        } else {
                            //  console.log("In Second step sections")
                            employeeResult.forEach(function (employeeData) {
                                var employee_id = employeeData.employee_id;
                                monthValue = parseInt(monthValue);
                                db.collection('employee_attendance').aggregate([
                                    {
                                        $match: {
                                            employee_id: employee_id
                                        },
                                    },
                                    {
                                        "$redact": {
                                            "$cond": [
                                                { "$eq": [{ "$month": "$date" }, monthValue] },
                                                "$$KEEP",
                                                "$$PRUNE"
                                            ]
                                        }
                                    }
                                ]).toArray(function (err, results) {
                                    count++;
                                    if (err) {
                                        next(err, null);
                                    }
                                    employeeData.attendance = results
                                    //  console.log(studentData.attendance);

                                    if (employeeResultLength == count) {
                                        next(null, employeeResult);
                                    }

                                })
                            })
                        }
                    }, function getAttendenceTopicsData(result, next) {
                        //  console.log(result);
                        var count = 0;
                        var employeeResult = result;
                        var employeeDataLength = result.length;
                        //  console.log(classData.sections);
                        if (employeeDataLength == 0) {
                            next(null, []);
                        } else {
                            // console.log("In fourth step sections attendance")
                            employeeResult.forEach(function (employeeData) {
                                employeeAttendence = [];
                                // attendenceClass = [];

                                var attendenceCount = 0;
                                var employeeName = employeeData.first_name;
                                var employeeId = employeeData.employee_id;

                                employeeAttendence = employeeData.attendance;
                                //  console.log(student_id);
                                //   console.log(studentData.attendance);
                                present = absent = onLeave = 0;
                                monthAttendence = {};
                                for (i = 0; i < employeeAttendence.length; i++) {

                                    if (employeeAttendence[i].status == "Present") {
                                        present += 1;
                                    }
                                    else if (employeeAttendence[i].status == "Absent") {
                                        absent += 1;
                                    }
                                    else if (employeeAttendence[i].status == "On Leave") {
                                        onLeave += 1;
                                    }
                                }
                                percent = present + absent + onLeave;
                                totalPercent += percent;
                                totalPresent += present;
                                totalAbsent += absent;
                                totalOnLeave += onLeave;
                                prePercent = (100 * present) / percent;
                                // prePercent = Math.round(prePercent);
                                abPercent = (100 * absent) / percent;
                                // abPercent = Math.round(abPercent);
                                onPercent = (100 * onLeave) / percent;
                                // onPercent = Math.round(onPercent);
                                monthAttendence.present = present;
                                monthAttendence.absent = absent;
                                monthAttendence.onLeave = onLeave;
                                monthAttendence.presentPercent = prePercent + "%";
                                monthAttendence.absentPercent = abPercent + "%";
                                monthAttendence.onLeavePercent = onPercent + "%";
                                employeeAttendenceReport.push({ "Name": employeeName, "employeeId": employeeId, "month": monthValue, "count": percent, "attendance": monthAttendence })

                                count++;

                                if (employeeDataLength == count) {
                                    attendanceReport.push({ "totalCount": totalPercent, "totalPresent": totalPresent, "totaAbsent": totalAbsent, "totalOnLeave": totalOnLeave, "employeeAttendanceReport": employeeAttendenceReport })
                                    next(null, attendanceReport);
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
                            employeeMonthlyAttendence: result1
                        });

                    }
                }
            );
        });
    });


module.exports = router;

