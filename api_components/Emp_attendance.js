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
var url = 'mongodb://' + config.dbhost + ':27017/s_erp_data';

var cookieParser = require('cookie-parser');
router.use(function (req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
});

// Add Attandance

router.route('/employee_attendance/:employee_id')
    .post(function (req, res, next) {
        var employee_id = req.params.employee_id;
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
            employee_id: employee_id,
            date: new Date(),
            category: req.body.category,
            session: session,
            status: req.body.status,
        };
        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'employee_attendance', function (err, autoIndex) {
                var collection = db.collection('employee_attendance');
                var data = collection.find({
                    date: { $gte: new Date(select_date.toISOString()), $lt: new Date(endDate.toISOString()) },
                    employee_id: item.employee_id
                }).count(function (e, triggerCount) {

                    if (triggerCount > 0) {
                        res.end('false');
                    } else {
                        collection.ensureIndex({
                            "employee_attendance_id": 1,
                        }, {
                                unique: true
                            }, function (err, result) {
                                if (item.employee_id == null || item.date == null || item.session == null || item.status == null) {
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
                                                    employee_attendance_id: employee_id + '-EMPATT-' + autoIndex
                                                }
                                            }, function (err, result) {
                                                db.close();
                                                res.send({
                                                    employee_attendance_id: employee_id + '-EMPATT-' + autoIndex
                                                });
                                                // res.end();
                                            });
                                    });
                                }
                            });
                    }

                });



            });
        });
    })
    .get(function (req, res, next) {
        var employee_id = req.params.employee_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('employee_attendance').find({
                employee_id
            });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    emp_attendance: resultArray
                });
            });
        });
    });

//add bulk attendance

router.route('/employee_attendancebulk/:school_id')
    .post(function (req, res, next) {

        var school_id = req.params.school_id;
       // console.log(school_id);
        var d = new Date();
        var month = d.getMonth() + 1;
        var day = d.getDate()
        var year = d.getFullYear();
        // var date = req.params.date;
        var select_date = new Date(year, d.getMonth(), day, 05, 30, 0, 0);
        var endDate = new Date(select_date);
        endDate.setDate(endDate.getDate() + 1)
        var time = d.getHours();
        if (school_id == null) {
            res.end('null');
        } else {
            var count = 0;

            if (req.body.employees.length > 0) {
                forEach(req.body.employees, function (key, value) {

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
                        employee_attendance_id: '',
                        employee_id: key.employee_id,
                        school_id: school_id,
                        date: new Date(),
                        category: key.category,
                        session: session,
                        status: key.status
                    };

                    mongo.connect(url, function (err, db) {
                        autoIncrement.getNextSequence(db, 'employee_attendance', function (err, autoIndex) {
                            var data = db.collection('employee_attendance').find({
                                date: { $gte: new Date(select_date.toISOString()), $lt: new Date(endDate.toISOString()) },
                                employee_id: item.employee_id
                            }).count(function (e, triggerCount) {
                                if (triggerCount > 0) {
                                    count++;
                                    if (count == req.body.employees.length) {
                                        res.send('false');
                                    }
                                } else {

                                    var collection = db.collection('employee_attendance');
                                    collection.ensureIndex({
                                        "employee_attendance_id": 1,
                                    }, {
                                            unique: true
                                        }, function (err, result) {
                                            if (item.date == null || item.session == null || item.status == null || item.category == null) {
                                                res.end('null');
                                            } else {
                                                item.employee_attendance_id = key.employee_id + '-EMPATT-' + autoIndex;
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

                                                    if (count == req.body.employees.length) {
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


    });
router.route('/edit_attendance/:employee_attendance_id/:name/:value')
    .post(function (req, res, next) {
        var employee_attendance_id = req.params.employee_attendance_id;
        var name = req.params.name;
        var value = req.params.value;
        mongo.connect(url, function (err, db) {
            db.collection('employee_attendance').update({
                employee_attendance_id
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


router.route('/get_employee_attendance/:employee_id/')
    .get(function (req, res, next) {
        var employee_id = req.params.employee_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('employee_attendance').find({
                employee_id
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

router.route('/get_employee_attendance_by_date/:employee_id/:date')
    .get(function (req, res, next) {
        var student_id = req.params.student_id;
        var date = req.params.date;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('employee_attendance').find({
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


router.route('/employee_Attendance_by_category/:category/:select_date')
    .get(function (req, res, next) {
        var resultArray = [];
        var category = req.params.category;
        var select_date = new Date(req.params.select_date);
        var endDate = new Date(select_date);
        var present = 0, absent = 0, onLeave = 0;
        var count=0,dataCount;
        endDate.setDate(endDate.getDate() + 1)
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var data = db.collection('employee_attendance').find({
                date: { $gte: new Date(select_date.toISOString()), $lt: new Date(endDate.toISOString()) },
                category: category
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
                        'category': category
                    }
                }
            ])

            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    employeeAttendence: resultArray,
                    count: count,
                    present: present,
                    onleave: onLeave,
                    absent: absent

                });
            });
        });
    });





router.route('/get_employeeattendance_id_by_date_session/:employee_id/:date/:session')
    .get(function (req, res, next) {
        var employee_id = req.params.employee_id;
        var date = req.params.date;
        var session = req.params.session;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('employee_attendance').find({
                employee_id,
                date,
                session
            }, {
                    'employee_attendance_id': 1,
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
