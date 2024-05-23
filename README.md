# Monocker
Monitors Docker (MONitors dOCKER) containers and alerts on 'state' change.

![image](https://github.com/petersem/monocker/blob/master/doco/title.png?raw=true)

## Features
- Monitors 'state' changes for all containers (every 10 seconds)
- Specific inclusions or exclusions of containers to monitor
- Optionally, only alert on state changes to (paused, exited, running (unhealthy), or dead)
- In-built Docker healthcheck
### Integration with
- Telegram
- Pushbullet
- Pushover
- Discord
- Ntfy
- Slack
- Gotify
- Matrix

## Future Considerations
- Additional messaging platform support

## Installation
```ya
services:
  monocker:
    container_name: monocker
    image: petersem/monocker
    environment:
      # Optional - set this to use a docker interface other than the default
      # DOCKER_HOST: tcp://docker-socket-proxy:2375
      # Optional label to preface messages. Handy if you are running multiple versions of Monocker
      SERVER_LABEL: 'Your server name'
      # Optional avatar image URL to add to messages. Handy if you are running Monocker on different machines (discord, ntfy, and slack)
      SERVER_AVATAR: 'https://content.invisioncic.com/u329766/monthly_2024_05/monocker.png.ba5ffdb390b627097d2a53645cf87350.png'
      # Specify 'ONE' messaging platform, or leave blank if only wanting container logs
      # MESSAGE_PLATFORM: 'telegram@your_bot_id@your_chat_id'
      MESSAGE_PLATFORM: 'gotify@server@app_token'
      # MESSAGE_PLATFORM: 'pushbullet@your_api_key@your_device_id'
      # MESSAGE_PLATFORM: 'pushover@your_user_key@your_app_api_token'
      # MESSAGE_PLATFORM: 'discord@webhook_url'
      # MESSAGE_PLATFORM: 'ntfy@topic_title'
      # MESSAGE_PLATFORM: 'slack@bot_user_oauth_token@your_chat_id'
      # For Matrix, add the userid 'without' the leading @ sign. Values are server, userid, access-token, room-id
      # MESSAGE_PLATFORM = matrix@https://matrix.org@user:matrix.org@access-token@room-id:matrix.org
      # MESSAGE_PLATFORM: ''
      # Optional - includes or excludes specified containers - default behaviour is false
      LABEL_ENABLE: 'false'
      # Optional - only show when container state changes to being offline (paused, exited, running (unhealthy), or dead) - default is false
      ONLY_OFFLINE_STATES: 'false'
      # [Optional] - Regardless of any other settings, you can ignore or include 'exited'
      EXCLUDE_EXITED: 'false'      
      # [Optional] - Set the poll period in seconds. Defaults to 10 seconds, recommended 30.
      PERIOD: 30
      # [Optional] - Suppress startup messages from being sent. Default is false
      DISABLE_STARTUP_MSG: 'false'
      ## ADVANCED NTFY SETTINGS
      #CUSTOM_NTFY_SERVER: 'https://custom.ntfy.com' # use your own NTFY server
      #NTFY_USER: 'user' # use a username and password to login (on ntfy.sh or your own server. Option if you have your own server open)
      #NTFY_PASS: 'password' 
      # [optional] - adds SHA ID for all container references. 'true' or 'false' (default)
      SHA: 'false'
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    restart: unless-stopped
```
- For Telegram: See [video](https://github.com/petersem/monocker/raw/master/doco/telegram_chatid_botid.mkv) and use this link for how to obtain ID values. https://api.telegram.org/bot{bot-id}/getUpdates
- For Pushbullet: Open Pushbullet in a browser and get device ID from URL [Example](https://raw.githubusercontent.com/petersem/monocker/master/doco/pbdeviceid.PNG)
- For Pushover: See pushover doco for user key and app token
- For Discord: See Discord doco for how to create a webhook and get the url
- For Slack: See [documentation](doco/slack.md) for how to obtain ID values.
- For Ntfy: create a new topic on https://ntfy.sh/app, use the name of the topic as follows: ntfy@MY_TOPIC_TITLE
- For Matrix, review these images for how to get [userID](https://github.com/petersem/monocker/blob/master/doco/matrix-user-id.png?raw=true), [roomID](https://github.com/petersem/monocker/blob/master/doco/matrix-room-id.png?raw=true), and [Access token](https://github.com/petersem/monocker/blob/master/doco/matrix-access-token.png?raw=true)
  
  If you would like to use your own ntfy server you can add the environment variable `CUSTOM_NTFY_SERVER`
  
  If you would like to use a username and password (either on ntfy.sh or on your own server), uncomment the variables `NTFY_USER` and `NTFY_PASS`
  
  (it would be advised to store these in an environment file and not directly use them in your docker-compose.yml)

#### DOCKER_HOST
This is an optional value, and if set will change the interface used to communicate with Docker. This can be a UNIX socket (`unix://`), Windows named pipe (`npipe://`) or TCP connection (`tcp://`). If it's a pipe or socket, be sure to mount the connection as a volume. If the connection is proxied, ensure that `GET` requests are allowed on the `/containers` endpoint.

By default, this value is unset and the connection will use `/var/run/docker.sock`.

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


> If you like my work, you can make a dontation to say thanks! [Buy me a coffee](https://www.paypal.com/paypalme/thanksmp)


> Discuss issues or feature requests in the monocker channel on [Discord](https://discord.gg/NcKJTKN9yP)

This application uses *semantic* versioning. See [here](https://semver.org/) for more details. 

Link to code on [GitHub](https://github.com/petersem/monocker)
