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
    form.parse(req, function(err, fields, files) {

        var context = JSON.parse(fields.context);

        // `file` is the name of the <input> field of type `file`
        var uploaded_path = files.file.path
        fs.readFile(uploaded_path, function(err, data) {

            // Load uploaded file
            var zip = new JSZip(data);
            var doc = new Docxtemplater();
            doc.loadZip(zip);

            //set the templateVariables
            doc.setData(context);

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
                res.json({'success': false});
            }

            var buf = doc.getZip()
                .generate({type: 'nodebuffer'});

            try {
                // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
                fs.writeFileSync(path.resolve(path.join(process.env.PWD, '/uploads/'), 'output.docx'), buf);
            } catch (err) {
                res.status(500);
                res.json({'success': false});
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
