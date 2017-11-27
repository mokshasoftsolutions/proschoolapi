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
var port = process.env.PORT || 4005;
var router = express.Router();
var ObjectID = require('mongodb').ObjectID;
var url = 'mongodb://' + config.dbhost + ':27017/s_erp_data';

var cookieParser = require('cookie-parser');
router.use(function (req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
});

// Add Vehicles

router.route('/vehicles/:school_id')
    .post(function (req, res, next) {
        var status = 1;
        var school_id = req.params.school_id;
        var item = {
            vehicle_id: 'getauto',
            vehicle_code: req.body.vehicle_code,
            vehicle_name: req.body.vehicle_name,
            school_id: school_id,
            status: status
        };

        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'vehicles', function (err, autoIndex) {
                var collection = db.collection('vehicles');
                collection.ensureIndex({
                    "vehicle_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.vehicle_code == null || item.vehicle_name == null || item.school_id == null) {
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
                                            vehicle_id: 'VCL-' + autoIndex
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
        var school_id = req.params.school_id;
        var status = 1;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('vehicles').find({ school_id, status });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    vehicles: resultArray
                });
            });
        });
    });


router.route('/vehicle_all_details/:school_id')
    .post(function (req, res, next) {
        var status = 1;
        var school_id = req.params.school_id;
        var item = {
            vehicle_details_id: 'getauto',
            vehicle_number: req.body.vehicle_number,
            vehicle_name: req.body.vehicle_name,
            chassis_number: req.body.chassis_number,
            engine_number: req.body.engine_number,
            school_id: school_id,
            vehicle_type: req.body.vehicle_type,
            status: status
        };
        var Insurence = [];
        var Finance = [];
        var Maintenence = [];

        Insurence = {
            number: req.body.number,
            insurence_company_name: req.body.insurence_company_name,
            valid_from: req.body.valid_from,
            valid_to: req.body.valid_to,
            amount: req.body.amount
        }
        Finance = {
            finance_company_name: req.body.finance_company_name,
            finance_amount: req.body.finance_amount,
            finance_from: req.body.finance_from,
            finance_to: req.body.finance_to,
            emi: req.body.emi,
            remind: req.body.finance_remind,
            date: req.body.date
        }
        Maintenence = {
            engine_oil: req.body.engine_oil,
            filled_date: req.body.filled_date,
            remind: req.body.maintenence_remind,
        }


        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'vehicles_details', function (err, autoIndex) {
                var collection = db.collection('vehicles_details');
                collection.ensureIndex({
                    "vehicle_details_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.vehicle_number == null || item.vehicle_name == null || item.chassis_number == null) {
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
                                            vehicle_details_id: 'VEHICLE-' + autoIndex
                                        },
                                        $push: {
                                            Finance,
                                            Insurence,
                                            Maintenence
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
        var school_id = req.params.school_id;
        var status = 1;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('vehicles_details').find({ school_id, status });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    vehicles: resultArray
                });
            });
        });
    });


router.route('/vehicle_details/:vehicle_id')
    .get(function (req, res, next) {
        var vehicle_id = req.params.vehicle_id;
        var resultArray = [];

        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('vehicles').find({ vehicle_id });
            cursor.forEach(function (doc, err) {
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send(resultArray[0]);
            });
        });
    });

router.route('/vehicle_edit/:vehicle_id')
    .put(function (req, res, next) {
        var _id = new ObjectID(req.params.vehicle_id);
        var req_vehicle_code = req.body.vehicle_code;
        var req_vehicle_name = req.body.vehicle_name;

        mongo.connect(url, function (err, db) {
            db.collection('vehicles').update({ _id }, { $set: { vehicle_code: req_vehicle_code, vehicle_name: req_vehicle_name } }, function (err, result) {
                assert.equal(null, err);
                if (err) {
                    res.send('false');
                }
                db.close();
                res.send('true');
            });
        });
    });

router.route('/vehicle_delete/:vehicle_id')
    .put(function (req, res, next) {
        var _id = new ObjectID(req.params.vehicle_id);
        var req_status = 0;

        mongo.connect(url, function (err, db) {
            db.collection('vehicles').update({ _id }, { $set: { status: req_status } }, function (err, result) {
                assert.equal(null, err);
                if (err) {
                    res.send('false');
                }
                db.close();
                res.send('true');
            });
        });
    });



//  Modified
// Vehicles bulk upload via excel sheet


var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
    }
});

var upload = multer({ //multer settings
    storage: storage,
    fileFilter: function (req, file, callback) { //file filter
        if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
            return callback(new Error('Wrong extension type'));
        }
        callback(null, true);
    }
}).single('file');

router.route('/bulk_upload_vehicles/:school_id')
    .post(function (req, res, next) {
        var school_id = req.params.school_id;
        var status = 1;
        var exceltojson;
        upload(req, res, function (err) {
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
                }, function (err, result) {
                    if (err) {
                        return res.json({ error_code: 1, err_desc: err, data: null });
                    }
                    res.json({ data: result });
                    console.log(result[0]);
                    var test = result;
                    var count = 0;

                    if (test.length > 0) {
                        test.forEach(function (key, value) {

                            var item = {
                                vehicle_id: 'getauto',
                                vehicle_code: req.body.vehiclecode,
                                vehicle_name: req.body.vehiclename,
                                school_id: school_id,
                                status: status
                            };
                            mongo.connect(url, function (err, db) {
                                autoIncrement.getNextSequence(db, 'vehicles', function (err, autoIndex) {

                                    var collection = db.collection('vehicles');
                                    collection.ensureIndex({
                                        "vehicle_id": 1,
                                    }, {
                                            unique: true
                                        }, function (err, result) {
                                            if (item.vehicle_code == null || item.vehicle_name == null || item.school_id == null) {
                                                res.end('null');
                                            } else {
                                                item.vehicle_id = 'VCL-' + autoIndex;
                                                collection.insertOne(item, function (err, result) {
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


router.route('/edit_vehicle/:vehicle_details_id')
    .put(function (req, res, next) {
        var myquery = { vehicle_details_id: req.params.vehicle_details_id };
        var req_vehicle_name = req.body.vehicle_name;
        var req_vehicle_number = req.body.vehicle_number;
        var req_engine_number = req.body.engine_number;
        var req_chassis_number = req.body.chassis_number;
        var req_vehicle_type = req.body.vehicle_type;

        mongo.connect(url, function (err, db) {
            db.collection('vehicles_details').update(myquery, {
                $set: {
                    vehicle_name: req_vehicle_name,
                    vehicle_number: req_vehicle_number,
                    chassis_number: req_chassis_number,
                    engine_number: req_engine_number,
                    vehicle_type: req_vehicle_type,
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

router.route('/delete_vehicle/:vehicle_details_id')
    .delete(function (req, res, next) {
        var myquery = { vehicle_details_id: req.params.vehicle_details_id };

        mongo.connect(url, function (err, db) {
            db.collection('vehicles_details').deleteOne(myquery, function (err, result) {
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



