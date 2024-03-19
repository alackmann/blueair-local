// endpoints.js
const express = require('express');
const router = express.Router();

module.exports = (deviceCache, mqttClient, appConfig) => {

    // Logging middleware
    router.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next(); // Proceed to the next middleware or route handler
    });

    // Function to validate device ID
    const isValidDeviceId = (deviceId) => /^[A-F0-9]{16}$/i.test(deviceId);

    // Endpoint 1: Request the base domain for API requests
    router.get('/v2/apidomain', (req, res) => {
        res.type('text/plain').send(appConfig.mqttBrokerApiUrl);
    });

    // Endpoint 2: Retrieve connections and MQTT server information
    router.get('/v2/device/:device_id/connections/csv/', (req, res) => {
        const deviceId = req.params.device_id;

        if (!isValidDeviceId(deviceId)) {
            return res.status(400).send('Invalid device ID');
        }

        const line1Fields = {
            field1: 'localhost',
            field2: '/123456789123/deprecated',
            field3: 'deprecated',
            field4: 'deprecated',
            field5: '2024-03-27T10%3A39%3A15.354Z',
            field6: '127.0.0.1:8080',
            field7: 'http%3A%2F%2Flocalhost%2F123456789123%2Fdeprecated'
        };

        const line2Fields = {
            mqttBrokerUrl: appConfig.mqttBrokerApiUrl,
            mqttBrokerPort: appConfig.mqttBrokerApiPort,
            mqttBrokerUsername: appConfig.mqttBrokerUsername,
            mqttBrokerPassword: appConfig.mqttBrokerPassword,
            additionalField: 'false'
        };

        const response = `${Object.values(line1Fields).join(';')}
${Object.values(line2Fields).join(';')}`;
        res.send(response);
    });

    // Endpoint 3 and 4: Firmware and MCU Firmware Updates (always empty)
    router.get(['/v2/device/:device_id/firmware/update/csv/', '/v2/device/:device_id/mcufirmware/update/csv/'], (req, res) => {
        const deviceId = req.params.device_id;

        if (!isValidDeviceId(deviceId)) {
            return res.status(400).json({ state: 400, message: 'Invalid device ID' });
        }

        res.send('');
    });

    // Function to structure and validate device data
    const structureDeviceData = (data) => {
      // Define the expected structure
      const structuredData = {
        localIp: data.localIp,
        firmware: data.firmware,
        mcu_firmware: data.mcu_firmware,
        mac: data.mac,
        wlan_ver: data.wlan_ver,
        reset_reason: data.reset_reason,
        compatibility: data.compatibility,
        model: data.model,
        calibration: data.calibration
      };

      // Validate the structured data (add your validation logic here)
      // For simplicity, I'm just checking for the presence of each field.
      for (const key in structuredData) {
        if (structuredData[key] === undefined) {
          return null; // Invalid data, return null
        }
      }

      // Return structured and validated data
      return structuredData;
    };

    // Endpoint 5: Register device information
    router.post('/v2/device/:device_id/hello/', (req, res) => {
      const deviceId = req.params.device_id;

      if (!isValidDeviceId(deviceId)) {
        return res.status(400).send('Invalid device ID');
      }

      const structuredData = structureDeviceData(req.body);
      if (!structuredData) {
        return res.status(400).send('Invalid device data');
      }

      deviceCache.set(deviceId, structuredData);


      // Construct MQTT message payload
      const mqttPayload = '1;10;2';

      // MQTT topic
      const mqttTopic = `device/${deviceId}/patate`;

      // Publish to MQTT with the retain flag set to true
      mqttClient.publish(mqttTopic, mqttPayload, { qos: 1, retain: true }, (err) => {
          if (err) {
              console.error('Error publishing to MQTT topic:', err);
              return res.status(500).json({ state: 500, message: 'Error sending MQTT message' });
          }

          console.log(`MQTT message published to ${mqttTopic}`);
          res.status(200).json({ state: 200, message: null });
      });

    });

    // Endpoint 6: Set Fan Speed
    router.post('/v2/device/:device_id/attribute/fanspeed/', (req, res) => {
        const deviceId = req.params.device_id;
        const fanSpeed = req.body.currentValue;

        if (!isValidDeviceId(deviceId)) {
            return res.status(400).json({ state: 400, message: 'Invalid device ID' });
        }

        if (!/^[0-3]$/.test(fanSpeed)) {
            return res.status(400).json({ state: 400, message: 'Invalid fan speed' });
        }

        // const hexFanSpeed = Buffer.from(fanSpeed).toString('hex');
        mqttClient.publish(`device/${deviceId}/attribute/fan_speed`, fanSpeed, { qos: 1 });
        mqttClient.publish(`device/${deviceId}/attribute/mode`, 'manual', { qos: 1 });
        res.status(200).json({ state: 200, message: null });

    });

    // Endpoint: Set Brightness
    router.post('/v2/device/:device_id/attribute/brightness/', (req, res) => {
        const deviceId = req.params.device_id;
        const brightness = req.body.currentValue;

        if (!isValidDeviceId(deviceId)) {
            return res.status(400).json({ state: 400, message: 'Invalid device ID' });
        }

        if (!/^[0-4]$/.test(brightness)) {
            return res.status(400).json({ state: 400, message: 'Invalid brightness' });
        }

        // const hexFanSpeed = Buffer.from(fanSpeed).toString('hex');
        mqttClient.publish(`device/${deviceId}/attribute/brightness`, brightness, { qos: 1 });
        res.status(200).json({ state: 200, message: null });

    });

    // Endpoint: Get Registered Devices' Information
    router.get('/v2/owner/:username/device/', (req, res) => {
        const username = req.params.username;

        if (!/\S+@\S+\.\S+/.test(username)) {
            return res.status(400).json({ state: 400, message: 'Invalid username' });
        }

        const devices = Array.from(deviceCache.entries())
            // .filter(([deviceId, deviceData]) => deviceData.username === username)
            .map(([deviceId, deviceData]) => ({
                uuid: deviceId,
                userId: 86471, // Fixed number for example
                mac: deviceData.mac,
                name: "" // Empty string as per requirement
            }));

        res.json(devices);
    });

    return router;
};
