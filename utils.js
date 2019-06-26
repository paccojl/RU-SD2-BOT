const emojis = ["🇦","🇧","🇨","🇩","🇪","🇫","🇬","🇭","🇮","🇯","🇰","🇱","🇲","🇳","🇴","🇵","🇶","🇷","🇸","🇹","🇺","🇻","🇼","🇽","🇾"];

async function select(message,list,num = 1,users,description ='', timeoutms=60000) {

	let	reply = `${description}\n Выбери ${num} из списка\n${list.map((e,i)=>{return `${emojis[i]} ${e}`}).join('\n')}`;

	let replyMessage = await message.channel.send("...");
	for(i in list){
		 await replyMessage.react(emojis[i]);
	}
	
	replyMessage.edit(`${users.map((u)=>{return `<@${u.id}>`}).join(' ')}, ${reply}`);

	let collector = replyMessage.createReactionCollector((r, u) => users.includes(u));
	try{
		await new Promise(function(resolve,reject){
			setTimeout(reject,timeoutms,`${users.map((u)=>{return `<@${u.id}>`}).join(' ')}, не ответил`);
			collector.on("collect", ()=>{
				if(replyMessage.reactions.filter((r)=> users.some((u)=>r.users.has(u.id))).size >= num){
					resolve();
				}
			});
		});
	} catch(err){
		replyMessage.delete();
		throw err;
	} finally {
		collector.stop();
	}

	let answer = new Array();
	replyMessage.reactions.filter( reaction => users.some((u)=>reaction.users.has(u.id))).first(num).forEach(reaction => answer.push(list[emojis.indexOf(reaction.emoji.name)]));
	
	replyMessage.edit(`${description}\n${users.map((u)=>{return `<@${u.id}>`}).join(' ')} выбрал ${answer.join(", ")}`);
	replyMessage.clearReactions();
	
	return answer;
}

async function confirm(message,users,description = `подтвердите`,timeoutms = 30000, required = users.length){

	let replyMessage = await message.channel.send("...");

	await replyMessage.react("👍");
	await replyMessage.react("👎");

	replyMessage.edit(/*`${users.map(u=>{return `<@${u.id}>`}).join(` `)}*/`${description}`);

	let collector = replyMessage.createReactionCollector((r, u) => users.map(u=>u.id).includes(u.id));
	try{
		await new Promise(function (resolve,reject){
			setTimeout(reject,timeoutms,`истекло время ожидания`);
			collector.on("collect", (r) => {
				if(r.emoji.name === "👍" && users.filter((u)=>r.users.has(u.id)).length >= required){
					resolve();
				}
				if(r.emoji.name === "👎" && users.some((u)=>r.users.has(u.id))){
					reject(`${users.filter((u)=>r.users.has(u.id)).map((u)=>{return `<@${u.id}>`}).join(` `)} отказался`);
				}
			})
		});
	} catch(err) {
		throw err;
	} finally {
		collector.stop();
		await replyMessage.delete();
	}
	return true;
}


function random(array){
	return array[Math.floor(Math.random()*array.length)];
}




module.exports.select = select;
module.exports.confirm = confirm;
module.exports.random = random;