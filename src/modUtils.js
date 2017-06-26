"use strict";
const config = require("../config");
const utils = require("./utils");
const sections = require('./getSections');

function getBug (bot, channelID, userID, command, msg, db) {
  let receivedMessage;
  if(!!command) {
    let messageSplit = msg.content.split(' ');
    messageSplit.shift();
    receivedMessage = messageSplit.join(' ');

    if(!receivedMessage) {
      utils.botReply(bot, userID, channelID, "psst, I think you forgot the bug ID", command, msg.id, false);
      return;
    }
  } else {
    receivedMessage = userID; // which is the key in this case
  }

  db.get("SELECT * FROM reports WHERE id = ?", [receivedMessage], function(error, reportInfo) {
    if(!reportInfo) {return;}

    let allSections = sections(reportInfo.reportString);

    let stepsToRepro = allSections["steps to reproduce"];
    stepsToRepro = stepsToRepro.replace(/(-)\s/gi, '\n$&');
    let expectedResult = allSections["expected result"];
    let actualResult = allSections["actual result"];
    let clientSetting = allSections["client setting"];
    let sysSettings = allSections["system setting"];

    db.all("SELECT * FROM reportQueueInfo WHERE id = ? AND stance != 'note'", [receivedMessage], function(error, reportRepro) {
      if(!reportRepro) {return;}

      let stance;
      let getRepro = reportRepro.map(function(everyRepro) {
        if(everyRepro.stance === "approve") {
          stance = ":white_check_mark:";
        } else {
          stance = ":x:";
        }
        return stance + " | " + utils.cleanUserTag(everyRepro.userTag) + "(" + everyRepro.userID + ") => `" + everyRepro.info + "`";
      });

      let trelloURL = "";
      if(!!reportInfo.trelloURL) {
        trelloURL = "<https://trello.com/c/" + reportInfo.trelloURL + ">";
      }

      let queueReportString = `\n**Short description:** ${reportInfo.header}\n**Steps to reproduce:** ${stepsToRepro}\n**Expected result:** ${expectedResult}\n**Actual result:** ${actualResult}\n**Client settings:** ${clientSetting}\n**System settings:** ${sysSettings}`;
      let messageToSend = `───────────────────────\n**${utils.cleanUserTag(reportInfo.userTag)}** Reported:\n${queueReportString}\n\n - ${getRepro.join('\n - ')}\n**#${receivedMessage}** - ${trelloURL}`;

      if(!!command) {
        bot.getDMChannel(userID).then((getID) => {
          bot.createMessage(getID.id, messageToSend).catch((err) => {console.log("getBug | createMsg\n" + err);});
          bot.deleteMessage(channelID, msg.id).catch(() => {});
        }).catch((error) => {console.log("getBug ERR:\n" + error);});
      } else {
        bot.createMessage(channelID, messageToSend).catch((err) => {console.log("deniedBug  | createMsg\n" + err);});
      }
    });
  });
}

function getStats (bot, channelID, userTag, userID, command, msg, trello, db) {

}

function getUser (bot, channelID, userTag, userID, command, msg, trello, db) {

}

module.exports = {
  getBug: getBug,
  getStats: getStats,
  getUser: getUser
}
