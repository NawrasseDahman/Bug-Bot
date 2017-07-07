"use strict";
const config = require("../config");
const utils = require("../src/utils");
const modUtils = require('../src/modUtils');
const fs = require('fs');
const dateFormat = require('dateformat');

let modCommands = {
  pattern: /!ping|!bug|!restart|!getuser|!getrepro|!getnumber|!stats|!backup|!log|!getmsg|!embed|!roles/i,
  execute: function(bot, channelID, userTag, userID, command, msg, trello, db) {
    let messageSplit = msg.content.split(' ');
    messageSplit.shift();
    let recievedMessage = messageSplit.join(' ');
    let contentMessage = recievedMessage.match(/(\d*)\s*\|\s*([\s\S]*)/i);
      switch (command.toLowerCase()) {
        case "!ping":
          utils.botReply(bot, userID, channelID, "Pong! <:greenTick:" + config.emotes.greenTick + ">", command, msg.id, false);
        break;

        case "!bug":
          modUtils.getBug(bot, channelID, userID, command, msg, db);
          //DM person everything about a report
          break;

        case "!restart":
          let currentTime = new Date();
          let thisBackupTime = dateFormat(currentTime, "UTC:mm-dd-yyyy-HH-MM");
          let backupFile = fs.readFileSync('./data/data.sqlite');

          bot.deleteMessage(channelID, msg.id).then(() => {
            console.log("Restarting");
            bot.createMessage(config.channels.modLogChannel, `:large_blue_diamond: ${userTag} used restart! It was... hopefully super effective!`, {file: backupFile, name: "Backup-" + thisBackupTime + ".sqlite"}).then(() => {
              process.exit();
            });
            //restart the bot
          }).catch(() => {});
          break;

        case "!getuser":
          db.all("SELECT * FROM users WHERE userid = ?", [recievedMessage], function(error, data) {
            //bot.getDMChannel(userID).then((dmChannel) => {
            //  bot.createMessage(dmChannel.id, data);
            //}).catch((error) => {console.log(error);})
            console.log(data);
          });
          break;

        case "!getrepro":
          db.all("SELECT * FROM reportQueueInfo WHERE id = ?", [recievedMessage], function(error, data) {
            console.log(data);
          });
          break;

        case "!getnumber":
          db.get("SELECT cantRepro, canRepro, id FROM reports WHERE id = ?", [recievedMessage], function(error, data) {
            console.log(data);
          });
          break;

        case "!stats":

          break;

        case "!backup":
          let now = new Date();
          let thisCycle = dateFormat(now, "UTC:mm-dd-yyyy-HH-MM");
          let bufferString = fs.readFileSync('./data/data.sqlite');

          bot.createMessage(config.channels.modLogChannel, null, {file: bufferString, name: "Backup-" + thisCycle + ".sqlite"});
          break;

        case "!log":
          if(userID === "84815422746005504") {
            let now = new Date();
            let thisCycle = dateFormat(now, "UTC:mm-dd-yyyy-HH-MM");
            let bufferString = fs.readFileSync('./logs/bblog.log');
            if(!!msg.channel.guild) {
              bot.getDMChannel(userID).then((thisDM) => {
                bot.createMessage(thisDM.id, null, {file: bufferString, name: "log-" + thisCycle + ".log"}).catch((error) => {console.log(error);});
              });
            } else {
              bot.createMessage(channelID, null, {file: bufferString, name: "log-" + thisCycle + ".log"}).catch((error) => {console.log(error);});
            }
          }
          break;
        case "!getmsg":
          bot.getMessage(channelID, recievedMessage).then((info) => {
            console.log(info);
          });
        break;

        case "!embed":

              //  embedStreamers = {title: "QubeTubers Twitch Team", description: "Visit <https://www.twitch.tv/team/qubetubers> to get in on the fun!", color: 7506394, fields: [{name: 'No channels are currently live, check back again later!', value: ' '}]};
              //  bot.createMessage(config.editChannelID, {content: " ", embed: embedStreamers}).then(m_msg => {
              //    client.set("QTEditChannelTextIDTest", m_msg.id);
              //  });
          let report = {author: {name: userTag, icon_url: msg.author.avatarURL}, title: "<:android:332598172645982221> Android:", description: "**Short Description:**  This is a test report\n**Steps to Reproduce:** \nStep 1: Install app \nStep 2: Launch app \nStep 3: Observe\n**Expected Result:** App starts\n**Actual Result:** Crash\n**Client settings:** These things\n**System settings:** Potato 6000\n", color: 7506394, footer: {text: "Report ID: #1000"}, fields:
          [{name: "Approvals:", value: "<:greenTick:301528515361243136> This Potato#1234: Can Repro Android 6.0.1\n<:greenTick:301528515361243136> Dabbit Prime#0001: Can Repro Android 8", inline: true},
          {name: "Denials:", value: "\n<:redTick:301528514832760833> Logiz#9321: Can't repro"}, {name: "Attachments:", value: "--list of attachments--"},
          {name: "Notes:", value: ":pencil: Logiz#9321: I am the biggest potato in this farm!"}]};
          bot.createMessage(channelID, {content: " ", embed: report});
          break;
        case "!roles":
          let roles = msg.member.guild.roles;
          let rolesList = roles.map(function(role){
            return role.name + ": '" + role.id + "'"; });
          bot.createMessage(channelID, "```js\n" + rolesList.join(",\n") + "```").catch((err) => {console.log(err);});
          break;
      }
  },
  roles: [
    config.roles.adminRole,
    config.roles.devRole,
    config.roles.trelloModRole
    ],
  channels: [
    config.channels.allChannels
  ],
  acceptFromDM: true
}
module.exports = modCommands;
