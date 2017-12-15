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

router.route('/class_sections/:class_id')
    .post(function (req, res, next) {
        var status = 1;
        var class_id = req.params.class_id;

        var splited = class_id.split("-");
        var school_id = splited[0] + '-' + splited[1];

        school_classes = [];
        var item = {
            section_id: 'getauto',
            class_id: class_id,
            name: req.body.name,
            school_id: school_id,
            teacher_name: req.body.teacher_name,
            status: status,
        };
        mongo.connect(url, function (err, db) {
            autoIncrement.getNextSequence(db, 'class_sections', function (err, autoIndex) {
                var collection = db.collection('class_sections');
                collection.ensureIndex({
                    "section_id": 1,
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
                                            section_id: class_id + '-SEC-' + autoIndex
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
        var class_id = req.params.class_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('class_sections').find({ class_id });
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    class_sections: resultArray
                });
            });
        });
    });

router.route('/get_sections_by_classid/:class_id')
    .get(function (req, res, next) {
        var class_id = req.params.class_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('class_sections').aggregate([
                {
                    $match: {
                        class_id: class_id,
                    }
                },
                {
                    $lookup: {
                        from: "school_classes",
                        localField: "class_id",
                        foreignField: "class_id",
                        as: "class_doc"
                    }
                },
                {
                    $unwind: "$class_doc"
                },
                {
                    $group: {
                        _id: '$_id',
                        class_name: {
                            "$first": "$class_doc.name"
                        },
                        section_name: {
                            "$first": "$name"
                        },
                        section_id: {
                            "$first": "$section_id"
                        },
                        class_id: {
                            "$first": "$class_id"
                        },
                        teacher_name: {
                            "$first": "$teacher_name"
                        }

                    }
                }
            ])
            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    class_sections: resultArray
                });
            });
        });
    });

router.route('/get_sections_ids/:class_id')
    .get(function (req, res, next) {
        var class_id = req.params.class_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('class_sections').aggregate([
                { $match: { class_id } },
                {
                    $group: {
                        _id: '$class_id', sections: { $push: '$section_id' }
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

router.route('/get_section_name/:section_id')
    .get(function (req, res, next) {
        var section_id = req.params.section_id;
        var resultArray = [];
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var cursor = db.collection('class_sections').aggregate([
                { $match: { section_id } },
                {
                    $group: {
                        _id: '$section_id', classes: { $push: '$name' }
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

router.route('/class_sections_edit/:section_id/:name/:value')
    .post(function (req, res, next) {
        var section_id = req.params.section_id;
        var name = req.params.name;
        var value = req.params.value;
        mongo.connect(url, function (err, db) {
            db.collection('class_sections').update({ section_id }, { $set: { [name]: value } }, function (err, result) {
                assert.equal(null, err);
                db.close();
                res.send('true');
            });
        });
    });


router.route('/edit_sections/:section_id')
    .put(function (req, res, next) {

        var myquery = { section_id: req.params.section_id };
        var req_name = req.body.name;
        var req_teacher_name = req.body.teacher_name;

        mongo.connect(url, function (err, db) {
            db.collection('class_sections').update(myquery, {
                $set: {
                    name: req_name,
                    teacher_name: req_teacher_name,
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



router.route('/delete_sections/:section_id')
    .delete(function (req, res, next) {
        var myquery = { section_id: req.params.section_id };

        mongo.connect(url, function (err, db) {
            db.collection('class_sections').deleteOne(myquery, function (err, result) {
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
