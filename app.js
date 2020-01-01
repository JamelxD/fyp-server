const express = require('express');
const request = require('request');

const app = express();
const PORT = 3000;

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
})

app.listen(PORT, () => console.log(`Express server currently running on port ${PORT}`));