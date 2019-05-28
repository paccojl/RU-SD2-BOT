const Discord = require('discord.js');
const Util = require('./utils.js')
const client = new Discord.Client();
const config = require("./config");
const tables = require("./tables");
const mapsConst = tables.maps;
const axisConst = tables.axisdivs;
const alliesConst = tables.allydivs;



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
}

async function test(message){
	Util.confirm(message,message.author);

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
	
	//random pick side
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

	message.channel.send('Союзники :<@' + alliesUser.id + '> Ось: <@' + axisUser.id +'>');

	//allies bans 3 maps, axis bans 2 maps

	let maps = mapsConst;
	let answer = await Util.select(message,maps,3,alliesUser,"Забань","забанил");
	maps = maps.filter(x=> answer.indexOf(x)<0);
	answer = await Util.select(message,maps,2,axisUser,"Забань","забанил");
	maps = maps.filter(x=> answer.indexOf(x)<0);

	//random pick map from rest
	let map = Util.random(maps);

	message.channel.send('<@' + alliesUser.id + '> <@' + axisUser.id +'> Случайная карта: ' + map);

	//axis bans 3 divisions, allies bans 2 divisions 

	let alliesBan = await Util.select(message,alliesConst,3,axisUser,"Забань","забанил");
	let axisBan = await Util.select(message,axisConst,2,alliesUser,"Забань","забанил");

	//allies pick division then axis picks counterpick
	let alliesList = alliesConst.filter(x => alliesBan.indexOf(x)<0);
	let axisList = axisConst.filter(x => axisBan.indexOf(x)<0);
	let alliesDiv = await Util.select(message,alliesConst,1,alliesUser);
	let axisDiv = await Util.select(message,axisList,1,axisUser);

	message.channel.send('Матч <@'+alliesUser.id+'> против <@'+axisUser.id+'> \n'+
	'Карта: ' +map +'\n <@'+alliesUser.id+'> '+ alliesDiv + '\n <@'+axisUser.id+'> '+axisDiv);
}

client.on("message", process);





