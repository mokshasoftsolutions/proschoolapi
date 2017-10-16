// flow
var express = require("express");
var config = require("../config.json");
var bodyParser = require("body-parser");
var api_key = "api-key-KJFSI4924R23RFSDFSD7F94";
var mongo = require('mongodb').MongoClient;
var autoIncrement = require("mongodb-autoincrement");
var assert = require('assert');
var multer = require('multer');
var xlstojson = require("xls-to-json-lc");
var xlsxtojson = require("xlsx-to-json-lc");
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

// Add Exams

router.route('/exams/:subject_id/:exam_sch_id/:class_id/:section_id')
    .post(function(req, res, next) {
        var status = 1;
        var subject_id = req.params.subject_id;
        var exam_sch_id = req.params.exam_sch_id;
        var class_id = req.params.class_id;
        var section_id = req.params.section_id;
        subjects = [];
        var item = {
            exam_paper_id: 'getauto',
            subject_id: subject_id,
            exam_sch_id: exam_sch_id,
            subject_name:req.body.subject_name,
            exam_paper_title: req.body.exam_paper_title,
            date: req.body.date,
            start_time: req.body.start_time,
            end_time: req.body.end_time,
            max_marks: req.body.max_marks,
            section_id:section_id,
            class_id:class_id,
            status: status,
        };
        mongo.connect(url, function(err, db) {
            autoIncrement.getNextSequence(db, 'exams', function(err, autoIndex) {
                var collection = db.collection('exams');
                collection.ensureIndex({
                    "exam_paper_id": 1,
                }, {
                    unique: true
                }, function(err, result) {
                    if (item.subject_id == null || item.exam_sch_id == null || item.exam_paper_title == null || item.date == null) {
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
                                    exam_paper_id: exam_sch_id+'-EXM-'+autoIndex
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

 router.route('/exams/:exam_sch_id/:class_id')
    .get(function(req, res, next) {
     
      var exam_sch_id = req.params.exam_sch_id;
      var class_id = req.params.class_id;
        var resultArray = [];
        mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            // var cursor = db.collection('exams').find({exam_sch_id});
                  var cursor = db.collection('exams').aggregate([{
                    $match: {
                        exam_sch_id: exam_sch_id,
                        class_id: class_id,
                        status:1
                    }
                },
                {
                    $lookup: {
                        from: "subjects",
                        localField: "subject_id",
                        foreignField: "subject_id",
                        as: "subjects"
                    }
                },
                {
                    $unwind: "$subjects"
                },
                
              {
                    $group: {
                        _id: '$_id',
                         
            "exam_paper_id": {"$first": "$exam_paper_id"},
            "subject_id": {"$first": "$subject_id"},
            "exam_sch_id": {"$first": "$exam_sch_id"},
            "exam_paper_title":{"$first":  "$exam_paper_title"},
            "date": {"$first": "$date"},
            "start_time": {"$first": "$start_time"},
            "end_time": {"$first": "$end_time"},
            "max_marks": {"$first": "$max_marks"},
            "subject_name":{"$first": "$subjects.name"},
                "class_id":{"$first":"$class_id"}     
                         
                        
                    }
                }
                ]);
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    resultArray
                });
            });
        });
    });

 router.route('/examsbysectionid/:exam_sch_id/:section_id')
    .get(function(req, res, next) {
     
      var exam_sch_id = req.params.exam_sch_id;
      var section_id = req.params.section_id;
        var resultArray = [];
        mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            // var cursor = db.collection('exams').find({exam_sch_id});
                  var cursor = db.collection('exams').aggregate([{
                    $match: {
                        exam_sch_id: exam_sch_id,
                        section_id: section_id,
                        status:1
                    }
                },
                {
                    $lookup: {
                        from: "subjects",
                        localField: "subject_id",
                        foreignField: "subject_id",
                        as: "subjects"
                    }
                },
                {
                    $unwind: "$subjects"
                },
                
              {
                    $group: {
                        _id: '$_id',
                         
            "exam_paper_id": {"$first": "$exam_paper_id"},
            "subject_id": {"$first": "$subject_id"},
            "exam_sch_id": {"$first": "$exam_sch_id"},
            "exam_paper_title":{"$first":  "$exam_paper_title"},
            "date": {"$first": "$date"},
            "start_time": {"$first": "$start_time"},
            "end_time": {"$first": "$end_time"},
            "max_marks": {"$first": "$max_marks"},
            "subject_name":{"$first": "$subjects.name"},
                "class_id":{"$first":"$class_id"}     
                         
                        
                    }
                }
                ]);
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    resultArray
                });
            });
        });
    });
    router.route('/get_exam/:exam_paper_id')
    .get(function(req, res, next) {
      var exam_paper_id = req.params.exam_paper_id;
        var resultArray = [];
        mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            var cursor = db.collection('exams').find({exam_paper_id});
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    exam: resultArray
                });
            });
        });
    });

    router.route('/exam_edit/:exam_paper_id')
        .post(function(req, res, next){
          var exam_paper_id = req.params.exam_paper_id;
          var name = req.body.name;
          var value = req.body.value;
          if (name == 'status') {
            var value = parseInt(req.body.value);
          }

          mongo.connect(url, function(err, db){
                db.collection('exams').update({exam_paper_id},{$set:{[name]: value}}, function(err, result){
                  assert.equal(null, err);
                   db.close();
                   res.send('true');
                });
          });
        });


    router.route('/exam_eval/:exam_sch_id/:exam_paper_id/:student_id/:section_id/:class_id')
        .post(function(req, res, next) {
            var status = 1;
            var exam_paper_id = req.params.exam_paper_id;
            var student_id = req.params.student_id;
            var exam_sch_id = req.params.exam_sch_id;
            var section_id = req.params.section_id;
            var class_id = req.params.class_id;
            // var date = new Date();
           // console.log(date);
            subjects = [];
            var item = {
                paper_result_id: 'getauto',
                exam_sch_id : exam_sch_id,
                exam_paper_id: exam_paper_id,
                student_id: student_id,
                class_id:class_id,
                section_id:section_id,
                // student_name:req.body.student_name,
                // exam_paper_title:req.body.exam_paper_title,
                marks: req.body.marks,
                percentage: req.body.percentage,
                conduct: req.body.conduct,
                // comment: req.body.comment,
                // date: date,
                status: status,
            }
            // mongo.connect(url, function(err, db) {
            //     autoIncrement.getNextSequence(db, 'exam_evaluation', function(err, autoIndex) {
            //       // var count = db.collection('exam_evaluation').find({ $and: [{exam_paper_id, student_id}]}).count(function (e, count){
            //       //   if (count > 0) {
            //       //     db.close();
            //       //     res.end('already submitted');
            //       //   }
            //       // });
            //         var collection = db.collection('exam_evaluation');
            //         collection.ensureIndex({
            //             "paper_result_id": 1,
            //         }, {
            //             unique: true
            //         }, function(err, result) {
            //             if (item.exam_paper_id == null || item.student_id == null || item.marks == null || item.comment == null) {
            //                 res.end('null');
            //             } else {
            //                 collection.insertOne(item, function(err, result) {
            //                     if (err) {
            //                         if (err.code == 11000) {
            //                            res.end('false');
            //                         }
            //                         res.end('false');
            //                     }
            //                     collection.update({
            //                         _id: item._id
            //                     }, {
            //                         $set: {
            //                             paper_result_id: exam_paper_id+'-EVAL-'+autoIndex
            //                         }
            //                     }, function(err, result) {
            //                         db.close();
            //                         res.end('true');
            //                     });
            //                 });
            //             }
            //         });
            //     });
            // });
            mongo.connect(url, function(err, db) {
                autoIncrement.getNextSequence(db, 'exam_evaluation', function(err, autoIndex) {
                  var count = db.collection('exam_evaluation').find({exam_paper_id, student_id}).count(function (e, count){
                  
                    if (count > 0) {
                       
                      db.close();
                      res.end('already submitted');
                    }else{
                        var collection = db.collection('exam_evaluation');
                    collection.ensureIndex({
                        "paper_result_id": 1,
                    }, {
                        unique: true
                    }, function(err, result) {
                        if (item.exam_paper_id == null || item.student_id == null || item.marks == null ) {
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
                                        paper_result_id: exam_paper_id+'-'+student_id+'-EVAL-'+autoIndex
                                    }
                                }, function(err, result) {
                                     console.log("updated");
                                    db.close();
                                    res.end('true');
                                });
                            });
                        }
                    });



                    }
                  });
                    
                });
            });

        });


  
    // router.route('/exam_eval/:exam_sch_id/:subject_id/:exam_sch_id')
    //    .get(function(req, res, next) {
    //   var subject_id = req.params.subject_id;
    //   var exam_sch_id = req.params.exam_sch_id;
    //     var resultArray = [];
    //     mongo.connect(url, function(err, db) {
    //         assert.equal(null, err);
    //         var cursor = db.collection('exams').find({subject_id, exam_sch_id});
    //         cursor.forEach(function(doc, err) {
    //             assert.equal(null, err);
    //             resultArray.push(doc);
    //         }, function() {
    //             db.close();
    //             res.send({
    //                 [exam_sch_id+'-'+subject_id]: resultArray
    //             });
    //         });
    //     });
    // });


 router.route('/exam_eval/:student_id/:exam_sch_id')
        .get(function(req, res, next) {
            // var exam_paper_id = req.params.exam_paper_id;
            var student_id = req.params.student_id;
            var exam_sch_id = req.params.exam_sch_id;
            // var subject_id = req.params.subject_id;
            var resultArray = [];
            mongo.connect(url, function(err, db) {
                assert.equal(null, err);
                var cursor = db.collection('exam_evaluation').aggregate([
                    {
                    $match: {
                        // exam_paper_id: exam_paper_id,
                        student_id:student_id,
                        exam_sch_id:exam_sch_id,
                        status:1
                    }
                    },
                    {
                        $lookup: {
                            from: "exam_schedule", 
                            localField: "exam_sch_id", 
                            foreignField: "exam_sch_id", 
                            as: "schedule_doc"
                        }
                    },
                    {
                        $unwind: "$schedule_doc"
                    },
                    {
                        $lookup: {
                            from: "students", 
                            localField: "student_id", 
                            foreignField: "student_id", 
                            as: "student_doc"
                        }
                    },
                    {
                        $unwind: "$student_doc"
                    },
                    {
                        $lookup: {
                            from: "exams", 
                            localField: "exam_paper_id", 
                            foreignField: "exam_paper_id", 
                            as: "exampaper_doc"
                        }
                    },
                    {
                        $unwind: "$exampaper_doc"
                    },
                 
                    {
                    $group: {
                        _id: '$_id',
                        first_name: {
                            "$first": "$student_doc.first_name"
                        },
                        last_name: {
                            "$first": "$student_doc.last_name"
                        },
                        student_id: {
                            "$first": "$student_id"
                        },
                        exam_paper_id: {
                            "$first": "$exam_paper_id"
                        },
                        paper_name:{
                            "$first": "$exampaper_doc.exam_paper_title"
                        },
                        exam_sch_id: {
                            "$first": "$exam_sch_id"
                        },
                        examschedule_name:{
                             "$first": "$schedule_doc.exam_title"
                        },
                        marks: {
                            "$first": "$marks"
                        },
                        percentage: {
                            "$first": "$percentage"
                        },
                        conduct: {
                            "$first": "$conduct"
                        }
                    }
                },
                ])
                cursor.forEach(function(doc, err) {
                    assert.equal(null, err);
                    resultArray.push(doc);
                }, function() {
                    db.close();
                    res.send({
                        resultArray
                    });
                });
            });
        });

      // router.route('/chk_exam_eval/:exam_paper_id/:student_id')
      // .get(function(req, res, next) {
      //   var exam_paper_id = req.params.exam_paper_id;
      //   var student_id = req.params.student_id;
      //     var resultArray = [];
      //     mongo.connect(url, function(err, db) {
      //         assert.equal(null, err);
      //         var count = db.collection('exam_evaluation').find({exam_paper_id, student_id}).count();
      //         cursor.forEach(function(doc, err) {
      //             assert.equal(null, err);
      //             resultArray.push(doc);
      //         }, function() {
      //             db.close();
      //             res.send({
      //                 count: resultArray
      //             });
      //         });
      //     });
      // });


     router.route('/edit_exam_paper/:exam_paper_id')
        .put(function(req, res, next){
          var myquery = {exam_paper_id:req.params.exam_paper_id};
          var req_subject_name = req.body.subject_name;
          var req_exam_paper_title = req.body.exam_paper_title;
          var req_date = req.body.date;
          var req_start_time= req.body.start_time;
          var req_end_time = req.body.end_time;
          var req_max_marks = req.body.max_marks;

          mongo.connect(url, function(err, db){
                db.collection('exams').update(myquery,{$set:{ subject_name:req_subject_name,
                                              exam_paper_title:req_exam_paper_title,
                                              date:req_date,
                                              start_time:req_start_time,
                                              end_time:req_end_time,
                                              max_marks:req_max_marks}}, function(err, result){
                  assert.equal(null, err);
                  if(err){
                     res.send('false'); 
                  }
                   db.close();
                   res.send('true');
                });
          });
        });


      router.route('/edit_exam_evalution/:paper_result_id')
        .put(function(req, res, next){
          var myquery = {paper_result_id:req.params.paper_result_id};
          var req_marks = req.body.marks;
          var req_percentage = req.body.percentage;
           var req_conduct = req.body.conduct;

          mongo.connect(url, function(err, db){
                db.collection('exam_evaluation').update(myquery,{$set:{ marks:req_marks,
                                              percentage:req_percentage,
                                              conduct:req_conduct}}, function(err, result){
                  assert.equal(null, err);
                  if(err){
                     res.send('false'); 
                  }
                   db.close();
                   res.send('true');
                });
          });
        });


    router.route('/delete_exam_paper/:exam_paper_id')
        .delete(function(req, res, next){
          var myquery = {paper_id:req.params.paper_id};
         
          mongo.connect(url, function(err, db){
                db.collection('exams').deleteOne(myquery,function(err, result){
                  assert.equal(null, err);
                  if(err){
                     res.send('false'); 
                  }
                   db.close();
                   res.send('true');
                });
          });
        });


    router.route('/delete_exam_evalution/:paper_result_id')
        .delete(function(req, res, next){
          var myquery = {paper_result_id:req.params.paper_result_id};
         
          mongo.connect(url, function(err, db){
                db.collection('exam_evaluation').deleteOne(myquery,function(err, result){
                  assert.equal(null, err);
                  if(err){
                     res.send('false'); 
                  }
                   db.close();
                   res.send('true');
                });
          });
        });



//  Modified
// Exams papers bulk upload via excel sheet


var storage = multer.diskStorage({ //multers disk storage settings
    destination: function(req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function(req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
    }
});

var upload = multer({ //multer settings
    storage: storage,
    fileFilter: function(req, file, callback) { //file filter
        if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
            return callback(new Error('Wrong extension type'));
        }
        callback(null, true);
    }
}).single('file');

router.route('/bulk_upload_exampapers/:subject_id/:exam_sch_id/:class_id/:section_id')
    .post(function(req, res, next) {
       var subject_id = req.params.subject_id;
        var exam_sch_id = req.params.exam_sch_id;
        var class_id = req.params.class_id;
        var section_id = req.params.section_id;       
        var status = 1;
        var exceltojson;
        upload(req, res, function(err) {
            if (err) {
                res.json({ error_code: 1, err_desc: err });
                return;
            }
            /** Multer gives us file info in req.file object */
            if (!req.file) {
                res.json({ error_code: 1, err_desc: "No file passed" });
                return;
            }
            /** Check the extension of the incoming file and 
             *  use the appropriate module
             */
            if (req.file.originalname.split('.')[req.file.originalname.split('.').length - 1] === 'xlsx') {
                exceltojson = xlsxtojson;
            } else {
                exceltojson = xlstojson;
            }
            console.log(req.file.path);
            try {
                exceltojson({
                    input: req.file.path,
                    output: null, //since we don't need output.json
                    lowerCaseHeaders: true
                }, function(err, result) {
                    if (err) {
                        return res.json({ error_code: 1, err_desc: err, data: null });
                    }
                    res.json({ data: result });
                    console.log(result[0]);
                    var test = result;
                    var count = 0;

                    if (test.length > 0) {
                        test.forEach(function(key, value) {

                    var item = {
                                exam_paper_id: 'getauto',
                                subject_id: subject_id,
                                exam_sch_id: exam_sch_id,
                                subject_name: key.subjectname,
                                exam_paper_title: key.exam_papertitle,
                                date: key.date,
                                start_time: key.starttime,
                                end_time: key.endtime,
                                max_marks: key.maxmarks,
                                section_id: section_id,
                                class_id: class_id,
                                status: status,
                            };
                            mongo.connect(url, function(err, db) {
                                autoIncrement.getNextSequence(db, 'exams', function(err, autoIndex) {

                                    var collection = db.collection('exams');
                                    collection.ensureIndex({
                                        "exam_paper_id": 1,
                                    }, {
                                        unique: true
                                    }, function(err, result) {
                                        if (item.subject_id == null || item.exam_sch_id == null || item.exam_paper_title == null || item.date == null) {
                                            res.end('null');
                                        } else {
                                            item.exam_paper_id = exam_sch_id +'-EXM-'+ autoIndex;
                                            collection.insertOne(item, function(err, result) {
                                                if (err) {
                                                    console.log(err);
                                                    if (err.code == 11000) {

                                                        res.end('false');
                                                    }
                                                    res.end('false');
                                                }
                                                count++;
                                                db.close();

                                                if (count == test.length) {
                                                    res.end('true');
                                                }


                                            });
                                        }
                                    });

                                });
                            });

                        });


                    } else {
                        res.end('false');
                    }


                });
            } catch (e) {
                res.json({ error_code: 1, err_desc: "Corupted excel file" });
            }
        })
    });



//  Modified
// Exam evaluation bulk upload via excel sheet


router.route('/bulk_upload_exam_eval/:exam_sch_id/:exam_paper_id/:student_id/:section_id/:class_id')
    .post(function(req, res, next) {
        var subject_id = req.params.subject_id;
        var status = 1;
        var exceltojson;
        upload(req, res, function(err) {
            if (err) {
                res.json({ error_code: 1, err_desc: err });
                return;
            }
            /** Multer gives us file info in req.file object */
            if (!req.file) {
                res.json({ error_code: 1, err_desc: "No file passed" });
                return;
            }
            /** Check the extension of the incoming file and 
             *  use the appropriate module
             */
            if (req.file.originalname.split('.')[req.file.originalname.split('.').length - 1] === 'xlsx') {
                exceltojson = xlsxtojson;
            } else {
                exceltojson = xlstojson;
            }
            console.log(req.file.path);
            try {
                exceltojson({
                    input: req.file.path,
                    output: null, //since we don't need output.json
                    lowerCaseHeaders: true
                }, function(err, result) {
                    if (err) {
                        return res.json({ error_code: 1, err_desc: err, data: null });
                    }
                    res.json({ data: result });
                    console.log(result[0]);
                    var test = result;
                    var count = 0;

                    if (test.length > 0) {
                        test.forEach(function(key, value) {

                     var item = {
                                paper_result_id: 'getauto',
                                exam_sch_id : exam_sch_id,
                                exam_paper_id: exam_paper_id,
                                student_id: student_id,
                                class_id:class_id,
                                section_id:section_id,                                
                                marks: key.marks,
                                percentage: key.percentage,
                                conduct: key.conduct,                                
                                status: status,
                            }
                            mongo.connect(url, function(err, db) {
                                autoIncrement.getNextSequence(db, 'exam_evaluation', function(err, autoIndex) {

                                    var collection = db.collection('exam_evaluation');
                                    collection.ensureIndex({
                                        "paper_result_id": 1,
                                    }, {
                                        unique: true
                                    }, function(err, result) {
                                        if (item.exam_paper_id == null || item.student_id == null || item.marks == null ) {
                                            res.end('null');
                                        } else {
                                            item.paper_result_id =   exam_paper_id+'-'+student_id+'-EVAL-'+ autoIndex;
                                            collection.insertOne(item, function(err, result) {
                                                if (err) {
                                                    console.log(err);
                                                    if (err.code == 11000) {

                                                        res.end('false');
                                                    }
                                                    res.end('false');
                                                }
                                                count++;
                                                db.close();

                                                if (count == test.length) {
                                                    res.end('true');
                                                }


                                            });
                                        }
                                    });

                                });
                            });

                        });


                    } else {
                        res.end('false');
                    }


                });
            } catch (e) {
                res.json({ error_code: 1, err_desc: "Corupted excel file" });
            }
        })
    });





module.exports = router;
