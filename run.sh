#!/bin/bash

# open vpn connection for redis server
openvpn --config /openvpn/client.ovpn &

# run the main app
node server.js

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
