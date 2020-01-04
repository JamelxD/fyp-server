const express = require('express');
const request = require('request');
const AWS = require("aws-sdk");

const app = express();
const PORT = 3000;

AWS.config.update({region: 'eu-west-1'});
AWS.config.getCredentials(function(err) {
    if (err) console.log(err.stack);
});

var ddb = new AWS.DynamoDB({apiVersion: 'latest'});
app.get('/getLocation', function (req, res) {
    let lat = req.query.lat;
    let long = req.query.long;
    request('https://api.postcodes.io/postcodes?lon=' + long + '&lat=' + lat + '&limit=1', function (error, response, body) {
        console.log('/getLocation was called');
        if (!error && response.statusCode == 200) {
            var response = JSON.parse(body);
            response = response.result;

            if (response !== null && typeof response !== 'undefined') {
                const borough = response[0]['admin_district'];
                res.json({borough});
                return;
            }

            res.status(500).send('Location is not in the United Kingdom.')
        } else {
            console.log(error);
            res.json({error});
        }
    })
});

app.get('/getBoroughInfo', function (req, res) {
    let borough = req.query.borough;
    var params = {
        TableName: 'borough_info',
        Key: {
            'borough_id': { N: borough }
        },
        AttributesToGet: [
            'disabled_badge_parking_limit',
        ],
    };

    ddb.getItem(params, function(err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            res.json({data});
        }
    });
});

app.listen(PORT, () => console.log(`Express server currently running on port ${PORT}`));