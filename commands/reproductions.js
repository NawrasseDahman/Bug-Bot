"use strict";
const config = require("../config");
const reproUtils = require("../src/reproUtils");
const utils = require("../src/utils");

let reproduction = {
  pattern: /!canrepro|!cantrepro|!cannotrepro|!cr|!cnr/i,
  execute: function(bot, channelID, userTag, userID, command, msg, trello, db) {
    var msgSplit = msg.content.split(" ");
    var joinedMsg = msgSplit.join(" ");
    var msgContent = joinedMsg.match(/(?:(?:<)?(?:https?:\/\/)?(?:www\.)?trello.com\/c\/)?([^\/|\s|\>]+)(?:\/|\>)?(?:[\w-\d]*)?(?:\/|\>|\/>)?\s*\|\s*([\s\S]*)/i);
    switch (command.toLowerCase()) {
      case "!canrepro":
      case "!cr":
        var reproduction = "Can reproduce.";
        var emoji = "\n<:greenTick:" + config.emotes.greenTick + "> ";

        if(!msgContent || !msgContent[1] || !msgContent[2]) {
          utils.botReply(bot, userID, channelID, "please provide a valid URL, a client version, and make sure the issue is not closed.", command, msg.id);
          return;
        }

        bot.getMessages(channelID).then((msgs) => {

          let findMessage = msgs.find(function(info) {
            return info.author.id === config.botID && info.content.indexOf(msgContent[1]) > -1;
          });
          
          if(!!findMessage && findMessage.length !== 1) {
            return utils.botReply(bot, userID, channelID, "there are several reports with that ID, please use the trello link", command, msg.id);
          }
        }).catch((err) => {
          console.log("reproduction | canRepro checkup\n" + err);
        });

        reproUtils.preCheckReproSetup(bot, msgContent[1], msgContent[2], reproduction, userTag, channelID, msg.id, userID, emoji, trello, db, command);
        break;
      case "!cantrepro":
      case "!cannotrepro":
      case "!cnr":
        var reproduction = "Can't reproduce.";
        var emoji = "\n<:redTick:" + config.emotes.redTick + "> ";

        if(!msgContent || !msgContent[1] || !msgContent[2]) {
          utils.botReply(bot, userID, channelID, "please provide a valid URL, a client version, and make sure the issue is not closed.", command, msg.id);
          return;
        }

        bot.getMessages(channelID).then((msgs) => {

          let findMessage = msgs.find(function(info) {
            return info.author.id === config.botID && info.content.indexOf(msgContent[1]) > -1;
          });

          if(!!findMessage && findMessage.length !== 1) {
            return utils.botReply(bot, userID, channelID, "there are several reports with that ID, please use the trello link", command, msg.id);
          }
        }).catch((err) => {
          console.log("reproduction | cantRepro checkup\n" + err);
        });

        reproUtils.preCheckReproSetup(bot, msgContent[1], msgContent[2], reproduction, userTag, channelID, msg.id, userID, emoji, trello, db, command);
        break;
    }
  },
  roles: [
    config.roles.everybodyRole
    ],
  channels: [
    config.channels.iosChannel,
    config.channels.canaryChannel,
    config.channels.androidChannel,
    config.channels.linuxChannel
  ]
}
module.exports = reproduction;
