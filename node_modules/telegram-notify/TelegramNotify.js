const fetch = require('node-fetch');
const HttpsProxyAgent = require('https-proxy-agent');

class TelegramNotify {

  constructor(config) {
    this.token = config.token;
    this.chatId = config.chatId;
    this.proxy = config.proxy;
  }

  async send(message, fetchOptions = {}, apiOptions = {}) {
    fetchOptions.timeout = fetchOptions.timeout || 3000;
    if (this.proxy) {
      fetchOptions.agent = new HttpsProxyAgent(this.proxy);
    }
    apiOptions.disable_web_page_preview = typeof apiOptions.disable_web_page_preview !== 'undefined' ? apiOptions.disable_web_page_preview : 1;
    apiOptions.disable_notification = typeof apiOptions.disable_notification !== 'undefined' ? apiOptions.disable_notification : true;
    apiOptions.text = encodeURIComponent(message);
    let url = 'https://api.telegram.org/bot' + this.token + '/sendmessage?chat_id=' + this.chatId;
    for (let param in apiOptions) {
      url += '&' + param + '=' + apiOptions[param];
    }
    try {
      let response = await (await fetch(url, fetchOptions)).json();
      return response;
    } catch (e) {
      console.error(new Date().toLocaleString(), e.message);
      return false;
    }
  }
}

module.exports = TelegramNotify;
