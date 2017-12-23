// flow
var express = require("express");
var config = require("../config.json");
var bodyParser = require("body-parser");
var bcrypt = require("bcrypt-nodejs");
var api_key = "api-key-KJFSI4924R23RFSDFSD7F94";
var mongo = require('mongodb').MongoClient;
var autoIncrement = require("mongodb-autoincrement");
var assert = require('assert');
var port = process.env.PORT || 4005;
var router = express.Router();
var url = 'mongodb://' + config.dbhost + ':27017/s_erp_data';

var cookieParser = require('cookie-parser');
router.use(function (req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
});

// Add Employee

router.route('/staff_user/:employee_id')
    .post(function (req, res, next) {
        var status = 1;
        var employee_id = req.params.employee_id;
        var sec_pass = bcrypt.hashSync(req.body.password);
        var item = {
            staff_user_id: 'getauto',
            employee_id: employee_id,
            user_type: req.body.user_type,
            username: req.body.username,
            password: sec_pass,
            recovery_email: req.body.recovery_email,
            sms_alerts_number: req.body.sms_alerts_number,
            status: status,
        };
        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'staff_users', function (err, autoIndex) {
                var collection = db.collection('staff_users');
                collection.ensureIndex({
                    "staff_user_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.username == null || item.password == null || item.employee_id == null) {
                            res.end('null');
                        } else {
                            collection.insertOne(item, function (err, result) {
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
                                            staff_user_id: employee_id + '-STUSR-' + autoIndex
                                        }
                                    }, function (err, result) {
                                        db.close();
                                        res.end('true');
                                    });
                            });
                        }
                    });
            });
        });

    })
    .get(function (req, res, next) {
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('staff_users').find({}, { 'password': 0 });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();

                res.send({
                    staff_users: resultArray
                });
            });
        });
    });

module.exports = router;
