var express = require('express');
var router = express.Router();

var formidable = require('formidable');
var fs = require('fs');
var http = require('http')
var path = require('path');
var JSZip = require('jszip');
var Docxtemplater = require('docxtemplater');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Docx parser tester' });
});


/* POST upload file */
router.post('/', function(req, res, next) {

    var form = new formidable.IncomingForm();

    // Callback to answer inconming POST request
    form.parse(req, function(err, fields, files) {
        // Error detected: pass to next route handler
        if (err) next(err);

        var context;
        var uploaded_path;

        // Get file
        try {
            uploaded_path = files.file.path;
        } catch(typeError) {
            res.status(400);
            return res.json({'success': false, 'reason': 'empty file'})
        }

         console.log(uploaded_path);

        // Get context
        try {
            context = JSON.parse(fields.context);
        }
        catch(parseError) {
            var e = {
                message: parseError.message,
                name: parseError.name,
                stack: parseError.stack,
                properties: parseError.properties
            };
            console.log(JSON.stringify({parseError: e}));
            // The error contains additional information when logged with JSON.stringify (it contains a property object).
            res.status(400);
            return res.json({'success': false, 'reason': 'invalid context data: ' + e.message});
        }

        // Read file sent
        fs.readFile(uploaded_path, function(err, data) {
            if (err) {
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
                console.log(JSON.stringify({error: e}));
                // The error contains additional information when logged with JSON.stringify (it contains a property object).
                res.status(500);
                return res.json({'success': false, 'reason': 'error replacing vars'});
            }

            // generate output data
            try {
                buf = doc.getZip().generate({type: 'nodebuffer'});
                // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
                fs.writeFileSync(path.resolve(path.join(process.env.PWD, '/uploads/'), 'output.docx'), buf);
            } catch (err) {
                res.status(500);
                return res.json({'success': false, 'reason': 'error generating output file'});
            }

            // Send output docx file
            res.setHeader('Content-Disposition', 'attachment; filename=docx_file_replaced.docx');
            res.setHeader('Content-Transfer-Encoding', 'binary');
            res.setHeader('Content-Type', ' application/vnd.openxmlformats-officedocument.wordprocessingml.document');

            res.status(200);
            res.write(buf,'binary');
            res.end(null, 'binary');

        });
    });
});

module.exports = router;
