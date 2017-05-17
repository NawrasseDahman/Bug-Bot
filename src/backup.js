"use strict";
const configEdit = require('../configEdit');
const fs = require('fs');
const config = require('../config');
const dateFormat = require('dateformat');

function backup(bot) {
  setInterval(function() {
    let now = new Date();
    let thisCycle = dateFormat(now, "UTC:mm-dd-yyyy-HH-MM");
    let bufferString = fs.readFileSync('./data/data.sqlite');

    bot.createMessage(config.channels.modLogChannel, null, {file: bufferString, name: "Backup-" + thisCycle + ".sqlite"}).catch((error) => {console.log(error);});
  }, configEdit.backupTimer * 1000 * 60 * 60); // *60
}

module.exports = backup;
