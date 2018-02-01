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

(function () {
    "use strict";

    // Need drive_key.pem
    var jwt = new googleapis.auth.JWT(email,'./drive_key.pem',null,scopes);
    jwt.authorize(function (err) {
        if (err) {
            console.log(err);
            return;
        }

        // Make an authorized request to list Drive files.
        var service = googleapis.drive('v2');

        service.files.get({
            auth: jwt,
            fileId: "ONE_FILE_DRIVE_KEY"
        }, function(err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            }

            var data = response.data;
            console.log(data.title);

            // To export file instead of read title:
            // https://github.com/google/google-api-nodejs-client/blob/master/samples/drive/export.js

        });

    });

})();