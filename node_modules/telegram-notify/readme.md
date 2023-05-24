# telegram-notify
this package for sending telegram messages

## Usage
    const Telegram = require('telegram-notify');
    let notify = new Telegram({token:'tokenString', chaiId:'id'});
    await notify.send('alert');

    
## Installation
To use the library, install it through [npm](https://npmjs.com)
```shell
npm install --save telegram-notify
```

## config
* `token`  - your telegram bot token, create bot: https://t.me/BotFather
* `chatId` - telegram chat id for notify, get the id: https://t.me/get_id_bot
* `proxy` - telegram proxy string [optional], e.q. http://login:password@ip:port
* `maxErrors` - max attempts to send a telegram message (default:5)

## API
* `send` send a telegram message