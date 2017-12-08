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


router.route('/vendor/:school_id')
    .post(function (req, res, next) {
        var status = 1;
        var school_id = req.params.school_id;

        var item = {
            vendor_id: 'getauto',
            school_id: school_id,
            vendor_name: req.body.vendor_name,
            material:req.body.material,
            contact_no: req.body.contact_no,
            email: req.body.email,
            address: req.body.address,
            location: req.body.location,
            status: status
        };
        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'vendor', function (err, autoIndex) {
                var collection = db.collection('vendor');
                collection.ensureIndex({
                    "vendor_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.vendor_name == null || item.contact_no == null) {
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
                                            vendor_id: 'VDR-' + autoIndex
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


router.route('/material_in/:school_id')
    .post(function (req, res, next) {
        var status = 1;
        var school_id = req.params.school_id;

        var item = {
            material_in_id: 'getauto',
            school_id: school_id,
            vendor_name: req.body.vendor_name,
            material: req.body.material,
            price: req.body.price,
            purchased_date: req.body.purchased_date,
            no_of_units: req.body.no_of_units,
            status: status
        };
        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'material_in', function (err, autoIndex) {
                var collection = db.collection('material_in');
                collection.ensureIndex({
                    "material_in_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.vendor_name == null || item.material == null || item.price == null) {
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
                                            material_in_id: 'MTR-I-' + autoIndex
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
            var cursor = db.collection('material_in').find({ school_id });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    material_in: resultArray
                });
            });
        });
    });


router.route('/material_out/:school_id')
    .post(function (req, res, next) {
        var status = 1;
        var school_id = req.params.school_id;

        var item = {
            material_out_id: 'getauto',
            school_id: school_id,
            name: req.body.name,
            material: req.body.material,
            out_date: req.body.out_date,
            no_of_units: req.body.no_of_units,
            status: status
        };
        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'material_out', function (err, autoIndex) {
                var collection = db.collection('material_out');
                collection.ensureIndex({
                    "material_out_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.name == null || item.material == null || item.no_of_units == null) {
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
                                            material_out_id: 'MTR-O-' + autoIndex
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
            var cursor = db.collection('material_out').find({ school_id });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    material_out: resultArray
                });
            });
        });
    });



router.route('/edit_vendor_events/:vendor_id')
    .put(function (req, res, next) {
        var myquery = { vendor_id: req.params.vendor_id };
        var req_material = req.body.material;
        var req_vendor_name = req.body.vendor_name;
        var req_contact_no = req.body.contact_no;
        var req_email = req.body.email;
        var req_address = req.body.address;
        var req_location = req.body.location;

        mongo.connect(url, function (err, db) {
            db.collection('vendor').update(myquery, {
                $set: {
                    material: req_material,
                    vendor_name: req_vendor_name,
                    contact_no: req_contact_no,
                    email: req_email,
                    address: req_address,
                    location: req_location
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



router.route('/delete_vendor_events/:vendor_id')
    .delete(function (req, res, next) {
        var myquery = { vendor_id: req.params.vendor_id };

        mongo.connect(url, function (err, db) {
            db.collection('vendor').deleteOne(myquery, function (err, result) {
                assert.equal(null, err);
                if (err) {
                    res.send('false');
                }
                    res.send('true');
            });
        });
    });



router.route('/edit_material_in/:material_in_id')
    .put(function (req, res, next) {
        var myquery = { material_in_id: req.params.material_in_id };
        var req_material = req.body.material;
        var req_vendor_name = req.body.vendor_name;
        var req_no_of_units = req.body.no_of_units;        
        var req_purchased_date = req.body.purchased_date;
        var req_price = req.body.price;

        mongo.connect(url, function (err, db) {
            db.collection('material_in').update(myquery, {
                $set: {
                    material: req_material,
                    vendor_name: req_vendor_name,
                    no_of_units: req_no_of_units,
                    price: req_price,
                    purchased_date: req_purchased_date,
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


router.route('/delete_material_in/:material_in_id')
    .delete(function (req, res, next) {
        var myquery = { material_in_id: req.params.material_in_id };

        mongo.connect(url, function (err, db) {
            db.collection('material_in').deleteOne(myquery, function (err, result) {
                assert.equal(null, err);
                if (err) {
                    res.send('false');
                }
                db.close();
                res.send('true');
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
