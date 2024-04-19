# WHAT is mqtt2redis?

This container will update Redis values everytime MQTT data changes.
Container includes openvpn client connection so either Redis, MQTT or both can be kept in a secure environment.

# MQTT Configuration

You can define MQTT server via env variables like so:
```
MQTT_SERVER=127.0.0.1
MQTT_PORT=1883
MQTT_USER=
MQTT_PASS=
MQTT_SUB=DDS238/#
```
The values listed are default so you can only use the env variable if you want to change it.
`MQTT_SUB` accepts string separated by `|` to listen to multiple paths.

# REDIS Configuration

You can define REDIS connection via env variables like so:
```
REDIS_CONNECTION=redis://localhost:6379
REDIS_USER=
REDIS_PASS=
REDIS_PREFIX=mqtt2redis
REDIS_DB=10
```
The values listed are default so you can only use the env variable if you want to change it.
`REDIS_CONNECTION` takes user name and password too as `redis://user:pass@server:port`.
`REDIS_PREFIX` defines the prefix that is appended to path before saved to Redis database.


# Docker

Start your container with this command replacing values to match your system:
```
docker run --name mqtt2redis -v /mnt/cache/appdata/mqtt2redis:/openvpn -e MQTT_SERVER=192.168.13.37 -e MQTT_USER=user -e MQTT_PASS=password -e REDIS_CONNECTION=redis://localhost:6379 -e REDIS_PASS=1337 -e REDIS_DB=10 -d rmamba/mqtt2redis
```
