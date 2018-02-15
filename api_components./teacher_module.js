// flow

var express = require("express");
var config = require("../config.json");
var bodyParser = require("body-parser");
var api_key = "api-key-KJFSI4924R23RFSDFSD7F94";
var mongo = require('mongodb').MongoClient;
var autoIncrement = require("mongodb-autoincrement");
var assert = require('assert');
var port = process.env.PORT || 4005;
var forEach = require('async-foreach').forEach;
var router = express.Router();
var url = 'mongodb://' + config.dbhost + ':27017/s_erp_data';
var teacherUserModule = require('../api_components/teacher_user_save');
var cookieParser = require('cookie-parser');
var teacherModule = function () { };
teacherModule.prototype.teacher = function (teachers_account,res,next) {
     // console.log(teachers_account[0]);
    // var prents_length = parents_account.length;
    var count = 0;
    if (teachers_account.length > 0) {
        forEach(teachers_account, function (key, value) {
            // if (key.teachers_account == 'TRUE') {
            var status = 1;
            var teacher_name = key.name;
            var school_id = key.school_id;
            var splited = school_id.split("-");
            var teacherId = splited[1];
            var employee_id = key.employee_id;
            var joined_on = key.joined_on;

            var item = {
                teacher_id: 'getauto',
                teacher_name: teacher_name,
                school_id: school_id,
                employee_id: employee_id,
                joined_on: joined_on,
                status: status,
            }

            mongo.connect(url, function (err, db) {
                autoIncrement.getNextSequence(db, 'teachers', function (err, autoIndex) {
                    var collection = db.collection('teachers');
                    collection.ensureIndex({
                        "teacher_id": 1,
                    }, {
                            unique: true
                        }, function (err, result) {
                            if (item.teacher_name == null || employee_id == null || school_id == null) {
                                res.end('null');
                            } else {
                                //   item.teacher_id = school_id + '-TCH-' + autoIndex;
                                collection.insertOne(item, function (err, result) {
                                    if (err) {
                                        console.log(err);
                                        if (err.code == 11000) {

                                            res.end('false');
                                        }
                                        res.end('false');
                                    }
                                    collection.update({
                                        _id: item._id
                                    }, {
                                            $set: {
                                                teacher_id: school_id + '-TCH-' + autoIndex
                                            },
                                        }, function (err, result) {
                                            // db.close();
                                            // res.end('true');
                                            var userData = {};
                                            userData.email = school_id + '-TCH-' + autoIndex;
                                            userData.password = school_id + '-TCH-' + autoIndex;
                                            userData.uniqueId = school_id + '-TCH-' + autoIndex;
                                            // userData.email = parentId+autoIndex;
                                            // userData.password = parentId+autoIndex;
                                            // userData.uniqueId = parentId+autoIndex;
                                            userData.role = "teacher";
                                            userData.school_id = school_id;
                                            teacherUserModule.teacherUserModuleSave(userData);
                                        });
                                    count++;
                                    db.close();

                                    if (count == teachers_account.length) {
                                        // res.send('true');
                                    }
                                });
                            }
                        });

                });
            });
            // }
            // else if (key.parent_account_new == 'FALSE') {
            //     var parent_id = key.parent_id;
            //     var student_id = key.student_id;
            //     mongo.connect(url, function (err, db) {
            //         var collection = db.collection('parents');
            //         collection.update({
            //             "parent_id": parent_id
            //         }, {
            //                 "$addToSet": {
            //                     "students": {
            //                         student_id: student_id
            //                     }
            //                 }
            //             },
            //             function (err, numAffected) {
            //                 if (err) {
            //                     //    console.log(err);
            //                 }

            //                 if (numAffected.result.nModified == 1) {
            //                     //   console.log("true");
            //                 } else {
            //                     //    console.log("false");
            //                 }
            //             });
            //     });

            // }
        });

    } else {
        res.end('false');
    }


}
teacherModule.prototype.addTeacher = function (request) {
    var status = 1;
    var teacher_name = request.name;
    var school_id = request.school_id;
    var splited = school_id.split("-");
    var teacherId = splited[1];
    var employee_id = request.employee_id;
    var joined_on = request.joined_on;
    // var students = {student_id : student_id};
    var item = {
        teacher_id: 'getauto',
        teacher_name: teacher_name,
        school_id: school_id,
        employee_id: employee_id,
        joined_on: joined_on,
        status: status,
    }
    mongo.connect(url, function (err, db) {
        autoIncrement.getNextSequence(db, 'teachers', function (err, autoIndex) {
            var collection = db.collection('teachers');
            collection.ensureIndex({
                "teacher_id": 1,
            }, {
                    unique: true
                }, function (err, result) {
                    collection.insertOne(item, function (err, result) {
                        if (err) {
                            if (err.code == 11000) {
                                // res.end('false');
                            }
                            // res.end('false');
                        }
                        collection.update({
                            _id: item._id
                        }, {
                                $set: {
                                    teacher_id: school_id + '-TCH-' + autoIndex
                                }
                            }, function (err, result) {
                                // db.close();
                                // res.end('true');
                                var userData = {};
                                userData.email = school_id + '-TCH-' + autoIndex;
                                userData.password = school_id + '-TCH-' + autoIndex;
                                userData.uniqueId = school_id + '-TCH-' + autoIndex;
                                userData.employeeId = employee_id;
                                // userData.email = parentId+autoIndex;
                                // userData.password = parentId+autoIndex;
                                // userData.uniqueId = parentId+autoIndex;
                                userData.role = "teacher";
                                userData.school_id = school_id;
                                teacherUserModule.teacherUserModuleSave(userData);
                            });
                    });

                });
        });
    });
}
// parentModule.prototype.addStudentToParent = function(request) {

//         var parent_id = request.parent_id;
//         var student_id = request.student_id;
//          mongo.connect(url, function(err, db) {
//               var collection = db.collection('parents');
//              collection.update({
//                             "parent_id": parent_id
//                         }, {
//                             "$addToSet": {
//                                 "students": {
//                                      student_id: student_id
//                                 }
//                             }
//                         },
//                         function (err, numAffected) {
//                             if (err) {
//                             //    console.log(err);
//                             }

//                             if (numAffected.result.nModified == 1) {
//                             //   console.log("true");
//                             } else {
//                             //    console.log("false");
//                             }
//                         });
//         });
// }
module.exports = new teacherModule();
