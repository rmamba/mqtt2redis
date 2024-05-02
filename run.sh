#!/bin/bash

# open vpn connection for redis server if client.ovpn is present
if [ -e "/openvpn/client.ovpn" ]
then
    openvpn --config /openvpn/client.ovpn --reneg-sec ${OPENVPN_REGEN_SEC:-0} &
fi

# run the main app
node server.js

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
