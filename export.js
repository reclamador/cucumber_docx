var googleapis = require('googleapis');
var googleAuth = require('google-auth-library');
var fs = require('fs');

(function () {
    "use strict";

// Load client secrets from a local file.
    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }

// Authorize a client with the loaded credentials, then call the
// Drive API.
        authorize(JSON.parse(content));
    });

    var authorize = function (credentials) {
        var auth = new googleAuth();
        var oauth2Client = new auth.OAuth2();
        var jwt = new googleapis.auth.JWT(
            credentials.client_email,
            null,
            credentials.private_key,
            ['https://www.googleapis.com/auth/drive']);

        jwt.authorize(function (err, tokens) {
            if (err) {
                console.log(err);
                return;
            }

            // Make an authorized request to list Drive files.
            var service = googleapis.drive('v2');

            service.files.list({
                auth: jwt,
                maxResults: 10,
            }, function (err, response) {
                if (err) {
                    console.log('The API returned an error: ' + err);
                    return;
                }

                var files = response.data.items;
                if (files.length === 0) {
                    console.log('No files found.');
                } else {
                    console.log('Files:');
                    for (var i = 0; i < files.length; i++) {
                        var file = files[i];
                        console.log('%s (%s)', file.title, file.id);
                    }
                }
            });
        });
    };
})();