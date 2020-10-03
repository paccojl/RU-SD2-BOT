const Discord = require('discord.js');
const Util = require('./utils.js')
const client = new Discord.Client();
const config = require("./config");
const tables = require("./tables");
const mapsConst = tables.maps;
const axisConst = tables.axisdivs;
const alliesConst = tables.allydivs;
const sql = require("./sql.js");
const prefix = config.prefix;
const map = require("./map");
const div = require("./div");
const parse = require("./parser");
const scrapper = require("./scraper");


const phaseEnum = ["A","B","C"];
const starEnum = ["","✯","✯✯","✯✯✯"];


client.login(config.token);

client.on('ready' , () => {
	client.user.setActivity('ваши команды', { type: 'LISTENING' });
});



function process(message) {
	
	if(message.attachments.first()
	&& message.channel.type === 'text'
	&& !message.author.bot){
		if(message.attachments.first().url.endsWith(".rpl3")){
			parse.replayInfo(message);
		}
	}
		
	if(message.content.startsWith(prefix) 
	&& message.channel.type === 'text' 
	&& message.channel.name === "deck-chat"
	&& !message.author.bot){
		
		command = message.content.substr(1);
		command = command.split(/\s+/);	
		
		if(command[0].toLowerCase() === "deck"){
			if(command[1] ){
				let embed = new Discord.RichEmbed();
				let [divname,divincome,units] = parse.getDivision(command[1]);
				if(!(divname && divincome)){
					return;
				}
				if(command[2]){
					embed.title = command.slice(2).join(' ');;
				}
				embed.setAuthor(message.author.username,message.author.avatarURL);
				embed.addField("Дивизия", divname,true);
				embed.addField("Тип дохода",divincome,true);
				embed.addField("Код", command[1]);
				units = units.sort((a,b)=> a.phase - b.phase);
				let unitsToString = (v => `${phaseEnum[v.phase]} ${v.count} x ${starEnum[v.xp]} ${v.name} ${v.transport?`on ${v.transport}`:""}`)
				let addCat = ((n,f) => {
					let catUnits = units.filter(v => v.type == f);
					if(catUnits.length!=0){
						embed.addField(n, catUnits.map(unitsToString).join("\n") );
					}
					
				});
				
				addCat("Recon","Recons");
				addCat("Infantry","Infantry");
				addCat("Tank","Tanks");
				addCat("Support","Support");
				addCat("Anti-Tank","AT")
				addCat("Anti-Air","DCA");
				addCat("Artillery","Art");
				addCat("Air","Planes");

				if(message.attachments.first()){
					embed.setImage(message.attachments.first().url);
				}
				message.channel.send(embed);
			}else{
				message.author.send("**$deck <код для импорта> <название(необязательно)>**\n"+
				"Пример: \`\`\`$deck DCRLF6KEIS4C3G8hLg45Et7jmS4OOVo045VUzjkaQlaYcgABkt7jkWugAQdOABFgwANmDAAQGQVpEkpWkqJFaUcgABEJZWlAkOOUI845BtIAFBGuOgcuABWiLjlVRgAQPC45RxYAFbPAAkuWAAA= \nтестовая 9ка\`\`\`\n"+
				"Можно написать эту комманду в описании к скриншоту чтобы он добавился в эмбед\n"+
				"После отправки своё сообщение можно удалить чтобы остался только эмбед");
			}		
		}
	}


	if(message.content.startsWith(prefix) 
	&& message.channel.type === 'text' 
	&& message.channel.name === "ru-sd-bot"
	&& !message.author.bot){

		command = message.content.substr(1);
		command = command.split(/\s+/);		

		switch(command[0].toLowerCase()){

			case("online"):
				scrapper.online(message);
			break;

			case("map"):
				map.exec(message,command.slice(1));
			break;
	
			case("div"):
				div.exec(message,command.slice(1));
			break;
	
			case("side"):
			case("faction"):
				if(Math.random()<0.5){
					message.reply("Союзники");
				}else{
					message.reply("Ось");
				}
			break;
	
			case("flip"):
			case("coin"):
				if(Math.random()<0.5){
					message.reply("Орёл");
				}else{
					message.reply("Решка");
				}
			break;

			//new features
			
			// case("setup"):
			// 	setup(message);
			// break; 

			// case("noranksetup"):
			// 	setup(message,false);
			// break;
		
			// case("register"):
			// 	sql.register(message);
			// break;

			// case("unregister"):
			// 	if(isAdmin(message.author)){
			// 		sql.unregister(message);
			// 	break;
			// }

			// case("forceCommit"):
			// 	if(isAdmin(message.author)){
			// 		forceCommit(message);
			// 	break;
			// }
			// case("deleteMatch"):
			// 	if(isAdmin(message.author)){
			// 		sql.deleteMatch(message);
			// 	break;
			// }

			// case("commitWin"):
			// 	commit(message,1);
			// break;

			// case("stats"):
			// 	sql.getStats(message,message.author);
			// break;
			// case("leaderboard1v1"):
			// 	sql.leaderboard(message,1);
			// break;
			// case("leaderboard2v2"):
			// 	sql.leaderboard(message,2);
			// break;
			// case("leaderboardTeam"):
			// 	sql.leaderboard(message,3);
			// break;
			// case("help"):
			// 	message.reply(//'**$rules** - Правила рейтинга\n'+
			// 	'**$stats** - личная статистика\n'+
			// 	'**$leaderboard1v1\\2v2\\Team** - Таблица рейтинга\n'+
			// 	'**$register** - зарегистрироваться в рейтинге\n'+
			// 	'**$setup <список игроков>** - собрать рейтинговую игру\n'+
			// 	'**$noranksetup <список игроков>** - собрать игру без записи в базу рейтинга\n'+
			// 	'**$flip $coin** - бросить монетку\n'+
			// 	'**$faction $side** - случайная сторона\n'+
			// 	'Дивизии:\n'+div.help()+
			// 	'Карты:\n'+map.help())
			// break;
		}
	}
}

function isAdmin(user){
	return config.adminList.includes(user.id);
}



async function test(message){
	//sql.recalcRating();


	message.reply(Number.parseInt(message.content.test(/no(\d+)/)));
	

}

async function getMentionsArray(message){
	let regexp = /<@!?(\d+)>/g;
	let list = new Array();
	while( match = regexp.exec(message.content)){
		list.push(await client.fetchUser(match[1]));
	}
	return list;
}


async function setup(message,rank = true){

	try{

		let orderedMentions = (await getMentionsArray(message)).filter(u => u.bot == false);

		let size = Math.ceil(orderedMentions.length / 2);
		if(size>4){
			throw `максимальный размер матча 4 на 4`;
		}
		if(size<1){
			throw `используйте упоминания ползователей клавишей @ чтобы указать участников матча`;
		}
		if(!message.mentions.users.has(message.author.id) && !isAdmin(message.author)){
			throw `Необходимо упомянуть себя, только администраторы могут создавать матчи без своего участия`
		}

		let teamOne;
		let teamTwo;
		if(orderedMentions.length == size*2){
			teamOne = orderedMentions.slice(0,size);
			teamTwo = orderedMentions.slice(size);
		} else{
			throw `Необходимо упомянуть ${size*2} пользователей`;
		}
	

	

		//проверить все ли игроки могут участвовать в матче(зарегестрированны и нет текущего матча)
		if(rank){
			await sql.canPlay(message.mentions.users.array());
		}
		
		//запросить подтверждение всех игроков
		await Util.confirm(message,message.mentions.users.array(),`Подтвердите участие в матче
${teamOne.map(u=>{return `<@${u.id}>`}).join(' ')}
против
${teamTwo.map(u=>{return `<@${u.id}>`}).join(' ')}` ,60000);

		//определить стороны случайным образом	
		let axisTeam;
		let alliesTeam;

		if(Util.random([0,1]) === 0){
			axisTeam = teamOne;
			alliesTeam = teamTwo;
		} else {
			alliesTeam = teamOne;
			axisTeam = teamTwo;
		}

		message.channel.send(`Союзники: ${alliesTeam.map(u=>{return `<@${u.id}>`}).join(' ')}
Ось: ${axisTeam.map(u=>{return `<@${u.id}>`}).join(' ')}`);

		//провести баны карт
		
		let maps = mapsConst[size*2];
		let mapBans = new Array(0);

		if(size < 4){
			let answer = await Util.select(message,maps,2,alliesTeam,"Союзники банят 2 карты");
			maps = maps.filter(x=> answer.indexOf(x)<0);
			mapBans.push(...answer);

			answer = await Util.select(message,maps,2,axisTeam,"Ось банит 2 карты");
			maps = maps.filter(x=> answer.indexOf(x)<0);
			mapBans.push(...answer);
		}
		
		//выбрать случайную из оставшихся
		let map = Util.random(maps);

		message.channel.send(`Случайная карта: ${map}`);

		//баны дивизий
		let alliesBan = await Util.select(message, alliesConst, 2, axisTeam,"Ось банит 2 дивизии Союзников");
		let axisBan = await Util.select(message, axisConst, 2, alliesTeam,"Союзники банят 2 дивизии Оси");

		let alliesAvalibleList = alliesConst.filter(x => alliesBan.indexOf(x)<0);
		let axisAvalibleList = axisConst.filter(x => axisBan.indexOf(x)<0);

		let sidesArray = Array(0);

		//выбор дивизий
		for(let i=0;i<size;i++){
			let div = await Util.select(message, axisAvalibleList, 1, [axisTeam[i]],"Выбор дивизии для матча");
			
			let div2 = await Util.select(message, alliesAvalibleList, 1, [alliesTeam[i]],"Выбор дивизии для матча");

			sidesArray.push({ id: axisTeam[i].id, side: 1, division: div[0] });
			sidesArray.push({ id: alliesTeam[i].id, side: 0, division: div2[0] });
		}

	
		//матч собран
		//записать данные о матче, сторонах, банах и заблокировать игроков в базе данных
		let matchid;
		if(rank){
			matchid = await sql.regMatch(size, sidesArray, mapsConst[size*2].indexOf(map) ,mapBans, alliesBan, axisBan);
		}

			//вывести информацию о собранном матче

			message.channel.send(`Матч ${rank?`№${matchid}`:''}
${size}v${size}
Карта: ${map}
Союзники: 
${sidesArray.filter(e=>{return e.side === 0}).map(e=>{return `<@${e.id}> : ${e.division}`}).join(`\n`)}
Ось: 
${sidesArray.filter(e=>{return e.side === 1}).map(e=>{return `<@${e.id}> : ${e.division}`}).join(`\n`)}
${rank?"Для подтверждения результатов матча выигравшая сторона использует команду $commitWin":''}`);
	} catch(err) {
		message.channel.send(`${err}, матч отменён`);
		return;
	}
}

async function forceCommit(message){
	if(message.content.test(/no(\d+)/) && message.content.test(/res(\d+)/)){
		let matchid = Number.parseInt(message.content.match(/no(\d+)/)[1]);
		let result = Number.parseInt(message.content.test(/res(\d+)/)[1]);

		let changes = sql.commit(matchid,result);
		message.channel.send(`Результат матча №${matchid} подтверждён администратором!
Выигравшая сторона: ${result==0?'Союзники':'Ось'}
Изменения в рейтинге:
${changes.map(p =>{return `<@${p.id}> ${p.elo} => ${p.newElo}`}).join('\n')}`);
	}

}


async function commit(message,wl){

	try{
		let matchid = await sql.getPlayerCurrentMatch(message.author);
		if(matchid != null){

			let players = await sql.getMatchSides(matchid);
			let authorSide = players.find(player => player.id === message.author.id).side;

			let result =!wl^authorSide; // 0 = allies wdin , 1= axis win

			let playersToConfirm = players.filter(p => p.side != authorSide);

			let description = `${playersToConfirm.map(p=>{return `<@${p.id}>`}).join(` `)}\n Вы ${wl==1?'проиграли':'победили'} в матче №${matchid}, подтвердите`;

			if(await Util.confirm(message,playersToConfirm,description,60000,1)){

				let eloChanges = await sql.commit(matchid,result);

				message.channel.send(`Результат матча №${matchid} подтверждён!
Выигравшая сторона: ${result==0?'Союзники':'Ось'}
Изменения в рейтинге:
${eloChanges.map(p =>{return `<@${p.id}> ${p.elo} => ${p.newElo}`}).join('\n')}`);

			}

		} else {
			message.reply("не найден текущий матч");
		}
	} catch (err){
		message.reply(err);
	}
}

client.on("message", process);

client.on("error", (err)=> console.log(err));






