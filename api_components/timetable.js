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

// Add Timetable

router.route('/class_timetable/:section_id/:subject_id')
    .post(function(req, res, next) {
        var status = 1;
        var section_id = req.params.section_id;
        var subject_id = req.params.subject_id;
         var Day =['sunday','monday','tuesday','wednesday','thrusday','friday','saturday'];
        var day = req.body.day;
         day = Day[day-1];
                    //   if (day == 1)
                    //     day = Day[0];
                    // else  if (day == 2)
                    
                    //     day = Day[1];
                    // else if (day == 3)
                    //     day = Day[2];
                    // else if (day == 4)
                    //     day  = Day[3];
                    // else if (day == 5)
                    //     day = Day[4];
                    // else if (day == 6)
                    //     day = Day[5];
                    // else if (day == 7)
                    //     day = Day[6];          

        var item = {
                        timetable_id: 'getauto',
                        section_id: section_id,
                        day: day,
						start_time: req.body.start_time,
						end_time: req.body.end_time,
						room_no: req.body.room_no,
                        subject_id: subject_id,
                        status: status,
        }
        mongo.connect(url, function(err, db) {
            autoIncrement.getNextSequence(db, 'timetable', function(err, autoIndex) {
                var collection = db.collection('timetable');
                collection.ensureIndex({
                    "timetable_id": 1,
                }, {
                    unique: true
                }, function(err, result) {
                    if (item.subject_id == null) {
                        res.end('null');
                    } else {
                        collection.insertOne(item, function(err, result) {
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
                                    timetable_id: section_id+'-TTBL-'+autoIndex
                                }
                            }, function(err, result) {
                                db.close();
                                res.end('true');
                            });
                        });
                    }
                });
            });
        });
    })
router.route('/class_timetable/:subject_id')
    .get(function(req, res, next) {
        var resultArray = [];

				//var section_id = req.params.section_id;
                var subject_id = req.params.subject_id;
               


        mongo.connect(url, function(err, db) {
            assert.equal(null, err);

             var cursor = db.collection('timetable').aggregate([
                    { "$lookup": { 
                        "from": "subjects", 
                        "localField": "subject_id", 
                        "foreignField": "subject_id", 
                        "as": "subject_doc"
                    }}, 
                    { "$unwind": "$subject_doc" },

                    { "$redact": { 
                        "$cond": [
                            { "$eq": [ subject_id, "$subject_doc.subject_id" ] }, 
                            "$$KEEP", 
                            "$$PRUNE"
                        ]
                    }}, 
                     

                    { "$project": { 
                        "_id": "$_id",
                        "timetable_id": "$timetable_id",
                        "section_id": "$section_id", 
                        "day": "$day",
                        "start_time": "$start_time",
                        "end_time": "$end_time",
                        "room_no": "$room_no",
                        "subject_id": "$subject_id",
                        "name": "$subject_doc.name", 
                       
                          
                     }}
                ])
            // var cursor = db.collection('timetable').find({section_id});
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    timetable: resultArray
                });
            });
        });
    });

    router.route('/class_timetables/:section_id')
    .get(function(req, res, next) {
        var resultArray = [];

                //var section_id = req.params.section_id;
                var section_id = req.params.section_id;
               


        mongo.connect(url, function(err, db) {
            assert.equal(null, err);

             var cursor = db.collection('timetable').aggregate([
                    { "$lookup": { 
                        "from": "subjects", 
                        "localField": "subject_id", 
                        "foreignField": "subject_id", 
                        "as": "subject_doc"
                    }}, 
                    { "$unwind": "$subject_doc" },

                    { "$redact": { 
                        "$cond": [
                            { "$eq": [ section_id, "$section_id" ] }, 
                            "$$KEEP", 
                            "$$PRUNE"
                        ]
                    }}, 
                     

                    { "$project": { 
                        "_id": "$_id",
                        "timetable_id": "$timetable_id",
                        "section_id": "$section_id", 
                        "day": "$day",
                        "start_time": "$start_time",
                        "end_time": "$end_time",
                        "room_no": "$room_no",
                        "subject_id": "$subject_id",
                        "name": "$subject_doc.name", 
                       
                          
                     }}
                ])
            // var cursor = db.collection('timetable').find({section_id});
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    timetable: resultArray
                });
            });
        });
    });


module.exports = router;