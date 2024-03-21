/**
 * OpenHAB Rules to accompany the BlueAir Node local server 
 * https://github.com/alackmann/blueair-local
 * 
 * Copy this file into conf/automation/js folder in OpenHAB
 * 
 */

// Import necessary OpenHAB classes and objects
const { actions, log, items, rules, triggers } = require('openhab');

// Constants for the air purifier service
const timeout = 3000;
const logger = log('blueair');


/** Rule 1: Query air purifier devices and create OpenHAB items
  - Queries /v2/owner/:email/device endpoint of local api (eg. won't work on production API from BlueAir due to lack of auth)
  - creates new Items in the format BlueAir_:uuid_:attr (where :attr is either fanspeed or brightness)
  - runs every 15 mins
*/
rules.JSRule({
  name: "Query Air Purifier Devices",
  description: "",
  triggers: [triggers.GenericCronTrigger("0 0/15 * * * ?")], // Trigger every 5 minutes
  tags: [],
  id: "AirPurifier_DeviceQuery",
  execute: (event) => {
    let response = JSON.parse(actions.HTTP.sendHttpGetRequest("http://api.blueair.io/v2/owner/anyone@email.com/device/", {}, timeout));
    if(response == null) {
      logger.debug(`AirPurifier_DeviceQuery API call returned null`);
      return;
    }
    if(Array.isArray(response)) {
      response.forEach(device => {
        logger.debug(`Found Air Purifier device ${device.uuid}`);
        ['fanspeed', 'brightness'].forEach(attr => {
          let itemName = `BlueAir_${device.uuid}_${attr}`;
          if(!items.getItem(itemName, true)) {
            let newItem = {
              type: "Number",
              name: itemName,
              label: `BlueAir ${device.uuid} ${attr}`,
              groups: ['Blueair'],
              tags: ['Blueair_Control']
            };
            logger.info(`BlueAir - Found new device, creating item '${itemName}'`);
            items.addItem(newItem);
          }
        });
      });
    }
  }
});

/** Rule 2: Handle changes in air purifier controls
 * - when command are sent to Items created by the rule above (identified by the Group they are in), 
 *   sends the command to the device via MQTT. This could be achieved via MQTT Things directly, 
 *   but it seemed simpler to encapsulate the logic in one place - we needed a HTTP server anyway
 *   for 
 * 
 * */ 
rules.JSRule({
  name: "Handle Air Purifier Control Changes",
  description: "",
  triggers: [triggers.GroupCommandTrigger("Blueair")],
  tags: [],
  id: "AirPurifier_ControlChange",
  execute: (event) => {
    let itemName = event.itemName;
    let itemNameSplit = itemName.split('_');
    let deviceUuid = itemNameSplit[1];
    let attribute = itemNameSplit[2];
    let postUrl = `http://api.blueair.io/v2/device/${deviceUuid}/attribute/${attribute}/`;

    // check if attribute is fanspeed, if so, change it now to fan_speed
    if(attribute == 'fanspeed') {
      attribute = 'fan_speed';
    };
    eventCommand = parseInt(event.receivedCommand);

    let postBody = {
      currentValue: eventCommand.toString(),
      scope: "device",
      defaultValue: event.receivedCommand.toString(),
      name: attribute,
      uuid: deviceUuid
    };

    actions.HTTP.sendHttpPostRequest(postUrl, 'application/json', JSON.stringify(postBody), {}, timeout);
    logger.info(`Updated Air Purifier ${deviceUuid} for attribute ${attribute} to: ` + eventCommand);
  }
});