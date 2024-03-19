// index.js
const express = require('express');
const bodyParser = require('body-parser');
const mqtt = require('mqtt');
const endpoints = require('./endpoints');

const app = express();
const port = 3000;

// MQTT Connection details (from Endpoint 2)
/*
const mqttBrokerUrl = 'broker-gw-us.blueair.io';
const mqttBrokerPort = 1883;
const mqttBrokerUsername = 'device';
const mqttBrokerPassword = 'rxdK95rPqB';
*/

/* a function that returns a config object named 'appConfig' that reads in the env vars from the container and sets internal variables for use in other parts of the application.
  Env vars:
    - MQTT_BROKER_DOCKER_URL
    - MQTT_BROKER_DOCKER_PORT
    - MQTT_BROKER_USERNAME
    - MQTT_BROKER_PASSWORD
    - MQTT_BROKER_API_URL - should default to MQTT_BROKER_DOCKER_URL if not set
    - MQTT_BROKER_API_PORT - should default to MQTT_BROKER_DOCKER_PORT if not set
 */
const appConfig = {
  mqttBrokerDockerUrl: process.env.MQTT_BROKER_DOCKER_URL || 'mqtt://mqtt-broker',
  mqttBrokerDockerPort: process.env.MQTT_BROKER_DOCKER_PORT || 1883,
  mqttBrokerUsername: process.env.MQTT_BROKER_USERNAME,
  mqttBrokerPassword: process.env.MQTT_BROKER_PASSWORD,
  mqttBrokerApiUrl: process.env.MQTT_BROKER_API_URL || process.env.MQTT_BROKER_DOCKER_URL,
  mqttBrokerApiPort: process.env.MQTT_BROKER_API_PORT || process.env.MQTT_BROKER_DOCKER_PORT
};

const mqttOptions = {
  host: appConfig.mqttBrokerDockerUrl,
  port: appConfig.mqttBrokerDockerPort,
  username: appConfig.mqttBrokerUsername,
  password: appConfig.mqttBrokerPassword,
  clientId: 'node-blueair-local',
  reconnectPeriod: 1000, // Attempt to reconnect every 
};
console.log(appConfig);
console.log(mqttOptions);

// Connect to MQTT broker
let mqttClient = mqtt.connect(mqttOptions);

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
});

mqttClient.on('reconnect', () => {
  console.log('Attempting to reconnect to MQTT broker');
});

mqttClient.on('error', (error) => {
  console.error('Error connecting to MQTT broker:', error);
});

mqttClient.on('offline', () => {
  console.log('MQTT client is offline');
});

mqttClient.on('end', () => {
  console.log('MQTT client disconnected');
});


// Set up in-memory cache...
const deviceCache = new Map();

app.use(bodyParser.json());
app.use('/', endpoints(deviceCache, mqttClient, appConfig));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});