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
var schoolUserModule = require('../api_components/school_registration_user');
var cookieParser = require('cookie-parser');
router.use(function(req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
});

// Add Schools

router.route('/schools/')
    .post(function(req, res, next) {
        var status = 1;
        schools = [];
        var item = {
            school_id: 'getauto',
            name: req.body.name,
            // branch_type: req.body.branch_type,
            est_on: req.body.est_on,
            address: req.body.address,
            phone: req.body.phone,
            email: req.body.email,
            website: req.body.website,
            status: status,
        };
        mongo.connect(url, function(err, db) {
            autoIncrement.getNextSequence(db, 'schools', function(err, autoIndex) {
                var collection = db.collection('schools');
                collection.ensureIndex({
                    "school_id": 1,
                }, {
                    unique: true
                }, function(err, result) {
                    if (item.name == null  ) {
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
                                    school_id: 'SCH-927'+autoIndex
                                }
                            }, function(err, result) {
                                db.close();
                                res.end('true');
                                var userData = {};
                                     userData.email = item.email;
                                     userData.password = item.email;
                                     userData.uniqueId = 'SCH-927'+autoIndex;
                                     userData.role = "admin";
                                     userData.school_id = 'SCH-927'+autoIndex;
                                schoolUserModule.addAdminToSchool(userData);
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
            var cursor = db.collection('schools').find();
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    schools: resultArray
                });
            });
        });
    });



    router.route('/school/:school_id')
        .post(function(req, res, next){
          var school_id = req.params.school_id;
          var name = req.body.name;
          var value = req.body.value;
          mongo.connect(url, function(err, db){
                db.collection('schools').update({school_id},{$set:{[name]: value}}, function(err, result){
                  assert.equal(null, err);
                   db.close();
                   res.send('true');
                });
          });
        });


module.exports = router;
