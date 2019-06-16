const emojis = ["🇦","🇧","🇨","🇩","🇪","🇫","🇬","🇭","🇮","🇯","🇰","🇱","🇲","🇳","🇴","🇵","🇶","🇷","🇸","🇹","🇺","🇻","🇼","🇽","🇾"];

async function select(message,list,num = 1,user = message.author, doStr = "Выбери",didStr= "выбрал", timeoutms=60000) {

	let	reply = ` ${doStr} ${num} из списка\n${list.map((e,i)=>{return `${emojis[i]} ${e}`}).join('\n')}`;

	let replyMessage = await message.channel.send("...");
	for(i in list){
		 await replyMessage.react(emojis[i]);
	}
	replyMessage.edit(`<@${user.id}>, ${reply}`);

	let collector = replyMessage.createReactionCollector((reaction, mUser) => mUser.id === user.id);

	try{
		await Promise.race([waitForReactions(replyMessage,collector,user,num),timeout(timeoutms)]);
	} catch(err){
		replyMessage.delete();
		throw `<@${user.id}> не ответил`;
	} finally {
		collector.stop();
	}

	let answer = new Array();
	replyMessage.reactions.filter( reaction => reaction.users.has(user.id)).first(num).forEach(reaction => answer.push(list[emojis.indexOf(reaction.emoji.name)]));
	
	replyMessage.edit(`<@${user.id}> ${didStr} ${answer.join(", ")}`);
	replyMessage.clearReactions();
	
	return answer;
}


async function waitForReactions(message,collector,user,num){
	while(message.reactions.filter(reaction => reaction.users.has(user.id)).size<num){
		await collector.next;
	}
}

function banSelect(message,list,num=1,user = message.author){
	select(message,list,num,user,"Забань","забанил");
}

async function confirm(message,user,timeoutms = 30000){

	let replyMessage = await message.channel.send("...");

	await replyMessage.react("👍");
	await replyMessage.react("👎");

	replyMessage.edit(`<@${user.id}>, подтверди`);


	let collector = replyMessage.createReactionCollector((reaction, mUser) => mUser.id === user.id);
	let ret;
	try{
		let reaction = await Promise.race([collector.next,timeout(timeoutms)]);
		if(reaction.emoji.name === "👍") ret = true;
		else if (reaction.emoji.name === "👎") ret = false;
	} catch(err) {
		throw `<@${user.id}> не ответил`;
	} finally {
		collector.stop();
		await replyMessage.delete();
	}
	return ret;
}

function timeout(ms) {
	return new Promise((_,reject) => setTimeout(reject,ms,"timeout"));
}

function random(array){
	return array[Math.floor(Math.random()*array.length)];
}


module.exports.select = select;
module.exports.banSelect = banSelect;
module.exports.confirm = confirm;
module.exports.random = random;