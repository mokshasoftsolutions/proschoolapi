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

// Add School Events
router.route('/schoolevents/:school_id')
    .post(function(req, res, next) {
        var status = 1;
        var school_id = req.params.school_id;
        
        var item = {
            school_event_id: 'getauto',
            school_id: school_id,
            event_title: req.body.event_title,
            date:req.body.date,
            time:req.body.time,
            description:req.body.description,
            status: status

        };
        mongo.connect(url, function(err, db) {
            autoIncrement.getNextSequence(db,'schoolevents', function(err, autoIndex) {
                var collection = db.collection('schoolevents');
                collection.ensureIndex({
                    "school_event_id": 1,
                }, {
                    unique: true
                }, function(err, result) {
                    if (item.event_title == null) {
                        res.end('null');
                    } else {
                        collection.insertOne(item, function(err, result) {
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
                                    school_event_id: 'SCHOOL_EVENT-'+autoIndex
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
    .get(function(req, res, next) {
        var resultArray = [];
         var school_id = req.params.school_id;
         

        mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            var cursor = db.collection('schoolevents').find({school_id});
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    school_events: resultArray
                });
            });
        });
    });

  
        


module.exports = router;
