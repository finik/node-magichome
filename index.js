const express = require('express');
const magichome = require('./magichome');
const cfg = require('./config');
const app = express();

app.get('/:id/on', function(req, res) {
    console.log('Switching [' + req.params.id + '] on');
    magichome.power(req.params.id, true, function(err) {
        res.send({
            cmd: 'on',
            ok: true
        });
    });

});

app.get('/:id/off', function(req, res) {
    console.log('Switching [' + req.params.id + '] off');
    magichome.power(req.params.id, false, function(err) {
        res.send({
            cmd: 'off',
            ok: true
        });
    });

});

app.get('/:id/state', function(req, res) {
    console.log('Get [' + req.params.id + '] state');
    magichome.state(req.params.id, function(err, data) {
        res.send({
            cmd: 'state',
            ok: true,
            data: data
        });
    });

});

app.get('/:id/color', function(req, res) {
    const colors = {
        r: +req.query.r,
        g: +req.query.g,
        b: +req.query.b,
        ww: +req.query.ww,
        cw: +req.query.cw
    };
    console.log('Set [' + req.params.id + '] color to ', colors);
    magichome.color(req.params.id, colors, function(err) {
        res.send({
            cmd: 'color',
            ok: true
        });
    });

});

app.listen(3000, function(err) {
    console.log('LED controller listening on port 3000!');
    console.log(cfg);
    magichome.init(cfg, function() {
        console.log('Magic home initialized with', cfg);
    });
});

