# HUBOT Ruckus Chatops Plugin
This plugin intents to make life easier for people running Ruckus Wireless infrastructure.

## Features
  - List clients / searches clients for mac address, ip address, hostname or SSID
  - Shows details on WiFi Clients

### Usage
You have to have set the following Environment variables: RUCKUS_USERNAME, RUCKUS_PASSWORD, RUCKUS_ZONEDIRECTOR_URL
```
clients for <pattern> - searches for WiFi clients whos Hostname, SSID, AP-Name, IP, IPv6 or MAC starts with pattern
clients - retrieves all WiFi clients
client <mac> - retrieves details for WiFi client with <mac> Address
```
