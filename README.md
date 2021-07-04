# Monocker
Monitors Docker (MONitors dOCKER) containers and alerts on state change

![Telegram Alerts](https://raw.githubusercontent.com/petersem/monocker/master/doco/telegram.PNG)

## Features
- Telegram messaging integration
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
    image: monocker
    environment:
      NODE_ENV: production
      TELEGRAM_ID: 'your_telegram_id'
      TELEGRAM_CHAT_ID: 'your_telegram_chat_id'
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    ports:
      - 3300:3000
    restart: unless-stopped
```
> Please see Telegram documentation for how to obtain ID values. 