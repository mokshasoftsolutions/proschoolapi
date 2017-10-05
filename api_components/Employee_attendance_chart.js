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
// var fixtureData = require('./fixture_data.json');
// app.locals.barChartHelper = require('./bar_chart_helper');
var url = 'mongodb://' + config.dbhost + ':27017/s_erp_data';

var cookieParser = require('cookie-parser');
router.use(function(req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
});
 
router.route('/employee_attendancebydate/:select_date/:school_id')
 .get(function(req, res, next) {
      var select_date = new Date (req.params.select_date);
      school_id = req.params.school_id;
      var endDate = new Date(select_date);
      endDate.setDate(endDate.getDate()+ 1)
      
        var resultArray = [];
        mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            var cursor = db.collection('employee_attendance').find({date:new Date(select_date) ,school_id: school_id});
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    donutchart: resultArray
                });
            });
        });
    });
 





router.route('/employee_attendancebymonth/:select_month/:school_id')
 .get(function(req, res, next) {
      var select_month = req.params.select_month;
      var school_id = req.params.school_id;
      var date = new Date();
     
        var firstDay = new Date(date.getFullYear(), select_month-1, 1);
        var lastDay = new Date(date.getFullYear(), select_month, 0);
        //  console.log(firstDay);
        //  console.log(lastDay);
        var resultArray = [];
        mongo.connect(url, function(err, db) {
            assert.equal(null, err);
            var cursor = db.collection('employee_attendance').find({date:{$gte: firstDay, $lt: lastDay}, school_id:school_id});
            cursor.forEach(function(doc, err) {
                assert.equal(null, err);
                resultArray.push(doc);
            }, function() {
                db.close();
                res.send({
                    donutchart: resultArray
                });
            });
        });
    });

module.exports = router;

