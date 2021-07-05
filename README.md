# Monocker
Monitors Docker (MONitors dOCKER) containers and alerts on 'state' change

![Telegram Alerts](https://raw.githubusercontent.com/petersem/monocker/master/doco/telegram.PNG)

## Features
- Telegram integration
- Pushbullet integration
- Pushover integration
- Monitors 'state' changes for all containers (every 10 seconds)

## Future Considerations
- Additional messaging platforms
- Only monitor containers with a specific label
- Exclude monitoring of containers with a specific label

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
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped
```
- For Telegram: See documentation for how to obtain ID values. 
- For Pushbullet: Open Pushbullet in a browser and get device ID from URL [Example](https://raw.githubusercontent.com/petersem/monocker/master/doco/pbdeviceid.PNG)
- For Pushover: See pushover doco for user key and app token

This application uses *semantic* versioning. See [here](https://semver.org/) for more details. 