const express = require('express');
const request = require('request');
const AWS = require("aws-sdk");

const app = express();
const PORT = 3000;

const sgMail = require('@sendgrid/mail');
const bodyParser = require('body-parser');
app.use(bodyParser.json());  
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
AWS.config.update({ region: 'eu-west-1' });
AWS.config.getCredentials(function (err) {
  if (err) console.log(err.stack);
});

var ddb = new AWS.DynamoDB({ apiVersion: 'latest' });
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
        res.json({ borough });
        return;
      }

      res.status(500).send('Location is not in the United Kingdom.')
    } else {
      console.log(error);
      res.json({ error });
    }
  })
});

app.get('/getBoroughInfo', function (req, res) {
  console.log('/getBoroughInfo was called');
  let boroughName = req.query.boroughName;
  var params = {
    TableName: 'boroughs',
    Key: {
      'name': { S: boroughName }
    },
    AttributesToGet: [
      'id',
    ],
  };

  ddb.getItem(params, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      if (data.Item !== null && typeof data.Item !== 'undefined') {
        const boroughId = data.Item.id.N;
        var params = {
          TableName: 'borough_info',
          Key: {
            'borough_id': { N: boroughId }
          },
        };

        ddb.getItem(params, function (err, data) {
          if (err) {
            console.log("Error", err);
          } else {
            if (Object.keys(data).length === 0) {
              res.status(200).json({
                double_yellow_parking_limit: { S: '' },
                single_yellow_parking_limit: { S: '' },
                car_park_access: { S: '' },
                congestion_zone: { S: '' },
                disabledbays: { S: '' },
                p_and_d: { S: '' },
                additional_info: { S: '' },
                parking_strictness: { S: '' },
                id: { N: '-1' },
                borough_id: { N: boroughId }
              });
            }

            res.status(200).json(data.Item);
          }
        });
      } else {
        res.status(500).send('Invalid borough.')
      }
    }
  });
});

app.get('/getDisabledParkingLocations', function (req, res) {
  console.log('/getDisabledParkingLocations was called');
  var params = {
    TableName: 'disabled_parking_locations',
    Select: "ALL_ATTRIBUTES"
  };

  ddb.scan(params, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      res.json(data);
    }
  });
});

app.post('/sendLocationEmail', function (req, res) {
  console.log('/sendLocationEmail was called');
  const marker = req.body.data;
  if (marker === null || typeof marker == 'undefined') {
    res.status(500).send('Location parameter missing');
  }

  const msg = {
    to: 'kakaotrading@gmail.com',
    from: 'kakaotrading@gmail.com',
    subject: 'FYP New Disabled Parking Space Request',
    text: JSON.stringify(marker),
  };

  (async () => {
    try {
      await sgMail.send(msg);
    } catch (err) {
      res.status(500).send(err.toString());
      console.error(err.toString());
    }
  })();

  res.status(200);
});

app.get('/test', function (req, res) {
  console.log('HERE!');
  res.send('Hi');
});


app.listen(PORT, () => console.log(`Express server currently running on port ${PORT}`));