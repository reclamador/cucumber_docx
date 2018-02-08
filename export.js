var googleapis = require('googleapis');
var googleAuth = require('google-auth-library');
var fs = require('fs');

var scopes = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.metadata',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/drive.photos.readonly',
    'https://www.googleapis.com/auth/drive.readonly'
];

var email = 'SERVICE_ACCOUNT_EMAIL';

var fileId = "DRIVE_KEY";

(function () {
    "use strict";

    // Need drive_key.pem
    var jwt = new googleapis.auth.JWT(email,'./drive_key.pem',null,scopes);
    jwt.authorize(function (err) {
        if (err) {
            console.log(err);
            return;
        }

        // Create a service to connect with Google Drive API v2
        var service = googleapis.drive('v2');

        // Get file's metadata
        service.files.get({
            auth: jwt,
            fileId: fileId
        }, function(err, metadata) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            }

            console.log(metadata.data.title);

            // Build an output stream with the file's name
            var wstream = fs.createWriteStream(metadata.data.title + '.pdf');

            // Now, download file
            service.files.export({
                auth: jwt,
                fileId: fileId,
                //mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                mimeType: 'application/pdf'
            }, {
                encoding: null // Make sure we get the binary data
            }, function(err, buffer) {
                if (err) {
                    console.log('The API returned an error: ' + err);
                    return;
                };

                wstream.write(buffer.data);
                wstream.end();
            }).on('end', function () {
                console.log('Done');
            })
                .on('error', function (err) {
                    console.log('Error during download', err);
                })
                .pipe(dest);


        });

    });

})();