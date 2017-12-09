// flow
var express = require("express");
var config = require("../config.json");
var bodyParser = require("body-parser");
var api_key = "api-key-KJFSI4924R23RFSDFSD7F94";
var mongo = require('mongodb').MongoClient;
var autoIncrement = require("mongodb-autoincrement");
var assert = require('assert');
var forEach = require('async-foreach').forEach;
var port = process.env.PORT || 4005;
var router = express.Router();
var async = require('async');
var url = 'mongodb://' + config.dbhost + ':27017/s_erp_data';

var cookieParser = require('cookie-parser');
router.use(function (req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
});

// Add Attandance

router.route('/attendance/:student_id')
    .post(function (req, res, next) {
        var student_id = req.params.student_id;
        var d = new Date();
        var month = d.getMonth() + 1;
        var day = d.getDate()
        var year = d.getFullYear()
        var select_date = new Date(year, d.getMonth(), day, 05, 30, 0, 0);
        var endDate = new Date(select_date);
        endDate.setDate(endDate.getDate() + 1)
        var time = d.getHours();
        if (time >= 13) {
            var session = 'afternoon';
        } else {
            var session = 'morning';
        }
        attendance = [];
        if (req.body.session) {
            var session = req.body.session;
        }
        var item = {
            attendance_id: 'getauto',
            student_id: student_id,
            class_id: req.body.class_id,
            section_id: req.body.section_id,
            date: new Date(),
            session: session,
            status: req.body.status
        };
        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'attendance', function (err, autoIndex) {
                var collection = db.collection('attendance');
                var data = collection.find({
                    date: { $gte: new Date(select_date.toISOString()), $lt: new Date(endDate.toISOString()) },
                    student_id: item.student_id
                }).count(function (e, triggerCount) {

                    if (triggerCount > 0) {
                        res.end('false');
                    } else {
                        collection.ensureIndex({
                            "attendance_id": 1,
                        }, {
                                unique: true
                            }, function (err, result) {
                                if (item.class_id == null || item.section_id == null || item.date == null || item.session == null || item.status == null) {
                                    res.end('null');
                                } else {
                                    collection.insertOne(item, function (err, result) {
                                        if (err) {
                                            if (err.code == 11000) {
                                                console.log(err);
                                                res.end('false');
                                            }
                                            res.end('false');
                                        }
                                        collection.update({
                                            _id: item._id
                                        }, {
                                                $set: {
                                                    attendance_id: student_id + '-ATT-' + autoIndex
                                                }
                                            }, function (err, result) {
                                                db.close();
                                                res.send({
                                                    attendance_id: student_id + '-ATT-' + autoIndex
                                                });
                                                // res.end();
                                            });
                                    });
                                }
                            });

                    }
                })


            });


        });
    })
    .get(function (req, res, next) {
        var student_id = req.params.student_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('attendance').find({
                student_id
            });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    attendance: resultArray
                });
            });
        });
    });

// add bulk attendance 
router.route('/attendancebulk/:class_id/:section_id/:school_id')
    .post(function (req, res, next) {

        var class_id = req.params.class_id;
        var section_id = req.params.section_id;
        var school_id = req.params.school_id;
        var d = new Date();
        var month = d.getMonth() + 1;
        var day = d.getDate()
        var year = d.getFullYear()
        var select_date = new Date(year, d.getMonth(), day, 05, 30, 0, 0);
        var endDate = new Date(select_date);
        endDate.setDate(endDate.getDate() + 1)
        var time = d.getHours();
        // if(!req.body.students){
        //     res.end('null');
        // }
        if (class_id == null || section_id == null || school_id == null || !req.body.students) {
            res.end('null');
        } else {
            var count = 0;
            if (req.body.students.length > 0) {
                forEach(req.body.students, function (key, value) {

                    if (time >= 13) {
                        var session = 'afternoon';
                    } else {
                        var session = 'morning';
                    }
                    attendance = [];
                    if (req.body.session) {
                        var session = req.body.session;
                    }
                    var item = {
                        attendance_id: '',
                        student_id: key.student_id,
                        class_id: class_id,
                        section_id: section_id,
                        school_id: school_id,
                        date: new Date(),
                        session: session,
                        status: key.status
                    };
                    //    console.log(item.date);
                    mongo.connect(url, function (err, db) {
                        autoIncrement.getNextSequence(db, 'attendance', function (err, autoIndex) {
                            //  console.log(new Date(select_date.toISOString()));
                            //  console.log(new Date(endDate.toISOString()))
                            var data = db.collection('attendance').find({
                                date: { $gte: new Date(select_date.toISOString()), $lt: new Date(endDate.toISOString()) },
                                student_id: item.student_id
                            }).count(function (e, triggerCount) {

                                if (triggerCount > 0) {
                                    count++;
                                    if (count == req.body.students.length) {
                                        res.send('false');
                                    }
                                } else {

                                    var collection = db.collection('attendance');
                                    collection.ensureIndex({
                                        "attendance_id": 1,
                                    }, {
                                            unique: true
                                        }, function (err, result) {
                                            if (item.class_id == null || item.section_id == null || item.date == null || item.session == null || item.status == null) {
                                                res.end('null');
                                            } else {
                                                item.attendance_id = key.student_id + '-ATT-' + autoIndex;
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

                                                    if (count == req.body.students.length) {
                                                        res.end('true');
                                                    }


                                                });
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

    .get(function (req, res, next) {

        var class_id = req.params.class_id;
        var section_id = req.params.section_id;
        var school_id = req.params.school_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('attendance').find({
                class_id,
                section_id
            });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    attendance: resultArray
                });
            });
        });
    });

router.route('/sectionAttendenceByDate/:section_id/:select_date')
    .get(function (req, res, next) {
        var resultArray = [];
        var section_id = req.params.section_id;
        var select_date = new Date(req.params.select_date);
        var endDate = new Date(select_date);
        endDate.setDate(endDate.getDate() + 1)
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var data = db.collection('attendance').find({
                date: { $gte: new Date(select_date.toISOString()), $lt: new Date(endDate.toISOString()) },
                section_id: section_id
            }).count(function (e, triggerCount) {

                if (triggerCount > 0) {
                    res.send("submitted");
                    db.close();
                }
                else {
                    res.send("not submitted");
                    db.close();
                }
            });
        });
    });


router.route('/allClasses_Attendence_by_date/:select_date/:class_id/:school_id')
    .get(function (req, res, next) {
        var resultArray = [];
        var school_id = req.params.school_id;
        var class_id = req.params.class_id;
        var select_date = new Date(req.params.select_date);
        var endDate = new Date(select_date);
        var present = 0, absent = 0, onLeave = 0;
        var count = 0, dataCount;
        endDate.setDate(endDate.getDate() + 1)
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var data = db.collection('attendance').find({
                date: { $gte: new Date(select_date.toISOString()), $lt: new Date(endDate.toISOString()) },
                class_id: class_id,
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
                    // console.log(present);
                }
                else if (doc.status == "Absent") {
                    absent += 1;
                }
                else if (doc.status == "On Leave") {
                    onLeave += 1;
                }
            })
            // dataCount.then(function (result) {
            //     console.log(result) //will log results.

            // for (i = 0; i < result; i++) {
            //     console.log("hema");
            //     if (data[i].status == "Present") {
            //         present += 1;
            //         // console.log(present);
            //     }
            //     else if (data[i].status == "Absent") {
            //         absent += 1;
            //     }
            //     else if (data[i].status == "On Leave") {
            //         onLeave += 1;
            //     }
            // }
            // })

            var cursor = db.collection('attendance').aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(select_date.toISOString()),
                            $lt: new Date(endDate.toISOString())
                        },
                        school_id: school_id,
                        class_id: class_id,
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
                        class_name: {
                            "$first": "$class_doc.name"
                        },
                        section_name: {
                            "$first": "$section_doc.name"
                        },
                        status: {
                            "$first": "$status"
                        },
                        student_name: {
                            "$first": "$student_doc.first_name"
                        }

                    }
                }
            ])

            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    count: count,
                    present: present,
                    onleave: onLeave,
                    absent: absent,
                    classAttendence: resultArray
                });
            });
        });
    });


router.route('/section_attendence_by_Date/:select_date/:section_id')
    .get(function (req, res, next) {
        var resultArray = [];
        var section_id = req.params.section_id;
        var select_date = new Date(req.params.select_date);
        var present = 0, absent = 0, onLeave = 0;
        var endDate = new Date(select_date);
        var count = 0, dataCount;
        endDate.setDate(endDate.getDate() + 1)
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
                        date: {
                            $gte: new Date(select_date.toISOString()),
                            $lt: new Date(endDate.toISOString())
                        },
                        section_id: section_id
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
                        class_name: {
                            "$first": "$class_doc.name"
                        },
                        section_name: {
                            "$first": "$section_doc.name"
                        },
                        status: {
                            "$first": "$status"
                        },
                        student_name: {
                            "$first": "$student_doc.first_name"
                        }
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
                    present: present,
                    onleave: onLeave,
                    absent: absent
                });
            });

        });
    });



router.route('/AttendenceDayWise')
    .post(function (req, res, next) {
        var status = 1;
        var description = 'Attendence Submitted';
        var date = new Date();
        var item = {
            date: date,
            description: description,
            status: status
        };
        mongo.connect(url, function (err, db) {
            var collection = db.collection('AttendenceDayWise');
            if (item.description == null) {
                res.end('null');
            } else {
                collection.insertOne(item, function (err, result) {
                    if (err) {

                        if (err.code == 11000) {
                            console.log(err);
                            res.end('false');
                        }
                        res.end('false');
                    }
                    if (result) {
                        db.close();
                        res.end('true');
                    }
                });
            }
        });

    })


router.route('/edit_attendance/:attendance_id/:name/:value')
    .post(function (req, res, next) {
        var attendance_id = req.params.attendance_id;
        var name = req.params.name;
        var value = req.params.value;
        mongo.connect(url, function (err, db) {
            db.collection('attendance').update({
                attendance_id
            }, {
                    $set: {
                        [name]: value
                    }
                }, function (err, result) {
                    assert.equal(null, err);
                    db.close();
                    res.send('true');
                });
        });
    });


router.route('/get_attendance/:student_id/')
    .get(function (req, res, next) {
        var student_id = req.params.student_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('attendance').find({
                student_id
            }, {
                    'status': 1,
                    'session': 1,
                    'date': 1,
                    '_id': 0
                });
            cursor.forEach(function (doc, err) {
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send(resultArray);
            });
        });
    });

router.route('/get_attendance_by_date/:student_id/:date')
    .get(function (req, res, next) {
        var student_id = req.params.student_id;
        var date = req.params.date;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('attendance').find({
                student_id,
                date
            }, {
                    'status': 1,
                    'session': 1,
                    'date': 1,
                    '_id': 0
                });
            cursor.forEach(function (doc, err) {
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send(resultArray);
            });
        });
    });

router.route('/get_attendance_id_by_date_session/:student_id/:date/:session')
    .get(function (req, res, next) {
        var student_id = req.params.student_id;
        var date = req.params.date;
        var session = req.params.session;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('attendance').find({
                student_id,
                date,
                session
            }, {
                    'attendance_id': 1,
                    '_id': 0
                });
            cursor.forEach(function (doc, err) {
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send(resultArray);
            });
        });
    });


module.exports = router;



router.route('/sec_attendence_b/:select_date/:school_id')
    .get(function (req, res, next) {
        var resultArray = [];
        var school_id = req.params.school_id;
        var select_date = new Date(req.params.select_date);
        var present = 0, absent = 0, onLeave = 0;
        var endDate = new Date(select_date);
        var count, dataCount;
        var sectionArray = [];
        var classArray = [];
        var resultarray = [];
        var attendenceSection = [];
        var attendenceClass = [];
        var sectionName, className;
        endDate.setDate(endDate.getDate() + 1)
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var classes = db.collection('school_classes').find({ school_id });
            var sections = db.collection('class_sections').find({ school_id });
            var data = db.collection('attendance').find({
                date: { $gte: new Date(select_date.toISOString()), $lt: new Date(endDate.toISOString()) },
                school_id: school_id
            })
            dataCount = data.count(function (e, triggerCount) {
                if (triggerCount > 0) {
                    count = triggerCount;
                    //  console.log(count);
                }
            });

            classes.forEach(function (cls, err) {
                console.log("classes" + cls.class_id);
                if (cls.school_id == school_id) {
                    sections.forEach(function (sec, err) {
                        console.log("sections");
                        if (cls.class_id == sec.class_id) {
                            console.log("classSection");
                            present = absent = onLeave = 0;
                            data.forEach(function (doc, err) {
                                console.log("dta");
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
                    className = cls.name;
                    attendenceClass.push(className);
                    attendenceClass.push(sectionArray);
                }
            })
            classArray.push(attendenceClass);

            var cursor = db.collection('attendance').aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(select_date.toISOString()),
                            $lt: new Date(endDate.toISOString())
                        },
                        school_id: school_id

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
                        class_name: {
                            "$first": "$class_doc.name"
                        },
                        section_name: {
                            "$first": "$section_doc.name"
                        },
                        status: {
                            "$first": "$status"
                        },
                        student_name: {
                            "$first": "$student_doc.first_name"
                        }

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
                    classes: classArray
                });
            });

        });
    });


