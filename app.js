const express = require('express');
const request = require('request');

const app = express();
const PORT = 3000;

app.get('/', function (req, res) {
    res.send('Hello Worldy');
})

app.get('/hello', function (req, res) { requestMade(res); })
app.get('/getLocation', function (req, res) {
    let lat = req.query.lat;
    let long = req.query.long;
    request('https://api.postcodes.io/postcodes?lon=' + long + '&lat=' + lat + '&limit=1', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var response = JSON.parse(body);
            response = response.result;

            if (response !== null || typeof response !== 'undefined') {
                const borough = response[0]['admin_district'];
                res.json({borough});
            }
        } else {
            console.log(error);
            res.json({error});
        }
    })
})

app.listen(PORT, () => console.log(`Express server currently running on port ${PORT}`));

function requestMade(res) {
    res.send('Request was made successfully');
}