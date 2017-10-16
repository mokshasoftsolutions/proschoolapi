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
    host: "ec2-54-213-118-72.us-west-2.compute.amazonaws.com",
    port:"3306",
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
            
            name: req.body.name,
            uniqueid: req.body.uniqueid,
            positionid: req.body.positionid,
            phone: req.body.phone,
            model: req.body.model,
            category: req.body.category,



        }
       
            con.query('INSERT INTO devices SET ?', item, function(error, results, fields) {
                if (error) throw error;
                res.end(JSON.stringify(results));
                console.log(results);
            });
        
    })

    .get(function(req, res, next) {
       
            con.query('SELECT positions.* FROM positions INNER JOIN devices ON positions.id = devices.positionid', function(error, results, fields) {
                if (error) throw error;
                res.end(JSON.stringify(results));
                console.log(results);
            });
        
    });

router.route('/get_device_details/:devicecode')
     .get(function(req, res, next) {
       var devicecode=req.params.devicecode;
       
            con.query('select * from positions,devicecodes where devicecodes.devicecode and devicecodes.deviceid=positions.deviceid ORDER BY positions.id DESC limit 1', function(error, results, fields) {
                if (error) throw error;
                res.end(JSON.stringify(results));
                console.log(results);
            });
        
    });


module.exports = router;

//select p from Positions p,DeviceCodes dc where dc.deviceCode=:campID and dc.deviceId=p.deviceId ORDER BY p.id DESC