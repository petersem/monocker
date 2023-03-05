# Monocker
Monitors Docker (MONitors dOCKER) containers and alerts on 'state' change

![Telegram Alerts](https://raw.githubusercontent.com/petersem/monocker/master/doco/telegram.PNG)

## Features
- Telegram integration
- Pushbullet integration
- Pushover integration
- Discord integration (via webhooks)
- Ntfy integration
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
      # Optional avatar image to add to messages. Handy if you are running Monocker on different machines
      # - supported by discord & ntfy (mobile app) & slack
      SERVER_AVATAR: 'https://www.docker.com/wp-content/uploads/2021/10/Moby-logo-sm.png'
      # Specify the messaging platform and details, or leave blank if only wanting container logs (pick one only)
      MESSAGE_PLATFORM: 'telegram@your_bot_id@your_chat_id'
      # MESSAGE_PLATFORM: 'pushbullet@your_api_key@your_device_id'
      # MESSAGE_PLATFORM: 'pushover@your_user_key@your_app_api_token'
      # MESSAGE_PLATFORM: 'discord@webhook_url'
      # MESSAGE_PLATFORM: 'ntfy@topic_title'
      # MESSAGE_PLATFORM: 'slack@bot_user_oauth_token@your_chat_id'
      # MESSAGE_PLATFORM: ''
      # Optional - includes or excludes specified containers - default behaviour is false
      LABEL_ENABLE: 'false'
      # Optional - only show when container state changes to being offline (paused, exited, running (unhealthy), or dead) - default is false
      ONLY_OFFLINE_STATES: 'false'
      # [Optional] - Regardless of any other settings, you can ignore or include 'exited'
      EXCLUDE_EXITED: 'false'      
      # [Optional] - Set the poll period in seconds. Defaults to 10 seconds, which is also the minimum. 
      PERIOD: 10
      # [Optional] - Supress startup messages from being sent. Default is false
      DISABLE_STARTUP_MSG: 'false'

      ## ADVANCED NTFY SETTINGS
      #CUSTOM_NTFY_SERVER: 'https://custom.ntfy.com' # use your own NTFY server
      #NTFY_USER: 'user' # use a username and password to login (on ntfy.sh or your own server)
      #NTFY_PASS: 'password' 
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    restart: unless-stopped
```
- For Telegram: See documentation for how to obtain ID values. 
- For Pushbullet: Open Pushbullet in a browser and get device ID from URL [Example](https://raw.githubusercontent.com/petersem/monocker/master/doco/pbdeviceid.PNG)
- For Pushover: See pushover doco for user key and app token
- For Discord: See Discord doco for how to create a webhook and get the url
- For Slack: See [documentation](doco/slack.md) for how to obtain ID values.
- For Ntfy: create a new topic on https://ntfy.sh/app, use the name of the topic as follows: ntfy@MY_TOPIC_TITLE
  
  If you would like to use your own ntfy server you can add the environment variable `CUSTOM_NTFY_SERVER`
  
  If you would like to use a username and password (either on ntfy.sh or on your own server), uncomment the variables `NTFY_USER` and `NTFY_PASS`
  
  (it would be advised to store these in an environment file and not directly use them in your docker-compose.yml)

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
