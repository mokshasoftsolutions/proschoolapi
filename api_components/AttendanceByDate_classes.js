var express = require("express");
var config = require("../config.json");
var bodyParser = require("body-parser");
var api_key = "api-key-KJFSI4924R23RFSDFSD7F94";
var mongo = require('mongodb').MongoClient;
var autoIncrement = require("mongodb-autoincrement");
var assert = require('assert');
var port = process.env.PORT || 4005;
var router = express.Router();
// var fixtureData = require('./fixture_data.json');
// app.locals.barChartHelper = require('./bar_chart_helper');
var url = 'mongodb://' + config.dbhost + ':27017/s_erp_data';

var cookieParser = require('cookie-parser');
router.use(function (req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
});

router.route('/sec_attendence_b/:select_date/:class_id')
    .get(function (req, res, next) {
        var class_id = req.params.class_id;
        var splited = class_id.split("-");
        var school_id = splited[0] + '-' + splited[1];
        var resultArray = [];
        var select_date = new Date(req.params.select_date);
        var present = 0, absent = 0, onLeave = 0;
        var endDate = new Date(select_date);
        var count, dataCount;
        var classArray = [];
        var resultarray = [];
        var attendenceClass = [];
        var className;
        endDate.setDate(endDate.getDate() + 1)
        mongo.connect(url, function (err, db) {
            assert.equal(null, err);
            var sections = db.collection('class_sections').find({ class_id });
            var data = db.collection('attendance').find({
                date: { $gte: new Date(select_date.toISOString()), $lt: new Date(endDate.toISOString()) },
                class_id: class_id
            });

            dataCount = data.count(function (e, triggerCount) {
                if (triggerCount > 0) {
                    count = triggerCount;
                    //  console.log(count);
                }
            });

            sections.forEach(function (sec, err) {
                console.log("sections" + sec.section_id);
                if (sec.class_id == class_id) {
                    console.log("classSection");
                    present = absent = onLeave = 0;
                    data.forEach(function (doc, err) {
                        console.log("data");
                        if (sec.section_id == doc.section_id) {
                            if (doc.status == "Present") {
                                present += 1;
                                console.log("babu" + present);
                            }
                            else if (doc.status == "Absent") {
                                absent += 1;
                                console.log("babu1" + absent);
                            }
                            else if (doc.status == "On Leave") {
                                onLeave += 1;
                                console.log("babu2" + onLeave);
                            }
                        }
                    });
                    sectionName = sec.name;
                    attendenceSection.push(sectionName);
                    attendenceSection.push(present);
                    attendenceSection.push(absent);
                    attendenceSection.push(onLeave);

                    sectionArray.push(attendenceSection);
                }
            })

            var cursor = db.collection('attendance').aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(select_date.toISOString()),
                            $lt: new Date(endDate.toISOString())
                        },
                        class_id: class_id

                    },
                },
                {
                    $lookup: {
                        from: "class_sections",
                        localField: "section_id",
                        foreignField: "section_id",
                        as: "section_doc"
                    }
                },
                {
                    $unwind: "$section_doc"
                },
                {
                    $group: {
                        _id: '$_id',
                        section_name: {
                            "$first": "$section_doc.name"
                        },
                        status: {
                            "$first": "$status"
                        },

                    }
                }
            ])

            cursor.forEach(function (doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function () {
                db.close();
                res.send({
                    sectionAttendence: resultArray,
                    count: count,
                    sections: sectionArray
                });
            });

        });
    });


module.exports = router;