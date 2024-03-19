## BlueAir Device API Documentation

### Description
The BlueAir Device API provides various endpoints to interact with BlueAir IoT devices. It allows querying domain information, registering devices, retrieving connection information, and checking for firmware updates.

---

### 1. Request Base Domain for API Requests

**Endpoint:** `GET /v2/apidomain`

**Description:**  
Retrieves the fully qualified domain name (FQDN) for future API requests.

**Arguments:** None.

**Example Response:**  
- **Status Code:** 200 OK
- **Content-Type:** text/plain
- **Response Body:** `api.blueair.io`

---

### 2. Register Device Information on Central Server on Start-Up

**Endpoint:** `POST /v2/device/{device_id}/hello/`

**Description:**  
Registers a device's information on the central server during the device's startup process.

**Arguments:**  
- `{device_id}`: The UUID of the device.
- **Request Body:** JSON payload containing device information.

**Example Response:**  
- **Status Code:** 200 OK
- **Content-Type:** application/json
- **Response Body:** [Not specified in the capture data]

---

### 3. Retrieve Connections and MQTT Server Information

**Endpoint:** `GET /v2/device/{device_id}/connections/csv/`

**Description:**  
Fetches connection details and MQTT server information for the specified device.

**Arguments:**  
- `{device_id}`: The UUID of the device.

**Example Response:**  
- **Status Code:** 200 OK
- **Content-Type:** text/csv
- **Response Body:** [CSV formatted data, details not specified in the capture]

---

### 4. Check for Device Firmware Updates

**Endpoint:** `GET /v2/device/{device_id}/firmware/update/csv/`

**Description:**  
Checks if there are any firmware updates available for the specified device.

**Arguments:**  
- `{device_id}`: The UUID of the device.

**Example Response:**  
- **Status Code:** 200 OK
- **Content-Type:** text/csv
- **Response Body:** Empty (Content-Length: 0)

---

### 5. Check for MCU Firmware Updates

**Endpoint:** `GET /v2/device/{device_id}/mcufirmware/update/csv/`

**Description:**  
Checks if there are any MCU firmware updates available for the specified device.

**Arguments:**  
- `{device_id}`: The UUID of the device.

**Example Response:**  
- **Status Code:** 200 OK
- **Content-Type:** text/csv
- **Response Body:** Empty (Content-Length: 0)

---

**Note:** The exact response format and content may vary based on the device's state and configuration. The provided documentation is based on the observed HTTP traffic and might not cover all possible scenarios or responses from the server.