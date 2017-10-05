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

// Add Notice board messages

router.route('/noticeboard/:school_id')
    .post(function(req, res, next) {
        var status = 1;
        var school_id = req.params.school_id;
       
        
        var item = {
            messages_id: 'getauto',          
            messages: req.body.messages,
            school_id:school_id,
            subject : req.body.subject,
            date:req.body.date,
            status: status
           };
        mongo.connect(url, function(err, db) {
            autoIncrement.getNextSequence(db,'noticeboard', function(err, autoIndex) {
                var collection = db.collection('noticeboard');
                collection.ensureIndex({
                    "messages_id": 1,
                }, {
                    unique: true
                }, function(err, result) {
                    if (item.messages == null) {
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
                                    messages_id: 'MESSAGES-'+autoIndex
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
         school_id= req.params.school_id,
      mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            var cursor = db.collection('noticeboard').find({school_id});
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                   messages : resultArray
                });
            });
        });
    });

  
        


module.exports = router;


// { title: 'Long Event', start: new Date(y, m, d - 5), end: new Date(y, m, d - 2) },
// { id: 999, title: 'Repeating Event', start: new Date(y, m, d - 3, 16, 0), allDay: false },
// { id: 999, title: 'Repeating Event', start: new Date(y, m, d + 4, 16, 0), allDay: false },
// { title: 'Birthday Party', start: new Date(y, m, d + 1, 19, 0), end: new Date(y, m, d + 1, 22, 30), allDay: false },
// { title: 'Click for Google', start: new Date(y, m, 28), end: new Date(y, m, 29), url: 'http://google.com/' }