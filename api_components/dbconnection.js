var mysql = require('mysql');
var connection = mysql.createPool({

    //   host: "123.201.231.235",
    // host:'localhost',

    host: 'ec2-54-213-118-72.us-west-2.compute.amazonaws.com',

    user: 'root',
    password: 'moksha',
    database: 'jelly',
    port: '3306'


});
module.exports = connection;