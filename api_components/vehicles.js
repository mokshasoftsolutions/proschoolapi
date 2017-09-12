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
var ObjectID = require('mongodb').ObjectID;   
var url = 'mongodb://' + config.dbhost + ':27017/s_erp_data';

var cookieParser = require('cookie-parser');
router.use(function(req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
});

// Add Vehicles

router.route('/vehicles/:school_id')
    .post(function(req, res, next) {
        var status = 1;
         var school_id = req.params.school_id;
        var item = {
            vehicle_id : 'getauto',
            vehicle_code: req.body.vehicle_code,
            vehicle_name: req.body.vehicle_name,
            school_id: school_id,
            status : status 
        };
     
            mongo.connect(url, function(err, db) {
                autoIncrement.getNextSequence(db, 'vehicles', function(err, autoIndex) {
                    var collection = db.collection('vehicles');
                    collection.ensureIndex({
                        "vehicle_id": 1,
                    }, {
                        unique: true
                    }, function(err, result) {
                        if (item.vehicle_code == null || item.vehicle_name == null || item.school_id == null) {
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
                                        vehicle_id: 'VCL-'+autoIndex
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
        var school_id= req.params.school_id;
        var status = 1;
        var resultArray = [];
          mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            var cursor = db.collection('vehicles').find({school_id,status});
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    vehicles: resultArray
                });
            });
        });
    });

    router.route('/vehicle/:vehicle_id')
    .get(function(req, res, next){
      var _id = new ObjectID(req.params.vehicle_id);
      var resultArray = [];
      
          mongo.connect(url, function(err, db){
          assert.equal(null, err);
          var cursor = db.collection('vehicles').find({_id});
             cursor.forEach(function(doc, err){
              resultArray.push(doc);
               }, function(){
                db.close();
                res.send(resultArray[0]);
          });
      });
    });
 
 router.route('/vehicle_edit/:vehicle_id')
        .put(function(req, res, next){
          var _id = new ObjectID(req.params.vehicle_id);
          var req_vehicle_code = req.body.vehicle_code;
          var req_vehicle_name = req.body.vehicle_name;
   
          mongo.connect(url, function(err, db){
                db.collection('vehicles').update({_id},{$set:{vehicle_code:req_vehicle_code,vehicle_name:req_vehicle_name}}, function(err, result){
                  assert.equal(null, err);
                  if(err){
                     res.send('false'); 
                  }
                   db.close();
                   res.send('true');
                });
          });
        });

        router.route('/vehicle_delete/:vehicle_id')
        .put(function(req, res, next){
          var _id = new ObjectID(req.params.vehicle_id);
          var req_status = 0;
   
          mongo.connect(url, function(err, db){
                db.collection('vehicles').update({_id},{$set:{status:req_status}}, function(err, result){
                  assert.equal(null, err);
                  if(err){
                     res.send('false'); 
                  }
                   db.close();
                   res.send('true');
                });
          });
        });


  router.route('/edit_vehicle/:vehicle_id')
        .put(function(req, res, next){
          var myquery = {vehicle_id:req.params.vehicle_id};
          var req_vehicle_name = req.body.vehicle_name;
          var req_vehicle_code = req.body.vehicle_code;
                  
          mongo.connect(url, function(err, db){
                db.collection('vehicles').update(myquery,{$set:{vehicle_name:req_vehicle_name,
                                              vehicle_code:req_vehicle_code}}, function(err, result){
                  assert.equal(null, err);
                  if(err){
                     res.send('false'); 
                  }
                   db.close();
                   res.send('true');
                });
          });
        });



      router.route('/delete_vehicle/:vehicle_id')
        .delete(function(req, res, next){
          var myquery = {vehicle_id:req.params.vehicle_id};
         
          mongo.connect(url, function(err, db){
                db.collection('vehicles').deleteOne(myquery,function(err, result){
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





 // collection = db.collection('entries');
 //    for (i = 0; i < entries.length; i++) {
 //        collection.insert(entries[i].entry);
 //    }
 //    db.close();