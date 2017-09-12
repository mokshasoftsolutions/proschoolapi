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

// Add Schools

router.route('/subjects/:section_id')
    .post(function(req, res, next) {
        var status = 1;
        var section_id = req.params.section_id;
        subjects = [];
        var item = {
            subject_id: 'getauto',
            section_id: section_id,
            name: req.body.name,
        };
        mongo.connect(url, function(err, db) {
            autoIncrement.getNextSequence(db, 'subjects', function(err, autoIndex) {
                var collection = db.collection('subjects');
                collection.ensureIndex({
                    "subject_id": 1,
                }, {
                    unique: true
                }, function(err, result) {
                    if (item.name == null) {
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
                                    subject_id: section_id+'-SUB-'+autoIndex
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
        var section_id = req.params.section_id;
        mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            var cursor = db.collection('subjects').find({section_id});
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    subjects: resultArray
                });
            });
        });
    });

    router.route('/get_subject_ids/:section_id')
    .get(function(req, res, next){
      var section_id = req.params.section_id;
      var resultArray = [];
      mongo.connect(url, function(err, db){
        assert.equal(null, err);
        var cursor = db.collection('subjects').aggregate([
          {$match:{section_id}},
          {$group: {
            _id: '$section_id', subject_ids: {$push: '$subject_id'}
            }
          }
        ]);
        cursor.forEach(function(doc, err){
          resultArray.push(doc);
        }, function(){
          db.close();
          res.send(resultArray[0]);
        });
      });
    });

    router.route('/get_subject_name/:subject_id')
    .get(function(req, res, next){
      var subject_id = req.params.subject_id;
      var resultArray = [];
      mongo.connect(url, function(err, db){
        assert.equal(null, err);
        var cursor = db.collection('subjects').aggregate([
          {$match:{subject_id}},
          {$group: {
            _id: '$subject_id', subject_names: {$push: '$name'}
            }
          }
        ]);
        cursor.forEach(function(doc, err){
          resultArray.push(doc);
        }, function(){
          db.close();
          res.send(resultArray[0]);
        });
      });
    });

    router.route('/subject_edit/:subject_id/:name/:value')
        .post(function(req, res, next){
          var subject_id = req.params.subject_id;
          var name = req.params.name;
          var value = req.params.value;
          mongo.connect(url, function(err, db){
                db.collection('subjects').update({subject_id},{$set:{[name]: value}}, function(err, result){
                  assert.equal(null, err);
                   db.close();
                   res.send('true');
                });
          });
        });


    router.route('/edit_subjects/:subject_id')
        .put(function(req, res, next){
          var myquery = {subject_id:req.params.subject_id};
          var req_name = req.body.name;
          
          
          mongo.connect(url, function(err, db){
                db.collection('subjects').update(myquery,{$set:{name:req_name}}, function(err, result){
                  assert.equal(null, err);
                  if(err){
                     res.send('false'); 
                  }
                   db.close();
                   res.send('true');
                });
          });
        });
     

    router.route('/delete_subjects/:subject_id')
        .delete(function(req, res, next){
          var myquery = {subject_id:req.params.subject_id};
         
          mongo.connect(url, function(err, db){
                db.collection('subjects').deleteOne(myquery,function(err, result){
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
