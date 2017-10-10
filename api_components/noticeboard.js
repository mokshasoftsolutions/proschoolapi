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
            time : req.body.time,
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


router.route('/noticeboard_details/:messages_id')
     .get(function(req, res, next) {
        var messages_id= req.params.messages_id;
        var status = 1;
        var resultArray = [];
          mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            var cursor = db.collection('noticeboard').find({messages_id});
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    noticeboard: resultArray
                });
            });
        });
    }); 


 // Modified 
 // delete NoticeBoard

   router.route('/delete_notice_board/:messages_id')
        .delete(function(req, res, next){
          var myquery = {messages_id:req.params.messages_id};
         
          mongo.connect(url, function(err, db){
                db.collection('noticeboard').deleteOne(myquery,function(err, result){
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
