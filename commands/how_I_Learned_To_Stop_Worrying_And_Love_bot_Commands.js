"use strict";
const config = require("../config");
const utils = require("../src/utils");

let hug = {
    pattern: /!hug/i,
    execute: function (bot, channelID, userTag, userID, command, msg) {
        if (!msg.mentions) {
            utils.botReply(bot, userID, channelID, "you forgot to choose who to give the hug to!", command, msg.id, false);
            return;
        }

        if (msg.mentions.length > 1) {
            utils.botReply(bot, userID, channelID, "we love that you're trying to spread the love around, but only one-on-one hugs for right now!", command, msg.id, false);
            return;
        }

        bot.createMessage(channelID, "<@" + msg.mentions[0].id + ">, <@" + msg.author.id + "> just gave you a big big hug!");
    },
    roles: [
        config.roles.adminRole,
        config.roles.trelloModRole,
        config.roles.devRole,
        config.roles.hunterRole
    ],
    channels: [
        config.channels.allChannels
    ]
};
module.exports = hug;
