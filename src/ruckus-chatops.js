// Description
//   Search for WLAN Clients connected to your Ruckus Zonedirector with hubot
//
// Configuration:
//   RUCKUS_ZONEDIRECTOR_URL - url to your zonedirector
//   RUCKUS_USERNAME - hubots username for zonedirector
//   RUCKUS_PASSWORD - hubots password
//
// Commands:
//   clients for <pattern> - searches for WiFi clients whos SSID, AP-Name, IP, IPv6 or MAC starts with pattern
//   clients - retrieves all WiFi clients
//   client <mac> - retrieves details for WiFi client with <mac> Address
//
// Author:
//   henne <henne@drunkenrecords.de>
var async = require('async');
var request = require('request').defaults({
  jar: true,
  headers: { 'Content-Type': 'application/json'},
  json: true
});

var url = process.env.RUCKUS_ZONEDIRECTOR_URL + '/api/public/v3_0/';

Array.prototype.extend = function (o) {
    o.forEach(function(e) {this.push(e)}, this);
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

var loggedin = false;

var getAllClients = function(cb) {
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
      cb(clients);
    });
  })
}

var getClient = function(mac, cb) {
  getAllClients(function(clients) {
    clients.forEach(function(c) {
      if(c.mac === mac) {
        if(typeof(cb) === 'function') {
          cb(c);
        }
      }
    });
  });
}
var listClients = function(r, clients, cb) {
  r.send("Found " + clients.length + " Clients:\n" + "Mac | SSID | AP Name | Hostname | IPv4 | IPv6");
  buf = "";
  clients.forEach(function(d) {
    buf += d.mac + " | " + d.ssid + " | " + d.apName + " | " + d.hostName + " | " + d.ipAddress + " | " + d.ipv6Address + "\n";
  });
  r.send(buf);
  if(typeof(cb) === 'function') {
    cb(null);
  }
}
module.exports = function(robot) {
  req.post('session', {
    username: process.env.RUCKUS_USERNAME,
    password: process.env.RUCKUS_PASSWORD,
    apiVersions: ["1", "2", "3"]
  }, function(err, res, body) {
      if(res.statusCode === 200) {
        loggedin = true;
        robot.messageRoom("#atca", "Ruckus API: Logged In");
      } else {
        robot.messageRoom("#atca", "Ruckus API: Login failed");
      }
  });
  robot.hear(/^clients for (.*)/i, function(r) {
    if(!loggedin) {
        r.send("Not loggedin");
        return;
    }
    var query = r.match[1];
    getAllClients(function(clients) {
      var buf = [];
      // Search for SSID, AP-Name, IP, IPv6 or MAC
      clients.forEach(function(c) {
        if(c.ssid.startsWith(query) ||
        c.mac.startsWith(query) ||
        c.ipAddress.startsWith(query) ||
        (c.ipv6Address && c.ipv6Address.startsWith(query)) ||
        c.apName.startsWith(query)) {
          buf.push(c);
        }
      });
      listClients(r, buf);

    })
  });
  robot.hear(/^client ([a-z0-9]{2}(:[a-z0-9]{2}){5})/i, function(r) {
    if(!loggedin) {
        r.send("Not loggedin");
        return;
    }
    getClient(r.match[1], function(c) {
      var buf = "";
      buf += "Client " + c.mac + "\n";
      buf += "  IPv4:       " + c.ipAddress + "\n";
      buf += "  IPv6:       " + c.ipv6Address + "\n";
      buf += "  SSID:       " + c.ssid + "\n";
      buf += "  AP Name:    " + c.apName + "\n";
      buf += "  Hostname:   " + c.hostName + "\n";
      buf += "  Radio Mode: " + c.radioMode + "\n";
      buf += "  OS Type:    " + c.osType + "\n";
      r.send(buf);
    });
  })
  robot.hear(/^clients$/i, function(r) {
    if(!loggedin) {
        r.send("Not loggedin");
        return;
    }
    getAllClients(function(clients) {
      listClients(r, clients);
    });
  })
}
