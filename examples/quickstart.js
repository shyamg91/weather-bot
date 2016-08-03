'use strict';
var Forecast = require('forecast');
var NodeGeocoder = require('node-geocoder');

var forecast = new Forecast({
    service: 'forecast.io',
    key: 'be4f805183c5b8dc0f171a372a2e37ed',
    units: 'celcius', // Only the first letter is parsed
    cache: true, // Cache API requests?
    ttl: { // How long to cache requests. Uses syntax from moment.js: http://momentjs.com/docs/#/durations/creating/
        minutes: 27,
        seconds: 45
    }
});

var options = {
    provider: 'google',

    // Optional depending on the providers
    httpAdapter: 'https', // Default
    apiKey: 'AIzaSyC0be7t6u3yH5-W0qQqhrw8VY5CTc4k2Cg', // for Mapquest, OpenCage, Google Premier
    formatter: null // 'gpx', 'string', ...
};

var geocoder = NodeGeocoder(options);

let Wit = null;
try {
    // if running from repo
    Wit = require('../').Wit;
} catch (e) {
    Wit = require('node-wit').Wit;
}

const accessToken = (() => {
    if (process.argv.length !== 3) {
        console.log('usage: node examples/quickstart.js <wit-access-token>');
        process.exit(1);
    }
    return process.argv[2];
})();

// Quickstart example
// See https://wit.ai/ar7hur/quickstart

const firstEntityValue = (entities, entity) => {
    const val = entities && entities[entity] &&
        Array.isArray(entities[entity]) &&
        entities[entity].length > 0 &&
        entities[entity][0].value;
    if (!val) {
        return null;
    }
    return typeof val === 'object' ? val.value : val;
};

const actions = {
    send(request, response) {
        const {
            sessionId,
            context,
            entities
        } = request;
        const {
            text,
            quickreplies
        } = response;
        return new Promise(function(resolve, reject) {
            console.log(response.text);
            return resolve();
        });
    },
    getForecast({
        context,
        entities
    }) {
        return new Promise(function(resolve, reject) {
            var location = firstEntityValue(entities, 'location')
            if (location) {
                geocoder.geocode(location)
                    .then(function(res) {
                        forecast.get([res[0].latitude, res[0].longitude], function(err, weather) {
                            if (err) return console.dir(err);
                            context.forecast = weather.daily.summary; // we should call a weather API here
                            delete context.missingLocation;
                        });
                    })
                    .catch(function(err) {
                        console.log(err);
                    });
                return resolve(context);
            } else {
                context.missingLocation = true;
                return resolve(context);
                delete context.forecast;
            }
        });

    },
};

const client = new Wit({
    accessToken,
    actions
});
client.interactive();
