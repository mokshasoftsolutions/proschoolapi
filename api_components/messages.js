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

// Add Timetable

router.route('/messages')
    .post(function (req, res, next) {
        var status = 1;
        var date = new Date();
        var receivers = req.body.receivers;
        var item = {
            message_id: 'getauto',
            sender_id: req.body.sender_id,
            sender_name: req.body.sender_name,
            date: date,
            status: status,
        }
        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'messages', function (err, autoIndex) {
                var collection = db.collection('messages');
                collection.ensureIndex({
                    "message_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.subject_id == null) {
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
                                            message_id: '-MSG-' + autoIndex
                                        },
                                        $push: {
                                            receivers
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
router.route('/messages/:receivers')
    .get(function (req, res, next) {
        var resultArray = [];
        var receivers = req.params.receivers;
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('messages').find({ receivers });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    messages: resultArray
                });
            });
        });
    });


module.exports = router;