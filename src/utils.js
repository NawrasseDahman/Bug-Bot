"use strict";
const customConfig = require('../configEdit');

function delay (delayS) {
  return function(arg){
    return new Promise((resolve) => {
      delayS *= 1000;
      setTimeout(() => resolve(arg), delayS);
    });
  }
}

function botReply (bot, userID, channelID, error, command, msgID, minute) {
  if(command === "!submit") {
    bot.createMessage(channelID, '<@' + userID + '> ' + error).then(delay(customConfig.maxDelay)).then((msgInfo) => {
      bot.deleteMessage(channelID, msgInfo.id).catch(() => {});
      bot.deleteMessage(channelID, msgID).catch(() => {});
    }).catch((error) => {
      console.log("#utils | botReply submit command\n" + error);
    });
  } else if(minute === true) {
    bot.createMessage(channelID, '<@' + userID + '> ' + error).then(delay(customConfig.minuteDelay)).then((msgInfo) => {
      bot.deleteMessage(channelID, msgInfo.id).catch(() => {});
      bot.deleteMessage(channelID, msgID).catch(() => {});
    }).catch((error) => {
      console.log("#utils | botReply notSubmit - minute\n" + error);
    });
  } else {
    bot.createMessage(channelID, '<@' + userID + '> ' + error).then(delay(customConfig.delayInS)).then((msgInfo) => {
      bot.deleteMessage(channelID, msgInfo.id).catch(() => {});
      bot.deleteMessage(channelID, msgID).catch(() => {});
    }).catch((error) => {
      console.log("#utils | botReply notSubmit\n" + error);
    });
  }
}

function toTitleCase(editString) {
  return editString.replace(/\w\S*/, function(text) { return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();});
}

function cleanUserTag(userTag) {
  return userTag.replace(/(\*|\`|\~|\_)/gi, "\\$&");
}

function cleanUserTagRegex(userTag) {
  return userTag.replace(/[\[\\\^\$\.\|\?\*\+\(\)\{\}]/gi, "\\$&");
}

module.exports = {
  delay: delay,
  botReply: botReply,
  toTitleCase: toTitleCase,
  cleanUserTag: cleanUserTag,
  cleanUserTagRegex: cleanUserTagRegex
};
