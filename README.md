# Blueair Air Purifier IoT Controller

## Project Overview
This Node.js project controls a Blueair Air Purifier via MQTT. It provides an HTTP server with endpoints for device interaction, including API domain fetching, device connection management, firmware updates, fan speed setting, and brightness adjustment.

I have a **Blue Air 205** (actually a few of them) that allow some limited control from an app and via API. I generally use [OpenHAB](https://openhab.org) to control my smarthome and have previously created a collection of scripts to control Blue Air devices (see: [alackmann/openhab-blueair](https://github.com/alackmann/openhab-blueair)). This project is different.

When using this project, you no longer require the Blue Air provided cloud service (APIs and MQTT server). Instead you will run your own API server locally (packaged as a docker-compose file) which will handle HTTP commands sent from the Air Purifier and an MQTT broker that the Blue Air devices rely on for commands (fan speed etc).

### How it works
Blue Air Air Purifiers phone home to an `api.blueair.io` address on start to get some configuration information (the API domain, MQTT server, check for firmware updates etc). The node app stubs all these calls so you can serve them locally - as long as you can override the `api.blueair.io` DNS lookup to point to your own server.

The Air Purifier expects to connect to an MQTT server for fan_speed commands and some other attributes. It also sends some data to the same. The api provides a new set of login information so these requests go to your local network, not the internet.

The node app also provides some HTTP endpoints so you can easily send MQTT commands to the device. You could just as easily send MQTT commands directly, but this makes sure they're formatted correctly etc.


### Features
- HTTP Server (Node.js) REST API endpoints for managing device configuration and control
- MQTT communication with the Blueair Air Purifier
- Docker-compose configuration

## Technology Stack
- Node.js
- Express
- MQTT
- Docker

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js (for local runs)
- An ability to run a split DNS or override DNS for local DNS queries

### Installation
1. Clone the repository and navigate to the directory:
   ```bash
   git clone [repository_url]
   cd [repository_name]
   ```
   Adjust the username & password for the MQTT Broker in the docker-compose file if you see fit. You shouldn't expose any of this to the internet, but it doesn't hurt to have a stronger username and password!

1. Using Docker:
   ```bash
   docker-compose up
   ```
   This will pull the Node application and MQTT broker images. Note: Node will start on port 80 (The Blue Air devices expect to use a non-encrypted web connection). If you're already using that port on your server, you'll need to reverse proxy (Traefik is great) or add IP addresses.

1. Update your local DNS

   However your local network runs, you'll need to change the DNS resolution for `api.blueair.io` to resolve to the IP for the NodeJS docker container you just started. Using the included docker-compose file, this will be the IP address of the machine you started it on.

   To confirm it's working, you should be able to ping `api.blueair.io` and it should resolve as your local server IP.

1. To confirm it's all working, you should be able to power cycle your Blue Air device. Run 
   ```
   docker logs blueair-local-app-1
   ```
   and you should see the HTTP requests from your device. There are 5 in total on start and they complete within about 10-20 seconds. 
   
   If you check the logs for the MQTT server after this, you should see SUBSCRIBE activity happening from your device. Assuming your DNS is updated, you can access the EMQX Dashboard at http://api.blueair.io:18083 (username: admin password: public - you'll be asked to change it on first login). If you want to look at the MQTT commands and data, [MQTT Explorer](https://mqtt-explorer.com/) is a good option.

## How to use

Now that you have a local api server for your Blue Air, it no longer reaches outside of your network for commands. Hooray! Well, yes, but:

* no more firmware updates. To be honest, I doubt there are many anymore, but as your device isn't phoning home, it'll never know if there are
* Blue Air app control won't work. I control mine thru Home Automation using OpenHAB, so I don't need the app. If you do, this isn't for you. 
* Home Assistant, OpenHAB or other HA users who already have a Home interface - read on!

Assumimg you're still with me - now you have a local API (no authentication! It's assumed your local network is secure enough!)

## Configuration
Environment variables in `docker-compose.yml`

- `MQTT_BROKER_DOCKER_URL`: MQTT broker URL of the docker container. You don't need to change this
- `MQTT_BROKER_DOCKER_PORT`: MQTT broker port. As above, leave it alone
- `MQTT_BROKER_USERNAME`: MQTT broker username. Adjust as you see fit
- `MQTT_BROKER_PASSWORD`: MQTT broker password. Change as you need
- `MQTT_BROKER_API_URL`: MQTT broker API URL that the Blue Air devices will connect to MQTT using. It's easiest to leave as `api.blueair.io` as you've setup DNS for this above. But you could change this to anything that will resolve to your MQTT broker.
- `MQTT_BROKER_API_PORT`: MQTT broker API port (defaults to `MQTT_BROKER_DOCKER_PORT`). Should be the accessible port from your local network. 

## HTTP API Endpoints
### Device boot and configuration
These endpoints are requested by a device anytime it starts. It sends a unique/consistent `:device_id` in each request.
- `GET /v2/apidomain`: Will return whatever you set for `MQTT_BROKER_API_URL`
- `GET /v2/device/:device_id/connections/csv/`: Returns some configuration and setup information for the Blue Air device. Key information here is the MQTT server info
- `GET /v2/device/:device_id/firmware/update/csv/`: Checking for firmware updates. Will always return empty now.
- `GET /v2/device/:device_id/mcufirmware/update/csv/`: More firmware. Also empty.
- `POST /v2/device/:device_id/hello/`: Sends some setup and identity information from your device(s)

### Control Commands
Use these endpoints to view the devices connected to your network and to control the fan_speed and LED brightness.
- `GET /v2/owner/:email/device/`: Replace `:email` with any valid email (test@domain.com will do) to see any registered devices. This will allow you to get the valid `:device_id` for any of these requests
- `POST /v2/device/:device_id/attribute/fanspeed/`: Set fan speed. Expects a JSON payload like:
  ```
  {
	"currentValue": "<fan_speed>",
	"scope": "device",
	"defaultValue": "1",
	"name": "fan_speed",
	"uuid": "<device_id>"
  }
  ```
  Replace fan_speed and device_id placeholders. 
  * `:fan_speed`: an integer between 0-3
  * `:device_id`: will be same one you received in the owner endpoint above.

- `POST /v2/device/:device_id/attribute/brightness/`: Adjust brightness of the LED. Expects a JSON payload like:
  ```
  {
	"currentValue": "<brightness>",
	"scope": "device",
	"defaultValue": "1",
	"name": "brightness",
	"uuid": "<device_id>"
  }
  ```
  * `:brightness`: an integer between 0-4
  * `:device_id`: will be same one you received in the owner endpoint above.

## What else
1. When I get time, I'll add some integration information for OpenHAB
1. If there's anyone using Home Assistant with Blue Air and wants to add some HA config notes, please do.
1. It probably possible to stub out the whole of the mobile app requests as well, so it works, at least on your own network - but I don't need it, so haven't done so.

## Contributing
Contributions are welcome. Please open an issue first for major changes.

## License
[GNU v3](LICENSE)