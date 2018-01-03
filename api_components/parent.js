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
var url = 'mongodb://' + config.dbhost + ':27017/s_erp_data';

var cookieParser = require('cookie-parser');
router.use(function (req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
});

//List parents
router.route('/getparentlist/:schoolid')
    .get(function (req, res, next) {
        var school_id = req.params.schoolid;
        var parents = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            // var cursor = db.collection('parents').find({ school_id: school_id, status: 1 });
            var cursor = db.collection('parents').aggregate([
                {
                    $match: {
                        school_id: school_id
                    }
                },
                {
                    $unwind: "$students"
                },
                {
                    $lookup: {
                        from: "students",
                        localField: "students.student_id",
                        foreignField: "student_id",
                        as: "student_doc"
                    }
                },
            ]);

            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                parents.push(doc);
            }, function () {
                db.close();
                res.send({
                    parents: parents
                });
            });
        });
    });

//List parents
router.route('/get_parents_by_section_id/:section_id')
    .get(function (req, res, next) {
        var section_id = req.params.section_id;
        var parents = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            //  var cursor = db.collection('parents').find({}, {students: { $elemMatch: { section_id: section_id } }})

            var cursor = db.collection('parents').aggregate([
                {
                    $match: {
                        students: { $elemMatch: { section_id: section_id } }
                    }
                },
                {
                    $unwind: "$students"
                },
                {
                    $lookup: {
                        from: "students",
                        localField: "students.student_id",
                        foreignField: "student_id",
                        as: "student_doc"
                    }
                },
            ]);

            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                parents.push(doc);
            }, function () {
                db.close();
                res.send({
                    parents: parents
                });
            });
        });
    });

//get Students by parent id
router.route('/getstudentsbyparentid/:parentid')
    .get(function (req, res, next) {
        var parent_id = req.params.parentid;
        var parents = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('parents').find({ parent_id: parent_id, status: 1 });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                parents.push(doc);
            }, function () {
                db.close();
                res.send({
                    parents: parents
                });
            });
        });
    });

router.route('/addStudentToParent/:parentId/:studentId')
    .put(function (req, res, next) {
        var parent_id = req.params.parentId;
        var student_id = req.params.studentId;
        mongo.connect(url, function (err, db) {
            var collection = db.collection('parents');

            collection.find({
                "parent_id": parent_id,
                "students.student_id": student_id

            }).toArray(function (err, results) {
                if (err) {
                    res.send('false')
                }

                if (results.length == 0) {
                    collection.update({
                        "parent_id": parent_id
                    }, {
                            "$push": {
                                "students": {
                                    student_id: student_id
                                }
                            }
                        },
                        function (err, numAffected) {
                            if (err) {
                                res.send('false')
                            }
                            // console.log(numAffected.result);
                            if (numAffected.result.nModified == 1) {
                                res.send('true')
                            } else {
                                res.send('false')
                            }
                        });
                } else {
                    res.send('false')
                }
            });


        });
    });


router.route('/removeStudentFromParent/:parentId/:studentId')
    .put(function (req, res, next) {
        var parent_id = req.params.parentId;
        var student_id = req.params.studentId;


        mongo.connect(url, function (err, db) {
            var collection = db.collection('parents');

            collection.update({
                "parent_id": parent_id
            }, {
                    "$pull": {
                        "students": {
                            student_id: student_id

                        }
                    }
                },
                function (err, numAffected) {
                    // console.log(numAffected);
                    if (err) {
                        res.send('false')
                    }
                    if (numAffected) {
                        if (numAffected.result.nModified == 1) {
                            db.close();
                            res.send('true')
                        } else {
                            db.close();
                            res.send('false')

                        }

                    }
                });

        });
    });

//get Students by parent id
router.route('/all_classes/:select_date/:school_id')
    .get(function (req, res, next) {
        var schoolId = req.params.school_id;
        var select_date = new Date(req.params.select_date);
        var endDate = new Date(select_date);
        endDate.setDate(endDate.getDate() + 1)
        var parents = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            //  var cursor = db.collection('parents').find({ parent_id: parent_id, status: 1 });
            var cursor = db.collection('school_classes').aggregate([
                {
                    $match: {
                        school_id: schoolId
                    }
                },
                {
                    $lookup: {
                        from: 'class_sections',
                        localField: 'class_id',
                        foreignField: 'class_id',
                        as: 'x1'
                    }
                },
                {
                    '$unwind': '$x1'
                },
                {
                    $lookup: {
                        from: 'attendance',
                        localField: 'x1.section_id',
                        foreignField: 'section_id',
                        'as': 'x2'
                    }
                },
                {
                    '$unwind': '$x2'
                },
                {
                    $match: {
                        'x2.date': {
                            $gte: new Date(select_date.toISOString()),
                            $lt: new Date(endDate.toISOString())
                        },
                    }
                },
                // {
                //     "$project": {
                //         "_id": "$_id",
                //         "class_name": "$name",
                //         "section_name": "$x1.name",
                //         "status": "$x2.status",
                        // "marks": "$marks",
                        // "comment": "$comment",
                        // "date": "$date",
                        // "status": "$status",
                        // "student_name": "$student_doc.first_name",
                        // "roll_no": "$student_doc.roll_no",
                        // "max_marks": "$exams_doc.max_marks",

                //     }
                // }
            ]);
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                parents.push(doc);
            }, function () {
                db.close();
                res.send({
                    parents: parents
                });
            });
        });
    });



module.exports = router;
