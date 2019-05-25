const Discord = require('discord.js');
const client = new Discord.Client();
const config = require("./config");
const mapsConst = [
		"Bois de Limors",
		"Carpiquet",
		"Carpiquet Duellist",
		"Caumont L'Evente",
		"Cheux",
		"Colleville",
		"Colombelles",
		"Cote 112",
		"Merderet",
		"Mont Ormel",
		"Odon",
		"Odon River",
		"Omaha",
		"Pegasus Bridge",
		"Pointe du Hoc",
		"Saint-Mere-Eglise",
		"Saint-Mere-Eglise Duellists"
	];
const axisConst = [
		"Panzer-Lehr",
		"12. SS-Panzer",
		"1. SS-Panzer",
		"2. Panzer",
		"9. Panzer",
		"21. Panzer",
		"116. Panzer",
		"17. SS-Panzergrenadier",
		"3. Fallschirmjager",
		"16. Luftwaffe",
		"91. Luftlande",
		"Festung Gross-Paris",
		"352. Infanterie",
		"716. Infanterie"
	];
const alliesConst = [
		"3rd Armoured",
		"4th Armoured",
		"101st Airborne",
		"2nd Infantry",
		"2e Blindee",
		"Demi-Brigade SAS",
		"7th Armoured",
		"Guards Armoured",
		"6th Airborne",
		"15th Infantry",
		"1st SSB",
		"3rd Canadian Infantry",
		"1 Pancerna",
		"1st Infantry"
	];

const emojis = ["🇦","🇧","🇨","🇩","🇪","🇫","🇬","🇭","🇮","🇯","🇰","🇱","🇲","🇳","🇴","🇵","🇶","🇷","🇸","🇹","🇺","🇻","🇼","🇽","🇾"];

client.login(config.token);

client.on('ready' , () => {
});



async function process(message) {
	if(message.content.startsWith("setup")){

		let firstSide = random([0,1]);

		let axisUser;
		let alliesUser;

		if(firstSide = 0){
			axisUser = message.mentions.members.first(1)[0];
			alliesUser = message.mentions.members.first(2)[1];
		} else {
			alliesUser = message.mentions.members.first(1)[0];
			axisUser = message.mentions.members.first(2)[1];
		}

		message.channel.send('Союзники :<@' + alliesUser.id + '> Ось: <@' + axisUser.id +'>');

		let maps = mapsConst;
		let answer = await select(message,maps,3,alliesUser,"Забань","забанил");
		maps = maps.filter(x=> answer.indexOf(x)<0);
		answer = await select(message,maps,2,axisUser,"Забань","забанил");
		maps = maps.filter(x=> answer.indexOf(x)<0);

		let map = random(maps);

		message.channel.send('<@' + alliesUser.id + '> <@' + axisUser.id +'> Случайная карта: ' + map);

		let alliesBan = await select(message,alliesConst,3,axisUser,"Забань","забанил");
		let axisBan = await select(message,axisConst,2,alliesUser,"Забань","забанил");
		let alliesList = alliesConst.filter(x => alliesBan.indexOf(x)<0);
		let axisList = axisConst.filter(x => axisBan.indexOf(x)<0);
		let alliesDiv = await select(message,alliesConst,1,alliesUser);
		let axisDiv = await select(message,axisList,1,axisUser);

		message.channel.send('Матч <@'+alliesUser.id+'> против <@'+axisUser.id+'> \n'+
		'Карта: ' +map +'\n <@'+alliesUser.id+'> '+ alliesDiv + '\n <@'+axisUser.id+'> '+axisDiv);

	}
	if(message.content.startsWith("test")){
		let maps = mapsConst;
		select(message,maps,3);
	}
}

client.on("message", process);


async function select(_message,list,num = 1,user = _message.author, doStr = "Выбери",didStr= "выбрал") {
	let reply = doStr+' '+num+' из \n';

	list.reduce( (acc,cur,i) => acc.concat(emojis[i]+ ' '+ cur));
	for(i in list){
		reply = reply.concat(emojis[i]).concat(' ').concat(list[i]).concat('\n');
	}
	let replyMessage = await _message.channel.send("...");
	for(i in list){
		 await replyMessage.react(emojis[i]);
	}
	replyMessage.edit("<@"+user.id+">, "+reply);

	let collector = replyMessage.createReactionCollector((reaction, mUser) => mUser.id === user.id);

	let answer = new Array();
	while(replyMessage.reactions.filter( reaction => reaction.users.has(user.id)).size<num){
		let reaction = await collector.next;
	}
	replyMessage.reactions.filter( reaction => reaction.users.has(user.id)).forEach(reaction => answer.push(list[emojis.indexOf(reaction.emoji.name)]));

	collector.stop();
	replyMessage.clearReactions();
	replyMessage.edit("<@"+user.id+"> "+didStr+" "+answer.join(", "));

	return answer;
}



function random(array){
	return array[Math.floor(Math.random()*array.length)];
}

