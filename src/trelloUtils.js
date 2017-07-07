"use strict";
const config = require("../config");
const utils = require("./utils");
const sections = require('./getSections');
const reproUtils = require('./reproUtils');
const attachUtils = require('./attachUtils');
const dateFormat = require('dateformat');

function addReportTrello(bot, key, db, trello) { // add report to trello
  db.serialize(function(){
    db.get('SELECT header, reportString, userID, userTag, cardID, reportMsgID FROM reports WHERE id = ?', [key], function(error, report) {

      let allSections = sections(report.reportString);

      let stepsToRepro = allSections["steps to reproduce"];
      stepsToRepro = stepsToRepro.replace(/(-)\s/gi, '\n$&');
      let expectedResult = allSections["expected result"];
      let actualResult = allSections["actual result"];
      let clientSetting = allSections["client setting"];
      let sysSettings = allSections["system setting"];

      const reportString = '\n\n####Steps to reproduce:' + stepsToRepro + '\n\n####Expected result:\n' + expectedResult + '\n####Actual result:\n' + actualResult + '\n####Client settings:\n' + clientSetting + '\n####System settings:\n' + sysSettings;
      const reportChatString = "\n**Short description:** " + report.header + "\n**Steps to reproduce:** " + stepsToRepro + "\n**Expected result:** " + expectedResult + "\n**Actual result:** " + actualResult + "\n**Client settings:** " + clientSetting + "\n**System settings:** " + sysSettings;

      let success = function(successError, data) {
        bot.deleteMessage(config.channels.queueChannel, report.reportMsgID).catch(() => {});
        let postChannelID;
        switch (report.cardID) {
          case config.cards.iosCard:
            postChannelID = config.channels.iosChannel;
            break;
          case config.cards.androidCard:
            postChannelID = config.channels.androidChannel;
            break;
          case config.cards.canaryCard:
            postChannelID = config.channels.canaryChannel;
            break;
          case config.cards.linuxCard:
            postChannelID = config.channels.linuxChannel;
            break;
        }
        bot.createMessage(postChannelID, "───────────────────────\nReported By **" + utils.cleanUserTag(report.userTag) + "**" + reportChatString + "\n<" + data.shortUrl + "> - **#" + key + "**\n\n**Reproducibility:**\n").then((msgInfo) => {
          // change reportStatus, trelloURL & queueMsgID
          // attach all attachments to the trello post
          let trelloURL = data.shortUrl.match(/(?:(?:<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(?:\/|\>)?(?:[\w-\d]*)?(?:\/|\>|\/>)?/i);
          let trelloUrlSuffix = trelloURL[1];
          db.run("UPDATE reports SET reportStatus = 'trello', trelloURL = ?, reportMsgID = ? WHERE id = ?", [trelloUrlSuffix, msgInfo.id, key]);
          bot.createMessage(config.channels.modLogChannel, ":incoming_envelope: <#" + postChannelID + "> **" + utils.cleanUserTag(report.userTag) + "** - `" + report.header + "` <" + data.shortUrl + ">\n" + key); //log to bot-log

          setTimeout(function() {
            db.each('SELECT userID, userTag, attachment FROM reportAttachments WHERE id = ?', [key], function(error, attachmentData) {
              if(!!attachmentData && attachmentData.length !== 0){
                attachUtils(bot, null, attachmentData.userTag, attachmentData.userID, "!attach", null, trello, trelloURL[1], attachmentData.attachment, false, report.header);
              }
            });
            getUserInfo(report.userID, report.userTag, postChannelID, data.shortUrl, key, bot);
            db.get("SELECT cantRepro, canRepro, id, reportMsgID, trelloURL FROM reports WHERE id = ?", [key], function(err, newReport) {
              if(!!err) {
                console.log(err);
              }
              reproUtils.queueRepro(bot, trello, db, postChannelID, trelloURL[1], key, newReport);
            });
          }, 2000);
        }).catch(err => {console.log(err);});
      }

      let newReport = {
        name: report.header,
        desc: "Reported by " + report.userTag + reportString + "\n\n" + key,
        idList: report.cardID,
        pos: 'top'
      }
      trello.post('/1/cards/', newReport, success);
    });
  });
}

let loopGetUserInfo = 0;
function getUserInfo(userID, userTag, postChannelID, shortUrl, key, bot) {
  let guild = bot.guilds.get(config.DTserverID);
  let userInfo = guild.members.get(userID);
  if(!!guild) {
    if(!userInfo) {
      return;
    }
    if(userInfo.roles.indexOf(config.roles.initiateRole) === -1 && userInfo.roles.indexOf(config.roles.hunterRole) === -1){

      let allRoles = userInfo.roles;
      allRoles.push(config.roles.initiateRole);
      bot.editGuildMember(config.DTserverID, userID, {
        roles: allRoles
      }).then(() => {
        utils.botReply(bot, userID, config.channels.charterChannel, ", congratulations on your bug getting approved! You're almost a full-fledged Bug Hunter:tm:!  The last step is you need to read and agree to the rules of this Charter by DM'ing the Secret Phrase to me.  The secret phrase can only be found by reading the Charter!", null, null, false, true);
        bot.createMessage(config.channels.modLogChannel, `**${userTag}** was given the Initiate role because of ${shortUrl}`);
      });

    }
    bot.getDMChannel(userID).then((DMInfo) => {
      bot.createMessage(DMInfo.id, "The bug you reported has been approved! Thanks for your report! You can find your bug in <#" + postChannelID + "> <" + shortUrl + ">").catch(() => {
        bot.createMessage(config.channels.modLogChannel, ":warning: Can not DM **" + utils.cleanUserTag(userTag) + "**. Report **#" + key + "** approved. <" + shortUrl + ">");
      });
    }).catch((err) => {
      console.log("trelloUtils getUserInfo DM\n" + err);
    });
    loopGetUserInfo = 0;
  } else if(loopGetUserInfo >= 5) {
    setTimeout(function() {
      loopGetUserInfo++;
      getUserInfo(userID, userTag, postChannelID, shortUrl, key);
    }, 2000);
  } else {
    bot.createMessage(config.channels.modLogChannel, ":warning: Couldn't fetch user info on " + utils.cleanUserTag(userTag) + ", user might need a new role!");
    loopGetUserInfo = 0;
  }
}

function editTrelloReport(bot, trello, userTag, userID, key, editSection, newContent, msg, channelID, urlData, msgID, command) {
  if(editSection === 'short description') {
    //edit card title (name)

    var cardUpdated = function(error, data){
      utils.botReply(bot, userID, channelID, ", `" + utils.toTitleCase(editSection) + "` has been updated to `" + newContent + "`", command, msgID, false);
      bot.createMessage(config.channels.modLogChannel, ":pencil2: **" + utils.cleanUserTag(userTag) + "** edited `" + utils.toTitleCase(editSection) + "` to `" + newContent + "` <" + data.shortUrl + ">");
    }
    var updateCard = {
      value: newContent
    };
    trello.put('/1/cards/' + key + '/name', updateCard, cardUpdated);

  } else {
    //edit desc
    let pattern;

    if(editSection === "system setting") {
      pattern = editSection + "system settings?:\\n*\\s*([\\s\\S]*?)(?=(?:\\\n\\\n\\d))";
    } else {
      pattern = editSection + "s?:\\s*\\n*\\s*([\\s\\S]*?)(?=(?:\\s*\\n)?#)";
    }

    let newRegex = new RegExp(pattern, "ig");

    let trelloDesc = urlData.desc;

    if(!trelloDesc) {
    let time = new Date();
    let ptime= dateFormat(time, "UTC:mm-dd-yyyy-HH-MM");
      console.log(`${ptime}\n${userTag} ${trelloDesc}`);
      return utils.botReply(bot, userID, channelID, "Something went wrong, please try again! Also scream at Logiz", command, msgID, false);
    }

    let editTrelloString = trelloDesc.replace(newRegex, utils.toTitleCase(editSection) + ":\n" + newContent);

    var cardUpdated = function(error, data){
      utils.botReply(bot, userID, channelID, " `" + utils.toTitleCase(editSection) + "` has been updated", command, msgID, false);
      bot.createMessage(config.channels.modLogChannel, ":pencil2: **" + utils.cleanUserTag(userTag) + "** edited `" + utils.toTitleCase(editSection) + "` to `" + newContent + "` <" + data.shortUrl + ">");
    }

    var updateCard = {
      value: editTrelloString
    };

    trello.put('/1/cards/' + key + '/desc', updateCard, cardUpdated);
  }
}

module.exports = {
  addReportTrello: addReportTrello,
  editTrelloReport: editTrelloReport
};
