// Description
//   Search for WLAN Clients connected to your Ruckus Zonedirector with hubot
//
// Configuration:
//   RUCKUS_ZONEDIRECTOR_URL - url to your zonedirector
//   RUCKUS_USERNAME - hubots username for zonedirector
//   RUCKUS_PASSWORD - hubots password
//
// Commands:
//   clients [pattern] - searches for WiFi clients with pattern
//
// Notes:
//   orly
//
// Author:
//   henne <henne@drunkenrecords.de>
var async = require('async');
var request = require('request').defaults({
  jar: true,
  headers: { 'Content-Type': 'application/json'},
  json: true
});

var url = process.ENV.RUCKUS_ZONEDIRECTOR_URL + '/api/public/v3_0/';
Array.prototype.extend = function (other_array) {
    /* you should include a test to check whether other_array really is an array */
    other_array.forEach(function(v) {this.push(v)}, this);
}
var req = {
  post: function(u, data, cb) {
    request({
      url: url + u,
      json: data,
      method: 'POST'
    }, cb);
  },
  get: function(u, cb) {
    request({
      url: url + u,
      method: 'GET'
    }, cb);
  },
  put: function(u, data, cb) {

  },
  delete: function(u, data, cb) {
    request({
      url: url + u,
      method: 'DELETE'
    }, cb);
  }
}

req.post('session', {
  username: process.ENV.RUCKUS_USERNAME,
  password: process.ENV.RUCKUS_PASSWORD,
  apiVersions: ["1", "2", "3"]
}, function(err, res, body) {
    console.log("loggedin"); //todo: check if loggedin :D
});

module.exports = function(robot) {
  robot.hear(/clients/i, function(r) {
    req.get('aps', function(err, res, body) {

      var calls = [];
      body.list.forEach(function(d) {
        calls.push(function(cb) {
          req.get('aps/'+d.mac+'/operational/client', function(err, res, body) {
            body.list.forEach(function(c) {
              c.apName = d.name;
            });
            cb(null, body.list);
          });
        });
      });
      async.parallel(calls, function(err, results) {
        var clients = [];
        results.forEach(function(d) {
          clients.extend(d);
        });
        r.send("Found " + clients.length + " Clients:\n" + "SSID\t\t| AP Name\t| Mac\t\t| Hostname");
        buf = "";
        clients.forEach(function(d) {
          buf += d.ssid + "\t| " + d.apName + "\t| "+ d.mac + "\t| " + d.hostName + "\n";
        });
        r.send(buf);
      });
    })
  })
}
