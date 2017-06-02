"use strict";
const config = require("../config");
const utils = require("./utils");
const sections = require('./getSections');

function getBug (bot, channelID, userTag, userID, command, msg, trello, db) {
  let messageSplit = msg.content.split(' ');
  messageSplit.shift();
  let recievedMessage = messageSplit.join(' ');

  if(!recievedMessage) {
    utils.botReply(bot, userID, channelID, "psst, I think you forgot the bug ID", command, msg.id, false);
    return;
  }

  db.get("SELECT * FROM reports WHERE id = ?", [recievedMessage], function(error, reportInfo) {
    if(!reportInfo) {return;}

    let allSections = sections(reportInfo.reportString);

    let stepsToRepro = allSections["steps to reproduce"];
    stepsToRepro = stepsToRepro.replace(/(-)\s/gi, '\n$&');
    let expectedResult = allSections["expected result"];
    let actualResult = allSections["actual result"];
    let clientSetting = allSections["client setting"];
    let sysSettings = allSections["system setting"];

    db.all("SELECT * FROM reportQueueInfo WHERE id = ? AND stance != 'note'", [recievedMessage], function(error, reportRepro) {
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

      bot.getDMChannel(userID).then((getID) => {
        let trelloURL = "";
        if(!!reportInfo.trelloURL) {
          trelloURL = "<https://trello.com/c/" + reportInfo.trelloURL + ">";
        }
        let queueReportString = "\n**Short description:** " + reportInfo.header + "\n**Steps to reproduce:** " + stepsToRepro + "\n**Expected result:** " + expectedResult + "\n**Actual result:** " + actualResult + "\n**Client settings:** " + clientSetting + "\n**System settings:** " + sysSettings;
        bot.createMessage(getID.id, "───────────────────────\nReported by: " + utils.cleanUserTag(reportInfo.userTag) + "\n" + queueReportString + "\n\n - " + getRepro.join('\n - ') + "\n **#" + recievedMessage + "** - " + trelloURL).catch((err) => {console.log("getBug | createMsg\n" + err);});
        bot.deleteMessage(channelID, msg.id).catch(() => {});
      }).catch((error) => {console.log("getBug ERR:\n" + error);});
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
