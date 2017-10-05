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

// Add Stundents

router.route('/students/:section_id')
    .post(function(req, res, next) {
        var section_id = req.params.section_id;
        var splited = section_id.split("-");
        var school_id = splited[0]+'-'+splited[1];
        var class_id = splited[0]+'-'+splited[1]+'-'+splited[2]+'-'+splited[3];
       

        var status = 1;
        var item = {
            student_id: 'getauto',
            school_id: school_id,
            class_id: class_id,
          //  class_name : class_name,
            section: section_id,
            surname: req.body.surname,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            gender: req.body.gender,
            dob: req.body.dob,
            aadhar_no: req.body.aadhar_no,
            phone: req.body.phone,
            email: req.body.email,
            category: req.body.category,
            admission_date: req.body.admission_date,
            admission_no: req.body.admission_no,
            roll_no: req.body.roll_no,
            academic_year: req.body.academic_year,
            bus_route_id: req.body.bus_route_id,
            status: status,
        };
        var current_address = {
            cur_address: req.body.cur_address,
            cur_city: req.body.cur_city,
            cur_state: req.body.cur_state,
            cur_pincode: req.body.cur_pincode,
            cur_long: req.body.cur_long,
            cur_lat: req.body.cur_lat
        };
        var permanent_address = {
            perm_address: req.body.perm_address,
            perm_city: req.body.perm_city,
            perm_state: req.body.perm_state,
            perm_pincode: req.body.perm_pincode,
            perm_long: req.body.perm_long,
            perm_lat: req.body.perm_lat
        };
        var parent_father = {
          parent_name: req.body.father_name,
          parent_contact: req.body.father_contact,
          parent_relation: 'father',
          parent_address: req.body.cur_address+' '+req.body.perm_city+' '+req.body.perm_state+' '+req.body.perm_pincode,
          occupation: req.body.father_occupation
        };
        var parent_mother = {
          parent_name: req.body.mother_name,
          parent_contact: req.body.mother_contact,
          parent_relation: 'mother',
          parent_address: req.body.cur_address+' '+req.body.perm_city+' '+req.body.perm_state+' '+req.body.perm_pincode,
          occupation: req.body.mother_occupation
        };
        var parent_gaurdian = {
          parent_name: req.body.gaurdian_name,
          parent_contact: req.body.gaurdian_contact,
          parent_relation: req.body.gaurdian_relation,
          parent_address: req.body.gaurdian_address,
          occupation: req.body.gaurdian_occupation
        };
        mongo.connect(url, function(err, db) {
            autoIncrement.getNextSequence(db, 'students', function(err, autoIndex) {
                var collection = db.collection('students');
                collection.ensureIndex({
                    "student_id": 1
                },{
                    unique: true
                }, function(err, result) {
                    if (item.section == null || item.dob == null || item.phone == null) {
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
                                  student_id: class_id+'-STD-'+autoIndex
                                },
                                $push: {
                                  current_address, permanent_address, parents:parent_father
                                }
                            }, function(err, result) {
                                db.close();
                               // res.end('true');
                                res.send({status:'true',id:class_id+'-STD-'+autoIndex});
                            });
                            collection.update({
                              _id: item._id
                            },{
                              $push:{
                                parents:parent_mother
                              }
                            });
                            collection.update({
                              _id: item._id
                            },{
                              $push:{
                                parents:parent_gaurdian
                              }
                            });
                        });
                    }
                });
                collection.ensureIndex({
                    "first_name":"text","last_name":"text"
                });
            });
        });

    })
// router.route('/students/:section_id')
//     .get(function(req, res, next) {
//         var section_id = req.params.section_id;
//         var splited = section_id.split("-");
//         var school_id = splited[0]+'-'+splited[1];
//         var class_id = splited[0]+'-'+splited[1]+'-'+splited[2]+'-'+splited[3];
//         var resultArray = [];
//         mongo.connect(url, function(err, db) {
//             assert.equal(null, err);
//             var cursor = db.collection('students').aggregate([
//                     { "$lookup": { 
//                         "from": "school_classes", 
//                         "localField": "class_id", 
//                         "foreignField": "class_id", 
//                         "as": "class_doc"
//                     }}, 
//                     { "$unwind": "$class_doc" },

//                     { "$redact": { 
//                         "$cond": [
//                             { "$eq": [ class_id, "$class_doc.class_id" ] }, 
//                             "$$KEEP", 
//                             "$$PRUNE"
//                         ]
//                     }}, 
                     

//                     { "$project": { 
//                         "_id": "$_id",
//                         "first_name": "$first_name",
//                         "last_name": "$last_name", 
//                         "class_id": "$class_id",
//                         "parents[0].parent_name": "$parents[0].parent_name",
//                         "dob": "$dob",
//                         "gender": "$gender",
//                         "category": "$category",
//                         "phone": "$phone",
//                         "name": "$class_doc.name", 
//                         "student_id":"student_id"
                          
//                      }}
//                 ])
//             cursor.forEach(function(doc, err) {
//                 assert.equal(null, err);
//                 resultArray.push(doc);
//             }, function() {
//                 db.close();
//                 res.send({
//                     students: resultArray
//                 });
//             });
//         });
//     });
router.route('/students/:section_id')
    .get(function(req, res, next) {
        var section = req.params.section_id;
        var resultArray = [];
        mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            var cursor = db.collection('students').aggregate([{
                    $match: {
                        section: section
                    }
                },
                {
                    $lookup: {
                        from: "school_classes",
                        localField: "class_id",
                        foreignField: "class_id",
                        as: "school_classes"
                    }
                },
                {
                    $unwind: "$school_classes"
                },
                
              {
                    $group: {
                        _id: '$_id',
                        school_id: {
                            "$first": "$school_id"
                        },
                        first_name: {
                            "$first": "$first_name"
                        },
                        last_name: {
                            "$first": "$last_name"
                        },
                        parents: {
                            "$first": "$parents"
                        },
                        dob: {
                            "$first": "$dob"
                        },
                        gender: {
                            "$first": "$gender"
                        },
                        category: {
                            "$first": "$category"
                        },
                        phone: {
                            "$first": "$phone"
                        },
                        name: {
                            "$first": "$school_classes.name"
                        },
                        student_id: {
                            "$first": "$student_id"
                        },
                         
                        
                    }
                }
                ]);
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    students: resultArray
                });
            });
        });
    });

router.route('/search_student/:academic_year/:class_id/:section/:search_key')
.get(function(req, res, next){
  var academic_year = req.params.academic_year;
  var class_id = req.params.class_id;
  var section = req.params.section.toUpperCase();
  var search_key = req.params.search_key;
  var resultArray = [];
  mongo.connect(url, function(err, db){
    assert.equal(null, err);
    var cursor = db.collection('students').find({academic_year,class_id,section, $text:{$search:search_key}});
    cursor.forEach(function(doc, err){
      resultArray.push(doc);
    }, function(){
      db.close();
      res.send(resultArray);
    });
  });
});

router.route('/add_parent/:student_id')
    .post(function(req, res, next){
      parents = [];
      var student_id = req.params.student_id;
      var parents = {
        parent_name: req.body.parent_name,
        parent_contact: req.body.parent_contact,
        parent_relation: req.body.parent_relation,
        occupation: req.body.occupation
      };
      mongo.connect(url, function(err, db){
            db.collection('students').update({student_id},{$push:{parents}}, function(err, result){
              assert.equal(null, err);
               db.close();
               res.send('true');
            });
      });
    });

router.route('/add_old_acadamic_details/:student_id')
    .post(function(req, res, next){
      old_acadamic_details = [];
      var student_id = req.params.student_id;
      var old_acadamic_details = {
        school_name: req.body.school_name,
        class_name: req.body.class_name,
        percentage: req.body.percentage,
        rank: req.body.rank
      };
      mongo.connect(url, function(err, db){
            db.collection('students').update({student_id},{$push:{old_acadamic_details}}, function(err, result){
              assert.equal(null, err);
               db.close();
               res.send('true');
            });
      });
    });

router.route('/student_current_address/:student_id')
    .post(function(req, res, next){
      current_address = [];
      var student_id = req.params.student_id;
      var cur_address = req.body.cur_address;
      var cur_city = req.body.cur_city;
      var cur_state = req.body.cur_state;
      var cur_pincode = req.body.cur_pincode;
      var cur_long = req.body.cur_long;
      var cur_lat = req.body.cur_lat;
      var current_address = {
          cur_address: cur_address,
          cur_city: cur_city,
          cur_state: cur_state,
          cur_pincode: cur_pincode,
          cur_long: cur_long,
          cur_lat: cur_lat
      };
      mongo.connect(url, function(err, db){
            db.collection('students').findOneAndUpdate({student_id},{$set:{current_address}}, function(err, result){
              assert.equal(null, err);
               db.close();
               res.send('true');
            });
      });
    });
router.route('/student_permanent_address/:student_id')
    .post(function(req, res, next){
      permanent_address = [];
      var student_id = req.params.student_id;
      var perm_address = req.body.perm_address;
      var perm_city = req.body.perm_city;
      var perm_state = req.body.perm_state;
      var perm_pincode = req.body.perm_pincode;
      var perm_long = req.body.perm_long;
      var perm_lat = req.body.perm_lat;
      var permanent_address = {
          perm_address: perm_address,
          perm_city: perm_city,
          perm_state: perm_state,
          perm_pincode: perm_pincode,
          perm_long: perm_long,
          perm_lat: perm_lat
      };
      mongo.connect(url, function(err, db){
            db.collection('students').findOneAndUpdate({student_id},{$set:{permanent_address}}, function(err, result){
              assert.equal(null, err);
               db.close();
               res.send('true');
            });
      });
    });


    router.route('/studentsdetails/:student_id')
        .get(function(req, res, next){
          var student_id = req.params.student_id;
         
          var resultArray = [];
          mongo.connect(url, function(err, db){
            assert.equal(null, err);
            var cursor = db.collection('students').find({student_id});
            cursor.forEach(function(doc, err){
              resultArray.push(doc);
            }, function(){
              db.close();
              res.send(resultArray[0]);
            });
          });
        });



    router.route('/get_parents/:student_id/')
    .get(function(req, res, next){
      var student_id = req.params.student_id;
      var resultArray = [];
      mongo.connect(url, function(err, db){
        assert.equal(null, err);
        var cursor = db.collection('students').find({student_id},{'parents': 1, '_id': 0});
        cursor.forEach(function(doc, err){
          resultArray.push(doc);
        }, function(){
          db.close();
          res.send(resultArray[0]);
        });
      });
    });

    router.route('/get_bus_route_by_student_id/:student_id/')
    .get(function(req, res, next){
      var student_id = req.params.student_id;
      var resultArray = [];
      mongo.connect(url, function(err, db){
        assert.equal(null, err);
        var cursor = db.collection('students').find({student_id},{'bus_route_id': 1, '_id': 0});
        cursor.forEach(function(doc, err){
          resultArray.push(doc);
        }, function(){
          db.close();
          res.send(resultArray[0]);
        });
      });
    });

    router.route('/get_array_students/:student_id/:array_name')
    .get(function(req, res, next){
      var student_id = req.params.student_id;
      var array_name = req.params.array_name;
      var resultArray = [];
      mongo.connect(url, function(err, db){
        assert.equal(null, err);
        var cursor = db.collection('students').find({student_id},{[array_name]: 1, '_id': 0});
        cursor.forEach(function(doc, err){
          resultArray.push(doc);
        }, function(){
          db.close();
          res.send(resultArray[0]);
        });
      });
    });


    router.route('/edit_students/:student_id')
        .put(function(req, res, next){
          var myquery = {student_id:req.params.student_id};
         // var req_class_id = req.body.class_id;
         // var req_section = req.body.section;         
         // var req_first_name = req.body.first_name;
         // var req_last_name = req.body.last_name;          
          var req_gender = req.body.gender;
          var req_dob = req.body.dob;
          var req_phone = req.body.phone;
         // var req_father_name = req.body.father_name;
         // var req_email = req.body.email;
          var req_category = req.body.category;
         // var req_admission_date = req.body.admission_date;
         // var req_admission_no = req.body.admission_no;         
        //  var req_roll_no = req.body.roll_no;
        //  var splited = req_class_id.split("-");
        //  var req_class_name = req.body.class_name;

          mongo.connect(url, function(err, db){
                db.collection('students').update(myquery,{$set:{
                                              //section:req_section,
                                            //  class_name:req_class_name,
                                            //  first_name:req_first_name,
                                           //   last_name:req_last_name,
                                              gender:req_gender,
                                              category:req_category,
                                              dob:req_dob,
                                              phone:req_phone,
                                             // parent_name:req_father_name
                                            //  email:req_email,
                                            //  admission_no:req_admission_no,
                                           //   admission_date:req_admission_date,
                                              }}, function(err, result){
                  assert.equal(null, err);
                  if(err){
                     res.send('false'); 
                  }
                   db.close();
                   res.send('true');
                });
          });
        });
   


    router.route('/delete_student/:student_id')
        .delete(function(req, res, next){
          var myquery = {student_id:req.params.student_id};
         
          mongo.connect(url, function(err, db){
                db.collection('students').deleteOne(myquery,function(err, result){
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
