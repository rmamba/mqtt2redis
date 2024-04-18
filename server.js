const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const redis = require('redis');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const publishValues = (process.env.PUBLISH_VALUES || 'dimming|temp|state|sceneId').split('|');

const DEBUG = (process.env.DEBUG || 'false') === 'true';
const WEBUI_PORT = parseInt(process.env.WEBUI_PORT || '38900');
const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID || 'wizLights';
const MQTT_PREFIX = process.env.MQTT_PREFIX || 'wiz';
const MQTT_SERVER = process.env.MQTT_SERVER || '127.0.0.1';
const MQTT_PORT = process.env.MQTT_PORT || '1883';
const MQTT_SUB = process.env.MQTT_SUB || 'mqtt2redis/#';
// redis://user:pass@server:port
const REDIS_CONNECTION = process.env.REDIS_CONNECTION || 'redis://localhost:6379';
const REDIS_USER = process.env.REDIS_USER;
const REDIS_PASS = process.env.REDIS_PASS;
const REDIS_PREFIX = process.env.REDIS_PREFIX || 'mqtt2redis';
const REDIS_DB = parseInt(process.env.REDIS_DB || '10');

let UPDATE_INTERVAL = parseInt(process.env.UPDATE_INTERVAL || '1000');
if (UPDATE_INTERVAL < 250) {
    UPDATE_INTERVAL = 250;
}

let mqttClient;
let redisClient;
const cache = {};

const updateCache = (path, data) => {
    const d = path.split('/');
    let c = cache;
    d.forEach((s, i) => {
        if (!c[s]) {
            c[s] = {};
        }
        if (i < d.length-1) {
            c = c[s];
            return;
        }
        c[s] = data;
    });
}

const run = async () => {
    const mqttConfig = {
        clientId: MQTT_CLIENT_ID,
        rejectUnauthorized: false,
        keepalive: 15,
        connectTimeout: 1000,
        reconnectPeriod: 500,
    };

    if (process.env.MQTT_USER) {
        mqttConfig.username = process.env.MQTT_USER;
    }
    if (process.env.MQTT_PASS) {
        mqttConfig.password = process.env.MQTT_PASS;
    }

    console.log(`Connecting to MQTT server ${MQTT_SERVER}:${MQTT_PORT} ...`);
    mqttClient = mqtt.connect(`mqtt://${MQTT_SERVER}:${MQTT_PORT}`, mqttConfig);

    // mqttClient.on('connect', () => {
    //     console.log('.');
    // });
    
    mqttClient.on('error', (err) => {
        console.log(err);
        process.exit(1);
    });

    mqttClient.on('message', (topic, payload) => {
        updateCache(topic, payload.toString());
        redisClient.set(`${REDIS_PREFIX}/${topic}`, payload.toString());
    });
    
    while (!mqttClient.connected) {
        await sleep(1000);
    }

    console.log();
    console.log('MQTT server connected...');
    const subs = MQTT_SUB.split('|');
    subs.forEach(sub => {
        console.log(`Subscribing too ${sub}`);
        mqttClient.subscribe(sub);
    });

    console.log(`Connecting to ${REDIS_CONNECTION}...`);
    const redisConfig = {
        database: REDIS_DB,
        url: REDIS_CONNECTION,
    };
    if (REDIS_USER) {
        redisConfig.username = REDIS_USER;
    }
    if (REDIS_PASS) {
        redisConfig.password = REDIS_PASS;
    }
    redisClient = redis.createClient(redisConfig);

    redisClient.on('error', err => console.log('Redis Client Error', err));

    await redisClient.connect();

    console.log('REDIS server connected...');

    console.log(`Setting up express server on port ${WEBUI_PORT}...`);
    const app = express();
    app.use(express.json());
    app.use(cors());

    app.get('/', function (req, res) {
        res.setHeader("Content-Type", "application/json");
        res.status(200);
        res.json(cache);
    });

    app.listen(WEBUI_PORT)
    console.log('Done...');
}

run();
