"use strict";
const config = require("../config");
const utils = require("../src/utils");

let fun = {
  pattern: /!hug|!fight/i,
  execute: function (bot, channelID, userTag, userID, command, msg) {
    switch (command.toLowerCase()) {
      case "!hug":
        if (!msg.mentions[0]) {
          utils.botReply(bot, userID, channelID, "you forgot to choose who to give the hug to!", command, msg.id, false);
          return;
        }

        if (msg.mentions.length > 1) {
          utils.botReply(bot, userID, channelID, "we love that you're trying to spread the love around, but only one-on-one hugs for right now!", command, msg.id, false);
          return;
        }

        bot.createMessage(channelID, "<@" + msg.mentions[0].id + ">, " + msg.author.username + " just gave you a big big hug!");
        break;
      case "!fight":
        if (!msg.mentions[0]) {
          utils.botReply(bot, userID, channelID, "you forgot to choose who to fight!", command, msg.id, false);
          return;
        }

        if (msg.mentions.length > 1) {
          utils.botReply(bot, userID, channelID, "wow! Calm down there, no need to take on more than you can chew! (one fight at the time)", command, msg.id, false);
          return;
        }
        let userName = msg.author.username;
        let mention = msg.mentions[0].id;
        let strings = [", but instead slipped on some jam and fell right into Dabbit, who is not pleased.", " with a transformer.", ", but creates a black hole and gets sucked in.", " with poutine.", ", but they slipped on a banana peel", " and in the end, the only victor was the coffin maker.", ", and what a fight it is!  Whoa mama!", ", with two thousand blades!", ", but he fell into a conveniently placed manhole!", ", but they tripped over a rock and fell in the ocean", ", but they hurt themselves in confusion", ". HADOUKEN!", " with a pillow", " with a large fish", ", but they stumbled over their shoelaces", ", but they missed", " with a burnt piece of toast", ", but it wasn't every effective"];
        let randomNumber = Math.floor((Math.random() * strings.length));
        bot.createMessage(channelID, userName + " is fighting <@" + mention + ">" + strings[randomNumber]);
        break;

    }
  },
  roles: [
      config.roles.adminRole,
      config.roles.trelloModRole,
      config.roles.devRole,
      config.roles.hunterRole
  ],
  channels: [
      config.channels.allChannels
  ],
  acceptFromDM: false
};
module.exports = fun;
