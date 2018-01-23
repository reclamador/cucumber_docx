require('newrelic');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var formidable = require('formidable');
var fs = require('fs');
var http = require('http');
var JSZip = require('jszip');
var Docxtemplater = require('docxtemplater');
var winston = require('winston');
var Sentry = require('winston-sentry');

require('dotenv').config();
var Raven = require('raven');

// Must configure Raven before doing anything else with it
Raven.config().install();

winston.emitErrs = true;

var logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: './logfile.log',
            handleExceptions: true,
            json: false,
            colorize: false,
            timestamp: function () {
                return new Date().toLocaleString('es');
            }
        }),
        new winston.transports.Console({
            level: 'info',
            handleExceptions: true,
            json: false,
            colorize: true
        }),
        new Sentry({
            level: 'error',
            dsn: process.env.SENTRY_DSN,
            tags: {key: 'value'},
            extra: {key: 'value'}
        })
    ],
    exitOnError: false
});

// Instance express
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// The request handler must be the first middleware on the app
app.use(Raven.requestHandler());

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


/* GET home page. */
app.get('/', function (req, res, next) {
    res.render('index', {title: 'Docx parser tester'});
});

/* POST upload file */
app.post('/', function (req, res, next) {

    var form = new formidable.IncomingForm();

    // Callback to answer inconming POST request
    form.parse(req, function (err, fields, files) {
        // Error detected: pass to next route handler
        if (err) next(err);

        var context;
        var uploaded_path;

        // Get file
        try {
            uploaded_path = files.file.path;
        } catch (typeError) {
            logger.error('empty file');
            res.status(400);
            return res.json({'success': false, 'reason': 'empty file'})
        }

        // Get context
        try {
            context = JSON.parse(fields.context);
        }
        catch (parseError) {
            var e = {
                message: parseError.message,
                name: parseError.name,
                stack: parseError.stack,
                properties: parseError.properties
            };
            logger.error(JSON.stringify({parseError: e}));
            // The error contains additional information when logged with JSON.stringify (it contains a property object).
            res.status(400);
            return res.json({'success': false, 'reason': 'invalid context data: ' + e.message});
        }

        // Read file sent
        fs.readFile(uploaded_path, function (err, data) {
            if (err) {
                logger.error('error reading input file: ' + err.message);
                res.status(500);
                return res.json({'success': false, 'reason': 'error reading input file'})
            }

            var zip;
            var doc;
            var buf;

            // Load uploaded file and set the template variables
            try {
                zip = new JSZip(data);
                doc = new Docxtemplater();
                doc.loadZip(zip);
                doc.setData(context);
            } catch (e) {
                logger.error('error loading input file: ' + e.message);
                res.status(500);
                return res.json({'success': false, 'reason': 'error loading input file'})
            }

            try {
                // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
                doc.render()
            }
            catch (error) {
                var e = {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                    properties: error.properties
                };
                logger.error(JSON.stringify({error: e}));
                // The error contains additional information when logged with JSON.stringify (it contains a property object).
                res.status(500);
                return res.json({'success': false, 'reason': 'error replacing vars'});
            }

            // generate output data
            try {
                buf = doc.getZip().generate({type: 'nodebuffer'});
                // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
                fs.writeFileSync(path.resolve(path.join(process.cwd(), '/uploads/'), 'output.docx'), buf);
            } catch (err) {
                logger.error('error generating output file: ' + err.message);
                res.status(500);
                return res.json({'success': false, 'reason': 'error generating output file'});
            }

            // Send output docx file
            res.setHeader('Content-Disposition', 'attachment; filename=docx_file_replaced.docx');
            res.setHeader('Content-Transfer-Encoding', 'binary');
            res.setHeader('Content-Type', ' application/vnd.openxmlformats-officedocument.wordprocessingml.document');

            res.status(200);
            res.write(buf, 'binary');
            res.end(null, 'binary');

        });
    });
});

// The error handler must be before any other error middleware
app.use(Raven.errorHandler());

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500;
    res.end(res.sentry + '\n');
});

module.exports = app;
