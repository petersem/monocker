# Monocker
Monitors Docker (MONitors dOCKER) containers and alerts on 'state' change

![Telegram Alerts](https://raw.githubusercontent.com/petersem/monocker/master/doco/telegram.PNG)

## Features
- Telegram integration
- Pushbullet integration
- Pushover integration
- Monitors 'state' changes for all containers (every 10 seconds)
- Specific inclusions or exclusions of containers to monitor
- Optionally, only alert on state changes to (paused, exited, running (unhealthy), or dead)

## Future Considerations
- Additional messaging platform support

## Installation
```ya
version: '2.4'

services:
  monocker:
    container_name: monocker
    image: petersem/monocker
    environment:
      # Optional label to preface messages. Handy if you are running multiple versions of Monocker
      SERVER_LABEL: 'Dev'
      # Specify the messaging platform and details, or leave blank if only wanting container logs (pick one only)
      MESSAGE_PLATFORM: 'telegram@your_bot_id@your_chat_id'
      # MESSAGE_PLATFORM: 'pushbullet@your_api_key@your_device_id'
      # MESSAGE_PLATFORM: 'pushover@your_user_key@your_app_api_token'
      # MESSAGE_PLATFORM: ''
      # Optional - includes or excludes specified containers - default behaviour is false
      LABEL_ENABLE: 'false'
      # Optional - only show when container state changes to being offline (paused, exited, running (unhealthy), or dead) - default is false
      ONLY_OFFLINE_STATES: 'false'
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped
```
- For Telegram: See documentation for how to obtain ID values. 
- For Pushbullet: Open Pushbullet in a browser and get device ID from URL [Example](https://raw.githubusercontent.com/petersem/monocker/master/doco/pbdeviceid.PNG)
- For Pushover: See pushover doco for user key and app token

#### LABEL_ENABLE
This is an optional value, and defaults to false if it is not specified. This feature allows you to specify (with labels) 'either' specific containers to monitor or exclude from monitoring. 
- If it is set to false, then all containers will be monitored `except` for ones with the following label in their YAML.
```ya
    labels:
      monocker.enable: 'false'
```
- If it is set to true, `only` containers with the following label will be monitored
```ya
    labels:
      monocker.enable: 'true'
```
- If you just want to monitor everything, then set `LABEL_ENABLE: 'false'` or just leave it out altogether.


This application uses *semantic* versioning. See [here](https://semver.org/) for more details. 