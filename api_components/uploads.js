    var express = require('express');
    var app = express();
    var config = require("../config.json");
    var bodyParser = require('body-parser');
    var api_key = "api-key-KJFSI4924R23RFSDFSD7F94";
    var multer = require('multer');
    var xlstojson = require("xls-to-json-lc");
    var xlsxtojson = require("xlsx-to-json-lc");
    var url = 'mongodb://' + config.dbhost + ':27017/s_erp_data';
    var port = process.env.PORT || 4005;
    var mongo = require('mongodb').MongoClient;
    var router = express.Router();
    var autoIncrement = require("mongodb-autoincrement");


    app.use(bodyParser.json());

    app.use(function(req, res, next) {
        // do logging
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "*");
        res.header("Access-Control-Allow-Methods", "POST , GET , OPTIONS , DELETE , EDIT, PUT");
        next(); // make sure we go to the next routes and don't stop here
    });

    var storage = multer.diskStorage({ //multers disk storage settings
        destination: function(req, file, cb) {
            cb(null, './uploads/')
        },
        filename: function(req, file, cb) {
            var datetimestamp = Date.now();
            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
        }
    });

    var upload = multer({ //multer settings
        storage: storage,
        fileFilter: function(req, file, callback) { //file filter
            if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
                return callback(new Error('Wrong extension type'));
            }
            callback(null, true);
        }
    }).single('file');

    router.route('/upload_books/:school_id')
        .post(function(req, res, next) {
            school_id = req.params.school_id;
            var exceltojson;
            upload(req, res, function(err) {
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
                    }, function(err, result) {
                        if (err) {
                            return res.json({ error_code: 1, err_desc: err, data: null });
                        }
                        res.json({ data: result });
                        console.log(result);
                        var test = result;
                        var count = 0;

                        if (test.length > 0) {
                            test.forEach(function(key, value) {


                            var item = {
                                    book_id: '',
                                    book_title: key.booktitle,
                                    school_id: school_id,
                                    author_name: key.bookauthor,
                                    book_description: key.bookdescription,
                                    book_price: key.bookprice,
                                    rack_number: key.racknumber,
                                    qty: key.qty,
                                    inward_date: key.inwarddate,
                                    subject:key.subject,


                                };
                               
                                mongo.connect(url, function(err, db) {
                                    autoIncrement.getNextSequence(db, 'books', function(err, autoIndex) {                                     

                                        var collection = db.collection('books');
                                        collection.ensureIndex({
                                            "book_id": 1,
                                        }, {
                                            unique: true
                                        }, function(err, result) {
                                            if (item.school_id == null || item.book_title == null) {
                                                res.end('null');
                                            } else {
                                                item.book_id = 'BOOK-' + autoIndex;
                                                collection.insertOne(item, function(err, result) {
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



    module.exports = router;