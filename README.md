# Monocker
Monitors Docker (MONitors dOCKER) containers and alerts on state change

![Telegram Alerts](https://raw.githubusercontent.com/petersem/monocker/master/doco/telegram.PNG)

## Features
- Telegram integration
- Pushbullet integration
- Monitors all containers (every 10 seconds)

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
      # Specify the messaging platform and details, or leave blank if only wanting container logs (pick one only)
      MESSAGE_PLATFORM: 'telegram@your_bot_id@your_chat_id'
      # MESSAGE_PLATFORM: 'pushbullet@your_api_key@your_device_id'
      # MESSAGE_PLATFORM: ''
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped
```
> For Telegram: See documentation for how to obtain ID values. 

> For Pushbullet: Open Pushbullet in a browser and get device ID from URL [Example](https://raw.githubusercontent.com/petersem/monocker/master/doco/pbdeviceid.PNG)

This application uses *semantic* versioning. See [here](https://semver.org/) for more details. 