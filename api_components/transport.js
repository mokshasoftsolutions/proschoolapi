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

router.route('/transport_stations/:school_id')
    .post(function(req, res, next) {
        var status = 1;
        var school_id = req.params.school_id;
        var item = {
            station_id: 'getauto',
            school_id: school_id,
						station_name: req.body.station_name,
						station_code: req.body.station_code,
						station_geo_location: req.body.station_geo_location,
            status: status,
        }
        mongo.connect(url, function(err, db) {
            autoIncrement.getNextSequence(db, 'transport', function(err, autoIndex) {
                var collection = db.collection('transport');
                collection.ensureIndex({
                    "station_id": 1,
                }, {
                    unique: true
                }, function(err, result) {
                    if (item.station_name == null) {
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
                                    station_id: 'STN-'+autoIndex

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
            var cursor = db.collection('transport').find();
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    stations: resultArray
                });
            });
        });
    });

 router.route('/edit_station/:station_id')
        .put(function(req, res, next){
          var myquery = {station_id:req.params.station_id};
          var req_station_name = req.body.station_name;
          var req_station_code = req.body.station_code;
          var req_station_geolocation = req.body.station_geo_location; 
   
          mongo.connect(url, function(err, db){
                db.collection('transport').update(myquery,{$set:{station_name:req_station_name,station_code:req_station_code,station_geo_location:req_station_geolocation}}, function(err, result){
                  assert.equal(null, err);
                  if(err){
                     res.send('false'); 
                  }
                   db.close();
                   res.send('true');
                });
          });
        });


    router.route('/delete_station/:station_id')
        .delete(function(req, res, next){
          var myquery = {station_id:req.params.station_id};
         
          mongo.connect(url, function(err, db){
                db.collection('transport').deleteOne(myquery,function(err, result){
                  assert.equal(null, err);
                  if(err){
                     res.send('false'); 
                  }
                   db.close();
                   res.send('true');
                });
          });
        });


module.exports = router;


