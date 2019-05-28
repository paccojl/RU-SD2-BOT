const emojis = ["🇦","🇧","🇨","🇩","🇪","🇫","🇬","🇭","🇮","🇯","🇰","🇱","🇲","🇳","🇴","🇵","🇶","🇷","🇸","🇹","🇺","🇻","🇼","🇽","🇾"];

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

async function confirm(_message,user,timeoutms = 30000){

	let replyMessage = await _message.channel.send("...");

	await replyMessage.react("👍");
	await replyMessage.react("👎");

	replyMessage.edit("<@"+user.id+">, подтверди");


	let collector = replyMessage.createReactionCollector((reaction, mUser) => mUser.id === user.id);
	let ret;
	try{
		let reaction = await Promise.race([collector.next,timeout(timeoutms)]);
		if(reaction.emoji.name === "👍") ret = true;
		else if (reaction.emoji.name === "👎") ret = false;
	} catch(err) {
		throw "<@"+user.id+"> не ответил";
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
module.exports.confirm = confirm;
module.exports.random = random;