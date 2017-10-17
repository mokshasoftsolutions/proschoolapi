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
router.use(function(req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
});

 //List parents
 router.route('/getparentlist/:schoolid')
.get(function(req, res, next) {
    var school_id = req.params.schoolid;
   // var section_id=req.params.sectionid;
        var parents = [];
        mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            var cursor = db.collection('parents').find({school_id:school_id});
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                parents.push(doc);
            }, function() {
                db.close();
                res.send({
                    parents: parents
                });
            });
        });
    });

    //get Students by parent id
 router.route('/getstudentsbyparentid/:parentid')
.get(function(req, res, next) {
    var parent_id = req.params.parentid;
        var parents = [];
        mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            var cursor = db.collection('parents').find({parent_id:parent_id,status:1});
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                parents.push(doc);
            }, function() {
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



module.exports = router;
