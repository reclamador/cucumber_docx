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
  res.render('index', { title: 'Express' });
});


/* POST upload file */
router.post('/', function(req, res, next) {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        // `file` is the name of the <input> field of type `file`
        var old_path = files.file.path,
            file_size = files.file.size,
            file_ext = files.file.name.split('.').pop(),
            index = old_path.lastIndexOf('/') + 1,
            file_name = old_path.substr(index),
            new_path = path.join(process.env.PWD, '/uploads/', file_name + '.' + file_ext);

        fs.readFile(old_path, function(err, data) {

            var zip = new JSZip(data);
            var doc = new Docxtemplater();
            doc.loadZip(zip);

            //set the templateVariables
            doc.setData({
                first_name: 'John',
                last_name: 'Doe',
                phone: '0652455478',
                description: 'New Website'
            });

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
                // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
                throw error;
            }

            var buf = doc.getZip()
                .generate({type: 'nodebuffer'});

            // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
            fs.writeFileSync(path.resolve(path.join(process.env.PWD, '/uploads/'), 'output.docx'), buf);

        });
    });
});

module.exports = router;
