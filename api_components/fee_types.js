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

// fee types

router.route('/feetypes/:school_id')
    .post(function(req, res, next) {
        var status = 1;
        var fee_fine = 0;
        var fee_discount = 0;
        var item ={
             fee_id : 'getauto',
             school_id : req.params.school_id,
             fee_category : req.body.fee_category,
             fee_type : req.body.fee_type,
             class_id : req.body.class_id,
             fee_amount : req.body.fee_amount,
             fee_description : req.body.fee_description,
             fee_due_date : req.body.fee_due_date,
             fee_fine : fee_fine,
             fee_discount : fee_discount,
             status : status,

        }
         
        // mongo.connect(url, function(err, db) {
            
        //         var collection = db.collection('fee_types');
                 
        //             if (item.school_id == null || item.fee_category == null || item.fee_type == null || item.class_id == null || item.fee_amount == null ) {
        //                 res.end('null');
        //             } else {
        //                 collection.insertOne(item, function(err, result) {
        //                     if (err) {
        //                         if (err.code == 11000) {
        //                             res.end('false');
        //                         }
        //                         res.end('false');
        //                     }
        //                     db.close();
        //                     res.send('true');
                            
        //                 });
        //             }
                  
        // });

         mongo.connect(url, function(err, db) {
            autoIncrement.getNextSequence(db, 'fee_types', function(err, autoIndex) {
                var collection = db.collection('fee_types');
                collection.ensureIndex({
                    "fee_id": 1,
                }, {
                    unique: true
                }, function(err, result) {
                    if (item.school_id == null || item.fee_category == null || item.fee_type == null || item.class_id == null || item.fee_amount == null) {
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
                                    fee_id: 'FEE-'+autoIndex
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
        var school_id = req.params.school_id;
        var resultArray = [];
        mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            var cursor = db.collection('fee_types').find({school_id});
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    feetypes: resultArray
                });
            });
        });
    });

    router.route('/feetypes/:school_id/:class_id')
      .get(function(req, res, next) {
        var school_id = req.params.school_id;
        var class_id = req.params.class_id;
        var resultArray = [];
        mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            var cursor = db.collection('fee_types').find({school_id,class_id});
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    feetypes: resultArray
                });
            });
        });
    });
 
 // Fee Types
router.route('feetypes')
    .post(function(req, res, next) {
       var status = 1;
       var item = {
        fee_types_id : 'getauto',
        fee_type : req.body.fee_type,
        fee_category : req.body.fee_category,
        status : status,
       }

         mongo.connect(url, function(err, db) {
            autoIncrement.getNextSequence(db, 'fee_type', function(err, autoIndex) {
                var collection = db.collection('fee_type');
                collection.ensureIndex({
                    "fee_types_id": 1,
                }, {
                    unique: true
                }, function(err, result) {
                    if (item.fee_type == null || item.fee_category == null) {
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
                                    fee_types_id: 'FeeTypes-'+autoIndex
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
            var cursor = db.collection('fee_type').find();
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    feetypes: resultArray
                });
            });
        });
    });




  
 //Add student fees
 
router.route('/student/feecollect/:school_id/:student_id')
    .post(function(req, res, next) {
       var status = 1;
       var academic_year = "2016-2017";
       var fee_status = "unpaid";
       var school_id = req.params.school_id;
       var student_id= req.params.student_id;
       var class_id = req.body.class_id;
       var section_id = req.body.section_id;
       var fee_type_id=req.body.fee_type_id;
         var  item = {
                    school_id : school_id,
                    student_id: student_id,
                    class_id : class_id,
                    section_id : section_id,
                    fee_category : req.body.fee_category,
                    fee_type : req.body.fee_type,
                    fee_amount : req.body.fee_amount,
                    fee_fine:req.body.fee_fine,
                    fee_discount:req.body.fee_discount,
                    fee_total:req.body.fee_total,
                    fee_status: fee_status,
                    fee_type_id:fee_type_id,
                    fee_description : req.body.fee_description,
                    fee_due_date : req.body.fee_due_date,
                    fee_paid_on : new Date(),
                    academic_year:academic_year,
                    status:status
                    
           }
          
         
        mongo.connect(url, function(err, db) {
             var collection = db.collection('student_fee');
                  if (item.school_id == null || item.student_id == null || item.class_id == null || item.section_id == null || item.fee_type_id == null ||item.fee_category == null ||item.fee_total == null   ) {
                        res.end('null');
                    } else {
                            
                        db.collection('student_fee').find({school_id,student_id,fee_type_id,class_id,section_id}).toArray(function (err, items) {
                            
                            if(items.length > 0){
                            res.end('false');
                            }else{
                               collection.insertOne(item, function(err1, result1) {
                                                     if (err1) {
                                                        if (err1.code == 11000) {
                                                            res.end('false');
                                                        }
                                                        res.end('false');
                                                    }
                                                    db.close();
                                                    res.send('true');
                                  });
                            }  
                     })
                 }
         });
   })
    .get(function(req, res, next) {
        var school_id = req.params.school_id;
        var student_id = req.params.student_id;
        var resultArray = [];
        mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            var cursor = db.collection('student_fee').find({school_id,student_id});
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    Student_fee: resultArray
                });
            });
        });
    });



     router.route('/edit_fee/:fee_id')
        .put(function(req, res, next){
          var myquery = {fee_id:req.params.fee_id};
          var req_fee_category = req.body.fee_category;
          var req_fee_type = req.body.fee_type;
          //var req_class_id = req.body.class_id;
          var req_fee_amount = req.body.fee_amount;
          var req_fee_description = req.body.fee_description;
          var req_fee_fine = req.body.fee_fine;
          var req_fee_due_date = req.body.fee_due_date;
          var req_fee_discount = req.body.fee_discount;

          mongo.connect(url, function(err, db){
                db.collection('fee_types').update(myquery,{$set:{ fee_category:req_fee_category,
                                              fee_type:req_fee_type,
                                              fee_amount:req_fee_amount,
                                              fee_fine:req_fee_fine,
                                              fee_description:req_fee_description,
                                              fee_fine:req_fee_due_date,                                              
                                              fee_discount:req_fee_discount}}, function(err, result){
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
