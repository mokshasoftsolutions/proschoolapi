// flow
var schools = require("./api_components/schools.js");
var exam_schedule = require("./api_components/exam_schedule.js");
var exams = require("./api_components/exams.js");
var library = require("./api_components/library.js");
var timetable = require("./api_components/timetable.js");
var transport = require("./api_components/transport.js");
var busroute = require("./api_components/busroute.js");
var station_and_routes = require("./api_components/station_and_routes.js");
var school_classes = require("./api_components/school_classes.js");
var class_sections = require("./api_components/class_sections.js");
var students = require("./api_components/students.js");
var subjects = require("./api_components/subject.js");
var course_works = require("./api_components/course_work.js");
var attendance = require("./api_components/attendance.js");
var Emp_attendance = require("./api_components/Emp_attendance.js");
var employee = require("./api_components/employee.js");
var staff_user = require("./api_components/staff_user.js");
var teachers = require("./api_components/teacher.js");
var assesment = require("./api_components/assesment.js");
var assignment = require("./api_components/assigments.js");
var fee_types = require("./api_components/fee_types.js");
var vehicles = require("./api_components/vehicles.js");
var attendance_charts = require("./api_components/AttendanceChart.js");
var examgraph = require("./api_components/examgraph.js");
var noticeboard = require("./api_components/noticeboard.js");
var school_event = require("./api_components/schoolevent.js");
const Authentication = require('./controllers/authentication');
const passportService = require('./services/passport');
const passport = require('passport');

const requireAuth = passport.authenticate('jwt',{ session: false });
const requireSignin = passport.authenticate('local',{session: false});

var config = require("./config.json");
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var server = require('http').createServer(app);
var api_key = "api-key-KJFSI4924R23RFSDFSD7F94";
var mongo = require('mongodb').MongoClient;
const mongoose = require('mongoose');
var objectId = require('mongodb').ObjectID;
var assert = require('assert');
var port = process.env.PORT || 4005;
var router = express.Router();
var fs = require("fs");
var url = 'mongodb://' +config.dbhost + ':27017/s_erp_data';
// DB Setup for Auth
mongoose.connect('mongodb://localhost:auth/auth');
var cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

router.use(function(req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Authorization, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods" , "POST , GET , OPTIONS , DELETE , EDIT, PUT");
    next(); // make sure we go to the next routes and don't stop here
});

app.use(function(req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Authorization, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods" , "POST , GET , OPTIONS , DELETE , EDIT, PUT");
    next(); // make sure we go to the next routes and don't stop here
});

app.get('/', function (req, res) {
  res.send('School ERP API');
});


app.get('/secure', requireAuth, function (req, res) {
  res.send('School ERP API -  Authorised Page');
});

app.post('/signin', requireSignin, Authentication.signin);

app.post('/signup', Authentication.signup);

router.route('/em')
    .get(function(req, res, next) {
        mongo.connect(url, function(err, db) {
            if (!err) {
                res.send("Hay! We have a connection WOW Great");
                return true;
            } else {
                console.log(err);
                res.send("I think you have done something wrong!!");
            }
        });

    });


app.listen(port, function(){
   console.log('Express server listening on port ' + port);
});

app.use('/api', schools);
app.use('/api', exams);
app.use('/api', library);
app.use('/api', timetable);
app.use('/api', transport);
app.use('/api', busroute);
app.use('/api', station_and_routes);
app.use('/api', exam_schedule);
app.use('/api', school_classes);
app.use('/api', class_sections);
app.use('/api', teachers);
app.use('/api', students);
app.use('/api', subjects);
app.use('/api', course_works);
app.use('/api', attendance);
app.use('/api', Emp_attendance);
app.use('/api', employee);
app.use('/api', staff_user);
app.use('/api', assesment);
app.use('/api', fee_types);
app.use('/api', assignment);
app.use('/api', vehicles);
app.use('/api', attendance_charts);
app.use('/api', examgraph);
app.use('/api', noticeboard);
app.use('/api', school_event);
app.use('/api', router);
