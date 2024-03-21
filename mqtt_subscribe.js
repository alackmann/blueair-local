
const http = require('http');

module.exports = function setupMqttSubscription(mqttClient, deviceCache, appConfig) {
  // MQTT topic subscription
  const topic = 'device/#';
  mqttClient.subscribe(topic, { qos: 1 });
  console.log(`Subscribed to topic: ${topic}`);

  // Handle incoming MQTT messages
  mqttClient.on('message', (topic, message) => {
    // Parse the topic to get the device ID and attribute
    const topicParts = topic.split('/');
    const deviceId = topicParts[1];
    const attribute = topicParts[3];
    const value = message.toString();

    // Check if the topic is valid for this handler
    if (topicParts.length < 5 || topicParts[4] !== 'push' || (attribute !== 'fan_speed' && attribute !== 'brightness')) {
      // Not a valid topic for this handler
      return;
    }
  
    console.log(`${topic}: ${message}`);
    console.log(`Received message for device ${deviceId} and attribute ${attribute}: ${value}`);

    // Function to update OpenHAB Item
    updateOpenHABItem(deviceId, attribute, value, appConfig);
  });

  function updateOpenHABItem(deviceId, attribute, value, appConfig) {
    // Determine the OpenHAB item name based on the attribute
    let openHABItemName;
    if (attribute === 'fan_speed') {
        openHABItemName = `BlueAir_${deviceId}_fanspeed`;
    } else if (attribute === 'brightness') {
        openHABItemName = `BlueAir_${deviceId}_brightness`;
    } else {
        // Unsupported attribute
        return;
    }

    // Prepare the REST API request to OpenHAB
    const options = {
        hostname: appConfig.openHabServerIp, // Replace with your OpenHAB server IP
        port: appConfig.openHabServerPort, // Replace with your OpenHAB server port
        // auth: `Basic ${Buffer.from(`${appConfig.openHabUsername}:${appConfig.openHabPassword}`).toString('base64')}`,
        path: `/rest/items/${openHABItemName}/state`,
        method: 'PUT',
        headers: {
            'Content-Type': 'text/plain',
            'Accept': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        if (res.statusCode !== 202) {
            console.error(`Failed to update OpenHAB item: ${openHABItemName}.`);
            console.error(`Got status code: ${res.statusCode} and error message: ${res.statusMessage}`);
        } else {
          console.info(`Successfully updated OpenHAB item: ${openHABItemName}.`);
        }
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    // Write data to request body
    req.write(value);
    req.end();
  }
};