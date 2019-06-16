const Discord = require('discord.js');
const Util = require('./utils.js')
const client = new Discord.Client();
const config = require("./config");
const tables = require("./tables");
const mapsConst = tables.maps;
const axisConst = tables.axisdivs;
const alliesConst = tables.allydivs;
const sql = require("./sql.js");



client.login(config.token);

client.on('ready' , () => {
});



function process(message) {
	if(message.content.startsWith("setup")){
		setup(message);
	}

	if(message.content.startsWith("test")){
		
		test(message);
	}

	if(message.content.startsWith("reg")){
		sql.register(message);
	}
	if(message.content.startsWith("unreg")){
		sql.unreg(message);
	}
}



async function test(message){
	
}

async function setup(message){

	let firstPlayer;
	let secondPlayer;

	if(message.mentions.users.size >= 2){
		firstPlayer = 	message.mentions.members.first(1)[0];
		secondPlayer = message.mentions.members.first(2)[1];
	} else {
		message.reply("Нужно упомянуть 2 пользователей");
		return;
	}
	
	try{
		if(!await Util.confirm(message,firstPlayer)){
			message.reply(`<@${firstPlayer.id}> не подтвердил матч`)
			return;
		}
		if(!await Util.confirm(message,secondPlayer)){
			message.reply(`<@${secondPlayer.id}> не подтвердил матч`)
			return;
		}
		
		let firstSide = Util.random([0,1]);

		let axisUser;
		let alliesUser;

		if(firstSide = 0){
			axisUser = firstPlayer;
			alliesUser = secondPlayer;
		} else {
			alliesUser = firstPlayer;
			axisUser = secondPlayer;
		}

		message.channel.send(`Союзники :<@${alliesUser.id}> \nОсь: <@${axisUser.id}>`);

		let maps = mapsConst;
		let answer = await Util.banSelect(message,maps,2,alliesUser);
		maps = maps.filter(x=> answer.indexOf(x)<0);
		answer = await Util.banSelect(message,maps,2,axisUser);
		maps = maps.filter(x=> answer.indexOf(x)<0);

		let map = Util.random(maps);

		message.channel.send(`<@${alliesUser.id}> <@${axisUser.id}> Случайная карта: ${map}`);

		let alliesBan = await Util.banSelect(message,alliesConst,2,axisUser);
		let axisBan = await Util.banSelect(message,axisConst,2,alliesUser,"Забань");

		//allies pick division then axis picks counterpick
		let alliesList = alliesConst.filter(x => alliesBan.indexOf(x)<0);
		let axisList = axisConst.filter(x => axisBan.indexOf(x)<0);
		let alliesDiv = await Util.select(message,alliesConst,1,alliesUser);
		let axisDiv = await Util.select(message,axisList,1,axisUser);
		
	} catch(err) {
		message.reply(`${err}, матч отменён`);
		return;
	}

	message.channel.send(`Матч <@${alliesUser.id}> против <@${axisUser.id}> \n
	Карта: ${map}\n <@${alliesUser.id}> ${alliesDiv}\n <@${axisUser.id}> ${axisDiv}`);
}

client.on("message", process);





