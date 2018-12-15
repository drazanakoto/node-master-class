'use strict';

const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');


// All the server logic for the http server
const httpRequestHandler = (req, res) => {

    // Get the Url and parse it
    const parsedUrl = url.parse(req.url, true);

    //Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    const queryStringObject = parsedUrl.query;

    //Get the HTTP Method
    const method = req.method.toLocaleLowerCase();

    //get the headers as an object
    const headers = req.headers;

    // get the payload, if any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });

    req.on('end', () => {
        buffer += decoder.end();

        // choose the handler this request should to go. If one ist not found, use the notFound handler
        const callback = router[trimmedPath];
        const chooseHandler = typeof (callback) === 'undefined' ? handlers.notFound : callback;

        // construct the data object to send to the handler
        const data = {
            trimmedPath,
            queryStringObject,
            method,
            headers,
            payload: buffer
        };

        chooseHandler(data, (statusCode, payload) => {
            //use the status code called back by the handler or default to 200
            statusCode = typeof (statusCode) === 'number' ? statusCode : 200;

            //use the paylod called back by the handler or default to an empty object
            payload = typeof (payload) !== 'undefined' ? payload : {};

            // Convert the payload to a string
            const payloadString = JSON.stringify(payload);

            // return the response
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = statusCode;
            res.end(payloadString);

            // log the request payload
            console.log('Response ', statusCode, payloadString);
        });
    })
};


// Instance the HTTP server
const httpServer = http.createServer(httpRequestHandler);

// Start HTTP server
httpServer.listen(config.httpPort, () => {
    console.log(`The server http is listening on port ${config.httpPort} in ${config.envName} now`);
});

// define the handlers
const handlers = {};

// Sample handlers
handlers.hello = (data, callback) => {
    // Callback a http status and a payload object
    callback(200, { message : 'Hello World!'});
};

// Not found handler
handlers.notFound = (data, callback) => {
    callback(404);
};


// define a request router
const router = {
    'hello': handlers.hello,
};