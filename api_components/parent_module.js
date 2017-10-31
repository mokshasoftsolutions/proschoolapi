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
var parentUserModule = require('../api_components/parent_user_save');
var cookieParser = require('cookie-parser');
var parentModule = function () { };
parentModule.prototype.addParent = function (request) {
    var status = 1;
    var parent_name = request.name;
    var school_id = request.school_id;
    var student_id = request.student_id;
    var students = { student_id: student_id };
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
                                // res.end('false');
                            }
                            // res.end('false');
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
