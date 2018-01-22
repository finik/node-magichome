'use strict';
var net = require('net');

var cfg = {};

const POWER_CMD = 0x71;
const COLOR_CMD = 0x31;
const MODE_CMD = 0x61;
const STATE_CMD = 0x81;
const TRUE = 0xf0;
const FALSE = 0x0f;
const ON = 0x23;
const OFF = 0x24;

function sendRequest(id, request, callback) {
    var socket = new net.Socket();
    var client = cfg[id];

    console.log(request);

    var response;

    if (!client) {
        return callback(new Error('No client with this id!'));
    }

    socket.on("error", function(err) {
        //console.log('socket.error', err);
        return callback(err);
    });

    socket.on("close", function(had_error) {
        // console.log('socket.close', had_error);
        return callback(null, response);
    });

    socket.on("data", function(data) {
        console.log('Received response', data.toString('hex'));
        response = Array.prototype.slice.call(data, 0);
        socket.end();
    });

    socket.on("end", function() {
        // console.log('socket.end');
    });

    socket.on("connect", function() {
        var checksum = 0;
        for (var i = 0; i < request.length; i++) {
            checksum += request[i];
        }
        console.log(checksum);
        checksum = checksum & 0xff;
        request.push(checksum);
        var buffer = new Buffer(request);
        console.log('Sending request to controller', buffer.toString('hex'));
        socket.write(buffer);
    });

    socket.connect(client.port, client.host);
}

function init(_cfg, callback) {
    cfg = _cfg;

    return callback && callback();
}

function power(id, state, callback) {
    var request;

    if (state) {
        request = [POWER_CMD, ON, FALSE];
    } else {
        request = [POWER_CMD, OFF, FALSE];
    }

    sendRequest(id, request, function(err, response) {
        if (err) return callback(err);
        if (response[0] != TRUE) return callback(new Error("Command failed"));
        callback();
    });
}

const patterns = {
    0x25: 'seven_color_cross_fade',
    0x26: 'red_gradual_change',
    0x27: 'green_gradual_change',
    0x28: 'blue_gradual_change',
    0x29: 'yellow_gradual_change',
    0x2a: 'cyan_gradual_change',
    0x2b: 'purple_gradual_change',
    0x2c: 'white_gradual_change',
    0x2d: 'red_green_cross_fade',
    0x2e: 'red_blue_cross_fade',
    0x2f: 'green_blue_cross_fade',
    0x30: 'seven_color_strobe_flash',
    0x31: 'red_strobe_flash',
    0x32: 'green_strobe_flash',
    0x33: 'blue_stobe_flash',
    0x34: 'yellow_strobe_flash',
    0x35: 'cyan_strobe_flash',
    0x36: 'purple_strobe_flash',
    0x37: 'white_strobe_flash',
    0x38: 'seven_color_jumping',
    0x60: 'custom',
    0x61: 'color',
    0x62: 'color'
};

function state(id, callback) {
    var request = [STATE_CMD, 0x8a, 0x8b];
    sendRequest(id, request, function(err, response) {
        if (err) return callback(err);

        var _state = {
            power: (response[2] == ON)?true:false,
            pattern: patterns[response[3]],
            ww: response[9],
            delay: response[5]
        };

        if (_state.pattern == 'color') {
            _state.red = response[6];
            _state.green = response[7];
            _state.blue = response[8];
        }

        console.log(_state);

        callback(null, _state);
    });
}

function color(id, colors, callback) {
    var client = cfg[id];

    if (!client) {
        return callback(new Error('No client with this id!'));
    }

    var request = [COLOR_CMD];
    // request = request.concat([0, 0, 0]);
    request = request.concat([colors.r, colors.g, colors.b]);

    if (client.type == 'rgbw') {
        request = request.concat([colors.ww || 0, 0, FALSE ]);
    }

    sendRequest(id, request, function(err, response) {
        if (err) return callback(err);
        callback();
    });

}

module.exports = {
    init: init,
    power: power,
    state: state,
    color: color
};