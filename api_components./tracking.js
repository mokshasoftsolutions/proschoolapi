var express = require("express");
var config = require("../config.json");
var bodyParser = require("body-parser");
var api_key = "api-key-KJFSI4924R23RFSDFSD7F94";
var mongo = require('mongodb').MongoClient;
var autoIncrement = require("mongodb-autoincrement");
var assert = require('assert');
var forEach = require('async-foreach').forEach;
var async = require('async');
var zip = require('express-easy-zip');
var fs = require('fs');
var path = require("path");
var unzip = require('unzip');
var multer = require('multer');
var waterfall = require('async-waterfall');
var port = process.env.PORT || 4005;
var router = express.Router();
var url = 'mongodb://' + config.dbhost + ':27017/s_erp_data';
var springedge = require('springedge');
var mailer = require('nodemailer');

var cookieParser = require('cookie-parser');
router.use(function (req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next(); // make sure we go to the next routes and don't stop here
});

var storageImage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
        // cb(null, file.originalname);
    }
});

var uploadImage = multer({ //multer settings
    storage: storageImage,
    fileFilter: function (req, file, callback) { //file filter
        if (['zip'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
            return callback(new Error('Wrong extension type'));
        }
        callback(null, true);
    }
}).any();

router.route('/unZip/:school_id')
    .post(function (req, res, next) {
        uploadImage(req, res, function (err) {
            filename = req.files[0].filename;

            var dirPath = __dirname + "/../uploads/" + filename;
            var destPath = __dirname + "/../";
            var hema = fs.createReadStream(dirPath).pipe(unzip.Extract({ path: destPath }));
            console.log(hema);
            res.redirect('/');
        });
    })

module.exports = router;