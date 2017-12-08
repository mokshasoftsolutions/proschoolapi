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


router.route('/pay_details/:school_id')
    .post(function (req, res, next) {
        var status = 1;
        var school_id = req.params.school_id;

        var item = {
            pay_id: 'getauto',
            school_id: school_id,
            Basic: req.body.Basic,
            DA: req.body.DA,
            HRA: req.body.HRA,
            CA: req.body.CA,
            ARR: req.body.ARR,
            ALOW: req.body.ALOW,
            EPF: req.body.EPF,
            ESIC: req.body.ESIC,
            TDS: req.body.TDS,
            status: status
        };
        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'pay_details', function (err, autoIndex) {
                var collection = db.collection('pay_details');
                collection.ensureIndex({
                    "pay_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.Basic == null || item.HRA == null) {
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
                                            pay_id: 'PAY-' + autoIndex
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

router.route('/pay_details/:school_id')
    .get(function (req, res, next) {
        var resultArray = [];
        var school_id = req.params.school_id;

        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('vendor').find({ school_id });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    vendor: resultArray
                });
            });
        });
    });



router.route('/edit_material_out/:material_out_id')
    .put(function (req, res, next) {
        var myquery = { material_out_id: req.params.material_out_id };
        var req_material = req.body.material;
        var req_name = req.body.name;
        var req_out_date = req.body.out_date;
        var req_no_of_units = req.body.no_of_units;

        mongo.connect(url, function (err, db) {
            db.collection('material_out').update(myquery, {
                $set: {
                    material: req_material,
                    name: req_name,
                    out_date: req_out_date,
                    no_of_units: req_no_of_units
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


router.route('/delete_material_out/:material_out_id')
    .delete(function (req, res, next) {
        var myquery = { material_out_id: req.params.material_out_id };

        mongo.connect(url, function (err, db) {
            db.collection('material_out').deleteOne(myquery, function (err, result) {
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


