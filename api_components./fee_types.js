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


// Fee Types
router.route('/fee_types/:school_id')
    .post(function (req, res, next) {
        var status = 1;
        var school_id = req.params.school_id;
        var item = {
            fee_types_id: 'getauto',
            school_id: school_id,
            fee_type: req.body.fee_type,
            fee_category: req.body.fee_category,
            status: status,
        }

        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'feetypes', function (err, autoIndex) {
                var collection = db.collection('feetypes');
                collection.ensureIndex({
                    "fee_types_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.fee_type == null || item.fee_category == null) {
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
                                            fee_types_id: 'FeeTypes-' + autoIndex
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
    .get(function (req, res, next) {

        var school_id = req.params.school_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('feetypes').find({ school_id });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    feetypes: resultArray
                });
            });
        });
    });



// fee Master


router.route('/fee_master/:school_id')
    .post(function (req, res, next) {
        var status = 1;
        var item = {
            fee_master_id: 'getauto',
            school_id: req.params.school_id,
            // fee_category : req.body.fee_category,
            fee_types_id: req.body.fee_types_id,
            class_id: req.body.class_id,
            fee_amount: req.body.fee_amount,
            due_date: req.body.due_date,
            fee_description: req.body.fee_description,
            // fee_due_date : req.body.fee_due_date

        }

        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'fee_master', function (err, autoIndex) {
                var collection = db.collection('fee_master');
                collection.ensureIndex({
                    "fee_master_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.fee_types_id == null || item.fee_amount == null) {
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
                                            fee_master_id: 'FeeMaster-' + autoIndex
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
    .get(function (req, res, next) {
        var school_id = req.params.school_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            // var cursor = db.collection('fee_types').find({school_id});
            var cursor = db.collection('fee_master').aggregate([
                {
                    $lookup: {
                        from: "feetypes",
                        localField: "fee_types_id",
                        foreignField: "fee_types_id",
                        as: "fee_doc"
                    }
                },
                {
                    "$unwind": "$fee_doc"
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
                    "$unwind": "$class_doc"
                },

                {
                    "$project": {
                        "_id": "$_id",
                        "fee_types_id": "$fee_types_id",
                        "class_id": "$class_id",
                        "fee_master_id": "$fee_master_id",
                        "fee_amount": "$fee_amount",
                        "due_date": "$due_date",
                        "fee_type": "$fee_doc.fee_type",
                        "fee_category": "$fee_doc.fee_category",
                        "class_name": "$class_doc.name"
                    }
                }
            ]);
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    feemaster: resultArray
                });
            });
        });
    });
router.route('/fee_amount_by_fee_type/:fee_types_id/:class_id')
    .get(function (req, res, next) {
        var fee_types_id = req.params.fee_types_id;
        var class_id = req.params.class_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            // var cursor = db.collection('fee_types').find({school_id});
            var cursor = db.collection('fee_master').aggregate([
                {
                    $match: {
                        fee_types_id: fee_types_id,
                        class_id: class_id
                    }
                },
                {
                    "$lookup": {
                        "from": "feetypes",
                        "localField": "fee_types_id",
                        "foreignField": "fee_types_id",
                        "as": "fee_doc"
                    }
                },
                {
                    "$project": {
                        "_id": "$_id",
                        "fee_types_id": "$fee_types_id",
                        "class_name": "$class_name",
                        "fee_master_id": "$fee_master_id",
                        "fee_amount": "$fee_amount",
                        "fee_type": "$fee_doc.fee_type",
                        "fee_category": "$fee_doc.fee_category",
                    }
                }

            ]);
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    feemaster: resultArray
                });
            });
        });
    });

router.route('/feeTypes_by_classId/:class_id')
    .get(function (req, res, next) {
        var resultArray = [];
        var class_id = req.params.class_id;

        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('fee_master').aggregate([
                {
                    $match: {
                        class_id: class_id
                    }
                },
                {
                    $lookup: {
                        from: "feetypes",
                        localField: "fee_types_id",
                        foreignField: "fee_types_id",
                        as: "feetype"
                    }
                },
                {
                    "$unwind": "$feetype"
                },
                {
                    "$project": {
                        "_id": "$_id",
                        "fee_types_id": "$fee_types_id",
                        "fee_type": "$feetype.fee_type",
                    }
                }
            ])
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    feeTypes: resultArray
                });
            });

        });
    });


// Fee Collection
router.route('/fee_collection/:student_id')
    .post(function (req, res, next) {
        var status = 1;
        var student_id = req.params.student_id;
        var splited = student_id.split("-");
        var school_id = splited[0] + '-' + splited[1];
        current_date = new Date();
        var item = {
            student_fee_id: 'getauto',
            student_id: student_id,
            fee_types_id: req.body.fee_types_id,
            fee_paid: req.body.fee_paid,
            school_id: school_id,
            class_id: req.body.class_id,
            payment_mode: req.body.payment_mode,
            discount: req.body.discount,
            fine: req.body.fine,
            current_date: current_date,
            status: status,
        }

        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'student_fee', function (err, autoIndex) {
                var collection = db.collection('student_fee');
                collection.ensureIndex({
                    "student_fee_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.fee_types_id == null || item.student_id == null) {
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
                                            student_fee_id: 'student_fee-' + autoIndex
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
    });


router.route('/fee_collection/:student_id')
    .get(function (req, res, next) {
        var student_id = req.params.student_id;
        var splited = student_id.split("-");
        var class_id = splited[0] + '-' + splited[1] + '-' + splited[2] + '-' + splited[3];

        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            // var cursor = db.collection('student_fee').find({ student_id });
            var cursor = db.collection('student_fee').aggregate([
                {
                    $match: {
                        student_id: student_id
                    }
                },
                {
                    $lookup: {
                        from: "feetypes",
                        localField: "fee_types_id",
                        foreignField: "fee_types_id",
                        as: "feetype"
                    }
                },
                {
                    "$unwind": "$feetype"
                },
                {
                    $lookup: {
                        from: "fee_master",
                        localField: "fee_types_id",
                        foreignField: "fee_types_id",
                        as: "feemaster"
                    }
                },
                {
                    "$unwind": "$feemaster"
                },
                {
                    "$project": {
                        "_id": "$_id",
                        "student_fee_id": "$student_fee_id",
                        "student_id": "$student_id",
                        "fee_types_id": "$fee_types_id",
                        "payment_mode": "$payment_mode",
                        "discount": "$discount",
                        "fine": "$fine",
                        "class_id": "$feemaster.class_id",
                        "current_date": "$current_date",
                        "fee_paid": "$fee_paid",
                        "total_fee": "$total_fee",
                        "fee_category": "$feetype.fee_type",
                        "fee_amount": "$feemaster.fee_amount",
                    }
                },
                {
                    $match: {
                        class_id: class_id
                    }
                },
            ])
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    student_fee_details: resultArray
                });
            });
        });
    });

router.route('/fee_by_Date/:select_date/:school_id')
    .get(function (req, res, next) {
        var resultArray = [];
        var school_id = req.params.school_id;
        var select_date = new Date(req.params.select_date);
        var endDate = new Date(select_date);
        endDate.setDate(endDate.getDate() + 1)
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            // var cursor = db.collection('student_fee').find({
            //     current_date: { $gte: new Date(select_date.toISOString()), $lt: new Date(endDate.toISOString()) },
            //     school_id: school_id
            // });
            var cursor = db.collection('student_fee').aggregate([
                {
                    $match: {
                        current_date: {
                            $gte: new Date(select_date.toISOString()),
                            $lt: new Date(endDate.toISOString())
                        }
                    },
                },
                {
                    $lookup: {
                        from: "feetypes",
                        localField: "fee_types_id",
                        foreignField: "fee_types_id",
                        as: "fee_doc"
                    }
                },
                {
                    $unwind: "$fee_doc"
                },
                // {
                //     $lookup: {
                //         from: "fee_master",
                //         localField: "fee_types_id",
                //         foreignField: "fee_types_id",
                //         as: "feeMaster_doc"
                //     }
                // },
                // {
                //     $unwind: "$feeMaster_doc"
                // },
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
                    "$project": {
                        "_id": "$_id",
                        "student_Name": "$student_doc.first_name",
                        "student_id": "$student_id",
                        "fee_types_id": "$fee_types_id",
                        "fee_type": "$fee_doc.fee_type",
                        // "totalFee": "$feeMaster_doc.fee_amount",
                        "payment_mode": "$payment_mode",
                        "discount": "$discount",
                        "fine": "$fine",
                        "current_date": "$current_date",
                        // "due_date": "$feeMaster_doc.due_date",
                        "fee_paid": "$fee_paid",
                        "fee_category": "$feetype.fee_category",
                        // "fee_amount": "$feemaster.fee_amount",
                    }
                }
            ])
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    fee: resultArray
                });
            });

        });
    });


router.route('/feetypes/:school_id/:class_id')
    .get(function (req, res, next) {
        var school_id = req.params.school_id;
        var class_id = req.params.class_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('fee_master').find({ school_id, class_id });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    feetypes: resultArray
                });
            });
        });
    });


//Add student fees

router.route('/student/feecollect/:school_id/:student_id')
    .post(function (req, res, next) {
        var status = 1;
        var academic_year = "2017-2018";
        var fee_status = "paid";
        var school_id = req.params.school_id;
        var student_id = req.params.student_id;
        var class_id = req.body.class_id;
        var section_id = req.body.section_id;
        var fee_type_id = req.body.fee_type_id;
        var item = {
            school_id: school_id,
            student_id: student_id,
            class_id: class_id,
            section_id: section_id,
            fee_category: req.body.fee_category,
            fee_type: req.body.fee_type,
            fee_amount: req.body.fee_amount,
            fee_fine: req.body.fee_fine,
            fee_discount: req.body.fee_discount,
            fee_total: req.body.fee_total,
            fee_status: fee_status,
            fee_type_id: fee_type_id,
            fee_description: req.body.fee_description,
            fee_due_date: req.body.fee_due_date,
            fee_paid_on: new Date(),
            academic_year: academic_year,
            status: status
        }

        mongo.connect(url, function (err, db) {
            var collection = db.collection('student_fee');
            if (item.school_id == null || item.student_id == null || item.class_id == null || item.section_id == null || item.fee_type_id == null || item.fee_category == null || item.fee_total == null) {
                res.end('null');
            } else {

                db.collection('student_fee').find({ school_id, student_id, fee_type_id, class_id, section_id }).toArray(function (err, items) {

                    if (items.length > 0) {
                        res.end('false');
                    } else {
                        collection.insertOne(item, function (err1, result1) {
                            if (err1) {
                                if (err1.code == 11000) {
                                    res.end('false');
                                }
                                res.end('false');
                            }
                            db.close();
                            res.send('true');
                        });
                    }
                })
            }
        });
    })
    .get(function (req, res, next) {
        var school_id = req.params.school_id;
        var student_id = req.params.student_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('student_fee').find({ school_id, student_id });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    Student_fee: resultArray
                });
            });
        });
    });


// Modified

// Edit for Fee Types

router.route('/edit_fee_types/:fee_types_id')
    .put(function (req, res, next) {
        var myquery = { fee_types_id: req.params.fee_types_id };
        var req_fee_type = req.body.fee_type;
        var req_fee_category = req.body.fee_category;

        mongo.connect(url, function (err, db) {
            db.collection('feetypes').update(myquery, {
                $set: {
                    fee_type: req_fee_type,
                    fee_category: req_fee_category
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



// Modified

// Delete for Fee Types



router.route('/delete_fee_types/:fee_types_id')
    .delete(function (req, res, next) {
        var myquery = { fee_types_id: req.params.fee_types_id };

        mongo.connect(url, function (err, db) {
            db.collection('feetypes').deleteOne(myquery, function (err, result) {
                assert.equal(null, err);
                if (err) {
                    res.send('false');
                }
                db.close();
                res.send('true');
            });
        });
    });


// Modified

// Edit for Fee Collection

router.route('/edit_fee_master/:fee_master_id')
    .put(function (req, res, next) {
        var myquery = { fee_master_id: req.params.fee_master_id };
        var req_fee_amount = req.body.fee_amount;
        var req_fee_type = req.body.fee_type;
        var req_class_name = req.body.class_name;


        mongo.connect(url, function (err, db) {
            db.collection('fee_master').update(myquery, {
                $set: {
                    fee_amount: req_fee_amount,
                    fee_type: req_fee_type,
                    class_name: req_class_name
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



// Modified

// Delete for Fee Types



router.route('/delete_fee_master/:fee_master_id')
    .delete(function (req, res, next) {
        var myquery = { fee_master_id: req.params.fee_master_id };

        mongo.connect(url, function (err, db) {
            db.collection('fee_master').deleteOne(myquery, function (err, result) {
                assert.equal(null, err);
                if (err) {
                    res.send('false');
                }
                db.close();
                res.send('true');
            });
        });
    });


router.route('/edit_fee_collection/:student_fee_id')
    .put(function (req, res, next) {
        var myquery = { student_fee_id: req.params.student_fee_id };
        var req_payment_mode = req.body.payment_mode;
        var req_fee_type = req.body.fee_type;
        var req_discount = req.body.discount;
        var req_fine = req.body.fine;


        mongo.connect(url, function (err, db) {
            db.collection('student_fee').update(myquery, {
                $set: {
                    payment_mode: req_payment_mode,
                    fee_type: req_fee_type,
                    discount: req_discount,
                    fine: req_fine
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


router.route('/delete_fee_collection/:student_fee_id')
    .delete(function (req, res, next) {
        var myquery = { student_fee_id: req.params.student_fee_id };

        mongo.connect(url, function (err, db) {
            db.collection('student_fee').deleteOne(myquery, function (err, result) {
                assert.equal(null, err);
                if (err) {
                    res.send('false');
                }
                db.close();
                res.send('true');
            });
        });
    });



router.route('/section_student_fee_paid_details/:section_id/:fee_types_id')
    .get(function (req, res, next) {
        var resultArray = [];
        // var school_id = req.params.school_id;
        // var class_id = req.params.class_id;
        var section_id = req.params.section_id;
        var splited = section_id.split("-");
        var class_id = splited[0] + '-' + splited[1] + '-' + splited[2] + '-' + splited[3];
        var fee_types_id = req.params.fee_types_id;
        var feeDetails = studentFeeDetails = [];

        mongo.connect(url, function (err, db) {

            async.waterfall(
                [
                    function getstudents(next) {
                        //   console.log("getSchoolClassed");
                        db.collection('students').find({
                            section_id
                        }).toArray(function (err, result) {
                            if (err) {
                                next(err, null);
                            }
                            next(null, result);
                        });
                    },
                    function getStudentsData(result, next) {
                        //   console.log("getSectionsData");                      
                        var count = 0;
                        var studentResult = result;
                        var studentResultLength = result.length;
                        if (studentResultLength == 0) {
                            next(null, []);
                        } else {
                            //  console.log("In Second step sections")
                            studentResult.forEach(function (studentData) {
                                var student_id = studentData.student_id;
                                // console.log(student_id);
                                db.collection('student_fee').find({
                                    student_id
                                }).sort({ 'student_id': 1 }).toArray(function (err, results) {
                                    count++;
                                    if (err) {
                                        next(err, null);
                                    }
                                    studentData.fee = results
                                    // console.log(studentData.fee);

                                    if (studentResultLength == count) {

                                        next(null, studentResult);
                                        // next(null, classData);
                                    }

                                })
                            })
                        }
                    },
                    function getFeeTypesByClassId(result, next) {
                        //   console.log("getTotalSchoolAttendance");
                        // console.log(result);                        
                        var data = db.collection('fee_master').find({
                            fee_types_id: fee_types_id,
                            class_id: class_id
                        }).toArray(function (err, feeResult) {
                            if (err) {
                                next(err, null);
                            }
                            // console.log("total attenance result")
                            // console.log(attResult);
                            next(null, result, feeResult);
                        });
                    }, function getStudentFeeDetails(result, feeResult, next) {
                        // console.log("getAttendanceData");
                        //  console.log(result);
                        //  console.log(feeResult);
                        var count = 0;

                        var studentResult = result;
                        var studentDataLength = result.length;
                        if (feeResult.length == 0) {
                            res.end("false");
                        }
                        else if (feeResult.length >= 1) {
                            if (studentDataLength == 0) {
                                next(null, []);
                            } else {
                                // console.log("In fourth step sections attendance")

                                studentResult.forEach(function (studentData) {

                                    var feeLength = studentData.fee.length;
                                    var studentFee = studentData.fee;
                                    var studentId = studentData.student_id;
                                    // console.log(studentFee);
                                    //  console.log(studentFee);
                                    //    var studentFeeDetails = [];
                                    var studentName = studentData.first_name;
                                    totalfee = feeResult[0].fee_amount;
                                    due_date = feeResult[0].due_date;
                                    var balance = 0;
                                    paidAmount = 0;
                                    TotalDiscount = TotalFine = 0;
                                    fine = discount = 0;
                                    if (feeLength == 0) {
                                        count++;
                                        balance = totalfee - paidAmount + fine - discount;
                                        // console.log("count 0")
                                    } else {

                                        for (var i = 0; i < feeLength; i++) {

                                            if (studentFee[i].fee_types_id == feeResult[0].fee_types_id) {

                                                feePaid = studentFee[i].fee_paid;
                                                feePaid = parseInt(feePaid);
                                                fine = studentFee[i].fine;
                                                fine = parseInt(fine);
                                                discount = studentFee[i].discount;
                                                discount = parseInt(discount);
                                                //console.log(typeof (feePaid) + " " + feePaid);
                                                paidAmount += feePaid;
                                                TotalDiscount += discount;
                                                TotalFine += fine;
                                            }
                                        }

                                        balance = totalfee - paidAmount - TotalDiscount + TotalFine;
                                        count++;
                                    }
                                    // console.log(studentName);
                                    //  console.log("totalfee:" + totalfee + " paid:" + paidAmount + " balance:" + balance);
                                    studentFeeDetails.push({ "studentName": studentName, "totalFee": totalfee, "paidAmount": paidAmount, "fine": TotalFine, "Discount": TotalDiscount, "Balance": balance, "DueDate": due_date })

                                    //  feeDetails.push({"studentfee":studentFeeDetails});

                                    if (studentDataLength == count) {
                                        next(null, studentFeeDetails);
                                    }
                                });
                            }
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
                            studentFee: result1
                        });

                    }
                }
            );
        });
    });




module.exports = router;