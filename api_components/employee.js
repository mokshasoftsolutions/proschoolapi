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

// Add Employee

router.route('/employee/:school_id')
    .post(function(req, res, next) {
        var status = 1;
        var school_id = req.params.school_id;
        var item = {
            employee_id: 'getauto',
            school_id: school_id,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            surname: req.body.surname,
            dob: req.body.dob,
            gender: req.body.gender,
            qualification: req.body.qualification,
            job_category: req.body.job_category,
            experience: req.body.experience,
            phone: req.body.phone,
            email: req.body.email,
            profile_image: req.body.profile_image,
            website: req.body.website,
            joined_on: req.body.joined_on,
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
        mongo.connect(url, function(err, db) {
            autoIncrement.getNextSequence(db, 'employee', function(err, autoIndex) {
                var collection = db.collection('employee');
                collection.ensureIndex({
                    "employee_id": 1,
                }, {
                    unique: true
                }, function(err, result) {
                    if (item.first_name == null || item.dob == null || item.phone == null) {
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
                                    employee_id: 'SCH-EMP-'+autoIndex
                                },
                                $push: {
                                  current_address, permanent_address
                                }
                            }, function(err, result) {
                                db.close();
                                res.end('true');
                            });
                        });
                    }
                });
                collection.ensureIndex({
                    "first_name":"text","last_name":"text","email":"text"
                });
            });
        });

    })
    .get(function(req, res, next) {
        var resultArray = [];
        mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            var cursor = db.collection('employee').find();
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    employee: resultArray
                });
            });
        });
    });
router.route('/search_employee/:job_category/:gender/:search_key')
    .get(function(req, res, next){
      var job_category = req.params.job_category;
      var gender = req.params.gender;
      var search_key = req.params.search_key;
      var resultArray = [];
      mongo.connect(url, function(err, db){
        assert.equal(null, err);
        var cursor = db.collection('employee').find({job_category: job_category,gender, $text:{$search:search_key}});
        cursor.forEach(function(doc, err){
          resultArray.push(doc);
        }, function(){
          db.close();
          res.send(resultArray);
        });
      });
});
router.route('/add_old_employment_details/:employee_id')
    .post(function(req, res, next){
      old_employment_details = [];
      var employee_id = req.params.employee_id;
      var old_employment_details = {
        org_name: req.body.org_name,
        designation: req.body.designation,
        responsibilities: req.body.responsibilities,
        salary_per_annum: req.body.salary_per_annum,
        from_date: req.body.from_date,
        to_date: req.body.to_date,
      };
      mongo.connect(url, function(err, db){
            db.collection('employee').update({employee_id},{$push:{old_employment_details}}, function(err, result){
              assert.equal(null, err);
               db.close();
               res.send('true');
            });
      });
    });

router.route('/employee_current_address/:employee_id')
    .post(function(req, res, next){
      current_address = [];
      var employee_id = req.params.employee_id;
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
            db.collection('employee').findOneAndUpdate({employee_id},{$set:{current_address}}, function(err, result){
              assert.equal(null, err);
               db.close();
               res.send('true');
            });
      });
    });
router.route('/employee_permanent_address/:employee_id')
    .post(function(req, res, next){
      permanent_address = [];
      var employee_id = req.params.employee_id;
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
            db.collection('employee').findOneAndUpdate({employee_id},{$set:{permanent_address}}, function(err, result){
              assert.equal(null, err);
               db.close();
               res.send('true');
            });
      });
    });


 router.route('/edit_employee/:employee_id')
        .put(function(req, res, next){
          var myquery = {employee_id:req.params.employee_id};
        //  var req_first_name = req.body.first_name;
        //  var req_last_name = req.body.last_name;
        //  var req_dob = req.body.dob;
          var req_gender = req.body.gender;
        //  var req_qualification = req.body.qualification;
          var req_job_category = req.body.job_category;
          var req_experience = req.body.experience;
          var req_phone = req.body.phone;
          var req_email = req.body.email;
         // var req_profile_image = req.body.profile_image;
        //  var req_website = req.body.website;
          var req_joined_on = req.body.joined_on;
          
          mongo.connect(url, function(err, db){
                db.collection('employee').update(myquery,{$set:{//first_name:req_first_name,
                                             // last_name:req_last_name,
                                             // dob:req_dob,
                                              gender:req_gender,
                                            //  qualification:req_qualification,
                                              job_category:req_job_category,
                                              experience:req_experience,
                                              phone:req_phone,
                                              email:req_email,
                                            //  profile_image:req_profile_image,
                                            //  website:req_website,
                                              joined_on:req_joined_on}}, function(err, result){
                  assert.equal(null, err);
                  if(err){
                     res.send('false'); 
                  }
                   db.close();
                   res.send('true');
                });
          });
        });



    router.route('/delete_employee/:employee_id')
        .delete(function(req, res, next){
          var myquery = {employee_id:req.params.employee_id};
         
          mongo.connect(url, function(err, db){
                db.collection('employee').deleteOne(myquery,function(err, result){
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
