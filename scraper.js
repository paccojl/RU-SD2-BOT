const rp = require('request-promise');
const $ = require('cheerio');
const url = 'https://steamdb.info/embed/?appid=919640';
const Discord = require("discord.js");
const options = {
    headers: { 'user-agent': 'node.js' }
}

var lastcall = 0;

function online(message) {
    let curtime = new Date().getTime();
    if (curtime - lastcall > 60000){
        rp(url, options)
        .then(function (html) {
            const embed = new Discord.RichEmbed();
            embed.setTitle("Онлайн Steel Division 2")
            embed.setURL("https://steamdb.info/app/919640/graphs/");
            embed.addField('Онлайн', $(".stats > li:nth-child(2) > b:nth-child(1)", html).text(),true);
            embed.addField('Пик за сутки', $(".stats > li:nth-child(3) > b:nth-child(1)", html).text(),true);
            embed.setFooter('По данным SteamDB');
            message.channel.send(embed);
        })
        .catch(function (err) {
            console.log(err);
        });
        lastcall = curtime;
    }
}
module.exports.online = online;