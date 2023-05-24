const fetch = require('node-fetch');
const HttpsProxyAgent = require('https-proxy-agent');
const {sleep} = require('usleep');
const MAX_ERRORS = 5;

class TelegramNotify {

  constructor(config) {
    this.token = config.token;
    this.chatId = config.chatId;
    this.proxy = config.proxy;
    this.maxErrors = config.maxErrors || MAX_ERRORS;
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

    return await this.#apiRequest(url, fetchOptions);
  }

  async #apiRequest(url, fetchOptions, attempt = 1) {
    try {
      return await (await fetch(url, fetchOptions)).json();
    } catch (e) {
      console.error(new Date().toLocaleString(), 'attempt ' + attempt, e.message);
      if (attempt >= this.maxErrors) {
        return false;
      }
      await sleep(5);
      return await this.#apiRequest(url, fetchOptions, ++attempt);
    }
  }
}

module.exports = TelegramNotify;
