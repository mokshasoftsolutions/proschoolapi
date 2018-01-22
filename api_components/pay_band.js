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
router.use(function (req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
});

// Add Schools

router.route('/pay_band/:school_id')
    .post(function (req, res, next) {
        var status = 1;
        var school_id = req.params.school_id;
        var DA = req.body.DA;
        var HRA = req.body.HRA;
        var CA = req.body.CA;
        var ALOW = req.body.ALOW;
        var ARR = req.body.ARR;
        var EPF = req.body.EPF;
        var ESIC = req.body.ESIC;
        var TDS = req.body.TDS;

        var item = {
            payband_id: 'getauto',
            school_id: school_id,
            pay_band: req.body.pay_band,
            basic: req.body.basic,
            DA: DA,
            HRA: HRA,
            CA: CA,
            ALOW: ALOW,
            ARR: ARR,
            EPF: EPF,
            ESIC: ESIC,
            TDS: TDS,
            Allowances: DA + HRA + CA + ALOW + ARR,
            Deductions: EPF + ESIC + TDS
        };

        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'pay_band', function (err, autoIndex) {
                var collection = db.collection('pay_band');
                collection.ensureIndex({
                    "payband_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.pay_band == null) {
                            res.end('null');
                        } else {
                            collection.insertOne(item, function (err, result) {
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
                                            payband_id: school_id + '-PAYBAND-' + autoIndex
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
        var school_id = req.params.school_id;
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('pay_band').find({ school_id: school_id });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    pay_band: resultArray
                });
            });
        });
    });

router.route('/payband_edit/:payband_id')
    .put(function (req, res, next) {
        var myquery = { payband_id: req.params.payband_id };
        var pay_band = req.body.pay_band;
        var basic = req.body.basic;
        mongo.connect(url, function (err, db) {
            db.collection('pay_band').update(myquery, {
                $set: {
                    pay_band: pay_band,
                    basic: basic,
                }
            }, function (err, result) {
                assert.equal(null, err);
                if (err) {
                    res.send('false');
                }
                db.close();
                res.send('true');
            });
        });
    });

router.route('/payband_delete/:payband_id')
    .delete(function (req, res, next) {
        var myquery = { payband_id: req.params.payband_id };

        mongo.connect(url, function (err, db) {
            db.collection('pay_band').deleteOne(myquery, function (err, result) {
                assert.equal(null, err);
                if (err) {
                    res.send('false');
                }
                db.close();
                res.send('true');
            });
        });
    });



module.exports = router;
