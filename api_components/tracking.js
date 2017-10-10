// flow
var express = require("express");
var config = require("../config.json");
var bodyParser = require("body-parser");
var api_key = "api-key-KJFSI4924R23RFSDFSD7F94";
// var mongo = require('mongodb').MongoClient;
// var autoIncrement = require("mongodb-autoincrement");
var assert = require('assert');
var forEach = require('async-foreach').forEach;
var port = process.env.PORT || 4005;
var router = express.Router();
var multer = require("multer");
// var url = 'mongodb://' + config.dbhost + ':27017/s_erp_data';
var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "moksha",
    database: "jelly",
});

var cookieParser = require('cookie-parser');
router.use(function(req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
});



router.route('/device_codes')
    .post(function(req, res, next) {
       // var status = 1;
        //var school_id = req.params.school_id;
        var item = {
            // station_id: 'getauto',
            // school_id: school_id,
            deviceids: req.body.deviceids,
            devicecode: req.body.devicecode,

        }
        // con.connect(function(err) {
        //     if (err) throw err;
            con.query('INSERT INTO devicecodes SET ?', item, function(error, results, fields) {
                if (error) throw error;
                res.end(JSON.stringify(results));
                console.log(results);
            });
        // });
    })

    .get(function(req, res, next) {
        //var resultArray = [];
        // con.connect(function(err) {
        //     if (err) throw err;
            con.query('select * from devicecodes', function(error, results, fields) {
                if (error) throw error;
                res.end(JSON.stringify(results));
                console.log(results);
            });
        // });
    });


module.exports = router;