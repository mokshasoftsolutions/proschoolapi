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

router.route('/station_to_bus_route/:route_id/:station_id')
    .post(function(req, res, next) {
        var status = 1;
        var route_id = req.params.route_id;
        var station_id = req.params.station_id;
        var item = {
            bus_route_id: 'getauto',
            route_id: route_id,
            station_id: station_id,
						pickup_time: req.body.pickup_time,
						dropping_time: req.body.dropping_time,
            status: status,
        }
        mongo.connect(url, function(err, db) {
            autoIncrement.getNextSequence(db, 'station_bus_routes', function(err, autoIndex) {
                var collection = db.collection('station_bus_routes');
                collection.ensureIndex({
                    "bus_route_id": 1,
                }, {
                    unique: true
                }, function(err, result) {
                    if (item.route_id == null) {
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
                                    bus_route_id: 'BUS_ROUTE-'+autoIndex
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
        mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            var cursor = db.collection('station_bus_routes').find();
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    station_bus_routes: resultArray
                });
            });
        });
    });




// router.route('/addingparent/:schoolid')
//     .post(function(req, res, next) {
//         var status = 1;
//         var parent_name = "test";
//         var schoolid = req.params.schoolid;
       
//         var item = {
//             parent_id: 'getauto',
//             parent_name: parent_name,
//             status: status,
//         }
//         mongo.connect(url, function(err, db) {
//             autoIncrement.getNextSequence(db, 'parents', function(err, autoIndex) {
//                 var collection = db.collection('parents');
//                 collection.ensureIndex({
//                     "parent_id": 1,
//                 }, {
//                     unique: true
//                 }, function(err, result) {
                   
//                         collection.insertOne(item, function(err, result) {
//                             if (err) {
//                                 if (err.code == 11000) {
//                                     res.end('false');
//                                 }
//                                 res.end('false');
//                             }
//                             collection.update({
//                                 _id: item._id
//                             }, {
//                                 $set: {
//                                     parent_id:  schoolid+'-PARENT-'+autoIndex
//                                 }
//                             }, function(err, result) {
//                                 db.close();
//                                 res.end('true');
//                             });
//                         });
                    
//                 });
//             });
//         });
//     })

//     .get(function(req, res, next) {
//         var resultArray = [];
//         mongo.connect(url, function(err, db) {
//             assert.equal(null, err);
//             var cursor = db.collection('parents').find();
//             cursor.forEach(function(doc, err) {
//                 assert.equal(null, err);
//                 resultArray.push(doc);
//             }, function() {
//                 db.close();
//                 res.send({
//                     parents: resultArray
//                 });
//             });
//         });
//     });
module.exports = router;
