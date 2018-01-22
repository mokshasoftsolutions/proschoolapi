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
var url = 'mongodb://' + config.dbhost + ':27017/s_erp_data';
var parentUserModule = require('../api_components/parent_user_save');
var cookieParser = require('cookie-parser');
var parentModule = function () { };
parentModule.prototype.parent = function (parents_account,res,next) {
    //  console.log(parents_account[0]);
    var prents_length = parents_account.length;
    var count = 0;
    if (parents_account.length > 0) {
        forEach(parents_account, function (key, value) {
            if (key.parent_account_new == 'TRUE') {
                var status = 1;
                var parent_name = key.name;
                var school_id = key.school_id;
                var student_id = key.student_id;
                var class_id = key.class_id;
                var section_id = key.section_id;
                var students = { student_id: student_id, class_id: class_id, section_id: section_id };
                //console.log(students);
                var item = {
                    parent_id: 'getauto',
                    parent_name: parent_name,
                    school_id: school_id,
                    status: status,
                }

                mongo.connect(url, function (err, db) {
                    autoIncrement.getNextSequence(db, 'parents', function (err, autoIndex) {
                        // var data = db.collection('assignment_marks').find({
                        //     section_id: section_id,
                        //     assignment_id: assignment_id
                        // }).count(function (e, triggerCount) {
                        //     if (triggerCount > 0) {
                        //         db.close();
                        //         res.end('false');
                        //     } else {
                        var collection = db.collection('parents');
                        collection.ensureIndex({
                            "parent_id": 1,
                        }, {
                                unique: true
                            }, function (err, result) {
                                if (item.parent_name == null || section_id == null || student_id == null) {
                                    res.end('null');
                                } else {
                                    item.parent_id = school_id + '-PARENT-' + autoIndex;
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
                                                $push: {
                                                    students
                                                }
                                            }, function (err, result) {
                                                // db.close();
                                                // res.end('true');
                                                var userData = {};
                                                userData.email = school_id + '-PARENT-' + autoIndex;
                                                userData.password = school_id + '-PARENT-' + autoIndex;
                                                userData.uniqueId = school_id + '-PARENT-' + autoIndex;
                                                userData.role = "parent";
                                                userData.school_id = school_id;
                                                // console.log(userData);
                                                parentUserModule.parentUserModuleSave(userData);
                                            });
                                        count++;
                                        db.close();

                                        if (count == parents_account.length) {
                                           // res.send('true');
                                        }
                                    });
                                }
                            });
                        //     }
                        // });
                    });
                });
            }
            else if (key.parent_account_new == 'FALSE') {
                var parent_id = key.parent_id;
                var student_id = key.student_id;
                mongo.connect(url, function (err, db) {
                    var collection = db.collection('parents');
                    collection.update({
                        "parent_id": parent_id
                    }, {
                            "$addToSet": {
                                "students": {
                                    student_id: student_id
                                }
                            }
                        },
                        function (err, numAffected) {
                            if (err) {
                                //    console.log(err);
                            }

                            if (numAffected.result.nModified == 1) {
                                //   console.log("true");
                            } else {
                                //    console.log("false");
                            }
                        });
                });

            }
        });

    } else {
        res.end('false');
    }


}
parentModule.prototype.addParent = function (request) {
    //   console.log("hemu");
    var status = 1;
    var parent_name = request.name;
    var school_id = request.school_id;
    var student_id = request.student_id;
    var class_id = request.class_id;
    var section_id = request.section_id;
    var students = { student_id: student_id, class_id: class_id, section_id: section_id };
    //console.log(students);
    var item = {
        parent_id: 'getauto',
        parent_name: parent_name,
        school_id: school_id,
        status: status,
    }
    mongo.connect(url, function (err, db) {
        autoIncrement.getNextSequence(db, 'parents', function (err, autoIndex) {
            var collection = db.collection('parents');
            collection.ensureIndex({
                "parent_id": 1,
            }, {
                    unique: true
                }, function (err, result) {
                    collection.insertOne(item, function (err, result) {
                        if (err) {
                            if (err.code == 11000) {
                                //  res.end('code false');  
                                // console.log(err);                                                                                                  
                            }
                            // res.end('false');
                            //  console.log(err);
                        }
                        collection.update({
                            _id: item._id
                        }, {
                                $set: {
                                    parent_id: school_id + '-PARENT-' + autoIndex
                                },
                                $push: {
                                    students
                                }
                            }, function (err, result) {
                                // db.close();
                                // res.end('true');
                                var userData = {};
                                userData.email = school_id + '-PARENT-' + autoIndex;
                                userData.password = school_id + '-PARENT-' + autoIndex;
                                userData.uniqueId = school_id + '-PARENT-' + autoIndex;
                                userData.role = "parent";
                                userData.school_id = school_id;
                                // console.log(userData);
                                parentUserModule.parentUserModuleSave(userData);
                            });
                    });

                });
        });
    });
}
parentModule.prototype.addStudentToParent = function (request) {

    var parent_id = request.parent_id;
    var student_id = request.student_id;
    mongo.connect(url, function (err, db) {
        var collection = db.collection('parents');
        collection.update({
            "parent_id": parent_id
        }, {
                "$addToSet": {
                    "students": {
                        student_id: student_id
                    }
                }
            },
            function (err, numAffected) {
                if (err) {
                    //    console.log(err);
                }

                if (numAffected.result.nModified == 1) {
                    //   console.log("true");
                } else {
                    //    console.log("false");
                }
            });
    });
}
module.exports = new parentModule();
