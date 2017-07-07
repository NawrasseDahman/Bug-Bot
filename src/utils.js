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

function botReply (bot, userID, channelID, message, command, msgID, minute, twoHours) {
  if(command === "!submit") {
    bot.createMessage(channelID, '<@' + userID + '> ' + message).then(delay(customConfig.maxDelay)).then((msgInfo) => {
      bot.deleteMessage(channelID, msgInfo.id).catch(() => {});
      bot.deleteMessage(channelID, msgID).catch(() => {});
    }).catch((error) => {
      console.log("#utils | botReply submit command\n" + error);
    });
  } else if(minute === true) {
    bot.createMessage(channelID, '<@' + userID + '> ' + message).then(delay(customConfig.minuteDelay)).then((msgInfo) => {
      bot.deleteMessage(channelID, msgInfo.id).catch(() => {});
      bot.deleteMessage(channelID, msgID).catch(() => {});
    }).catch((error) => {
      console.log("#utils | botReply notSubmit - minute\n" + error);
    });
  } else if(twoHours === true) {
    bot.createMessage(channelID, '<@' + userID + '>' + message).then(delay(customConfig.twoHours)).then((msgInfo) => {
      bot.deleteMessage(channelID, msgInfo.id).catch(() => {});
    }).catch((error) => {
      console.log("#utils | botReply twoHours\n" + error);
    });
  } else {
    bot.createMessage(channelID, '<@' + userID + '> ' + message).then(delay(customConfig.delayInS)).then((msgInfo) => {
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

function preCleanInputText(inputText, checkIfRemove) {
  //needs to check for several links
  //remove links and remember their position
  let checkForURLs = inputText.match(/([--:\w?@%&+~#=]*\.[a-z]{2,4}\/{0,2})(?:(?:[?&](?:\w+)=(?:\w+))+|[--:\w?@%&+~#=]+)?/gi);
  if(!!checkForURLs) {
    //map each URL and their position
    // URL: '<url>', pos: <#>
    inputText = inputText.split(' ');
    let arrOfURLs = [];
    checkForURLs.forEach(function(url) {
      let indexNumb = inputText.indexOf(url);
      arrOfURLs.push({'url': url, 'index': indexNumb});
      inputText.splice(indexNumb, 1);
    });
    inputText = inputText.join(' ');

    return cleanInputText(inputText, arrOfURLs, checkIfRemove);
  } else {
    return cleanInputText(inputText, null, checkIfRemove);
  }
}

function cleanInputText(inputText, arrOfURLs, checkIfRemove) {
  let whatToDo = "\\$&";
  if(checkIfRemove) {
    whatToDo = "";
  }
  inputText = inputText.replace(/[\*\`\~\_\ˋ]/gi, whatToDo);

  if(!!arrOfURLs) { //add URLs back
    inputText = inputText.split(' ');
    arrOfURLs.map(function(info) {
      inputText.splice(info.index, 0, info.url);
    });
    inputText = inputText.join(' ');
  }
  return inputText;
}

function cleanUserTag(userTag) {
  return userTag.replace(/[\*\`\~\_\ˋ]/gi, "\\$&");
}

function cleanUserTagRegex(userTag) {
  return userTag.replace(/[\[\\\^\$\.\|\?\*\+\(\)\{\}\]\~\_\`]/gi, "\\\$&");
}

function reportTracking (bot, channelID, userTag, userID, command, msg, trello, db) {
  db.get('SELECT reportTracking FROM users WHERE userID = ?', [userID], function(err, data) {
    if(!!err) {
      console.log('reportTracking GET\n' + err);
    }

    let reportTracking;

    if (data.reportTracking === true) {
      reportTracking = false;
    } else if (data.reportTracking === false) {
      reportTracking = true;
    }

    db.run('UPDATE users SET reportTracking = ? WHERE userID = ?', [reportTracking, userID]);

    botReply(bot, userID, channelID, `you have changed your report tracking to ${reportTracking}`, null, msg.id, false);
  });
}

module.exports = {
  delay: delay,
  botReply: botReply,
  toTitleCase: toTitleCase,
  cleanUserTag: cleanUserTag,
  cleanUserTagRegex: cleanUserTagRegex,
  reportTracking: reportTracking,
  preCleanInputText: preCleanInputText
};
