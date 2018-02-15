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

router.route('/school_classes/:school_id')
    .post(function (req, res, next) {
        var status = 1;
        var school_id = req.params.school_id;
        school_classes = [];
        var item = {
            class_id: 'getauto',
            school_id: school_id,
            name: req.body.name,
            status: status,
        };
        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'school_classes', function (err, autoIndex) {
                var collection = db.collection('school_classes');
                collection.ensureIndex({
                    "class_id": 1,
                }, {
                        unique: true
                    }, function (err, result) {
                        if (item.name == null) {
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
                                            class_id: school_id + '-CL-' + autoIndex
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
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('school_classes').find({ school_id });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    school_classes: resultArray
                });
            });
        });
    });

router.route('/get_class_ids/:school_id')
    .get(function (req, res, next) {
        var school_id = req.params.school_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('school_classes').aggregate([
                { $match: { school_id } },
                {
                    $group: {
                        _id: '$school_id', classes: { $push: '$class_id' }
                    }
                }
            ]);
            cursor.forEach(function (doc, err) {
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send(resultArray[0]);
            });
        });
    });

router.route('/get_class_name/:class_id')
    .get(function (req, res, next) {
        var class_id = req.params.class_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('school_classes').aggregate([
                { $match: { class_id } },
                {
                    $group: {
                        _id: '$class_id', classes: { $push: '$name' }
                    }
                }
            ]);
            cursor.forEach(function (doc, err) {
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send(resultArray[0]);
            });
        });
    });

router.route('/school_classes_edit/:class_id/:name/:value')
    .post(function (req, res, next) {
        var class_id = req.params.class_id;
        var name = req.params.name;
        var value = req.params.value;
        mongo.connect(url, function (err, db) {
            db.collection('school_classes').update({ class_id }, { $set: { [name]: value } }, function (err, result) {
                assert.equal(null, err);
                db.close();
                res.send('true');
            });
        });
    });



router.route('/edit_classes/:class_id')
    .put(function (req, res, next) {

        var myquery = { class_id: req.params.class_id };
        var req_name = req.body.name;

        mongo.connect(url, function (err, db) {
            db.collection('school_classes').update(myquery, {
                $set: {
                    name: req_name,
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



router.route('/delete_classes/:class_id')
    .delete(function (req, res, next) {
        var myquery = { class_id: req.params.class_id };

        mongo.connect(url, function (err, db) {
            db.collection('school_classes').deleteOne(myquery, function (err, result) {
                assert.equal(null, err);
                if (err) {
                    res.send('false');
                }
                else {
                    mongo.connect(url, function (err, db) {
                        db.collection('class_sections').deleteOne(myquery, function (err, result) {
                            assert.equal(null, err);
                            if (err) {
                                res.send('sections false');
                            }
                            else {
                                mongo.connect(url, function (err, db) {
                                    db.collection('students').deleteOne(myquery, function (err, result) {
                                        assert.equal(null, err);
                                        if (err) {
                                            res.send('students false');
                                        }                                    

                                    });
                                });
                            }

                        });
                    });
                    db.close();
                    res.send('true');
                }
            });
        });
    });


module.exports = router;
 