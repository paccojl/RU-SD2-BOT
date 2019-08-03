const tables = require("./tables.json");

var axis = new Map();
var allies = new Map();
realreset();

function realreset() {
	for (div of tables.axisdivs) {
		axis.set(div, true);
	}
	for (div of tables.allydivs) {
		allies.set(div, true);
	}
}

function reset(message) {
	realreset();
	message.reply("Дивизии сброшены");
}

function help() {
	res = "";
	res = res.concat("**$div all <сторона>** - просмотреть текущий список дивизий\n");
	res = res.concat("**$div random <сторона>** - выбрать случайную дивизию из доступных\n");
	res = res.concat("**$div ban <название дивизии>** - забанить дивизию\n");
	res = res.concat("**$div unban <название дивизии>** - разбанить дивизию\n");
	res = res.concat("**$div reset** - сбросить список забаненых дивизий\n")
	return res;

}

function exec(message, command) {
	if (command[0]) {

		switch (command[0].toLowerCase()) {
			case "all":
				all(message, command.slice(1));
				break;

			case "axis":
				all(message, ["axis"]);
				break;

			case "allies":
				all(message, ["allies"]);
				break;

			case "ban":
				ban(message, command.slice(1));
				break;

			case "unban":
				unban(message, command.slice(1));
				break;

			case "random":
				rand(message, command.slice(1));
				break;

			case "reset":
				reset(message);
				break;

			case "help":
				message.reply(help());
				break;
		}
	} else {
		message.reply(help())
	}
}

function all(message, command) {
	ret = "";
	if (command[0]) {
		switch (command[0].toLowerCase()) {
			case "axis":
				ret += show(axis);
				break;

			case "allies":
				ret += show(allies);
				break;
		}
	} else {
		ret += "Союзники:\n";
		ret += show(allies);
		ret += "\nОсь:\n";
		ret += show(axis);
	}
	message.reply("```" + ret + "```");
}

function show(side) {
	let aval = Array.from(side.keys()).filter(x => { return side.get(x) });
	let banned = Array.from(side.keys()).filter(x => { return !side.get(x) });
	let ret = "";
	ret += "Доступны:\n";
	for (i in aval) {
		ret += aval[i] + '\n';
	}
	if (banned.length != 0) {
		ret += "\nЗабанены:\n";
		for (i in banned) {
			ret += banned[i] + '\n';
		}
	}
	return ret;
}

function ban(message, command) {
	divName = command.join(' ').trim();
	if (divName === '') return;

	for (let div of allies.keys()) {
		if (div.toLowerCase().startsWith(divName.toLowerCase())) {
			allies.set(div, false);
			all(message, ["allies"]);
			return;
		}
	}
	for (let div of axis.keys()) {
		if (div.toLowerCase().startsWith(divName.toLowerCase())) {
			axis.set(div, false);
			all(message, ["axis"]);
			return;
		}
	}

}

function unban(message, command) {
	divName = command.join(' ').trim();
	if (divName === '') return;

	for (let div of allies.keys()) {
		if (div.toLowerCase().startsWith(divName.toLowerCase())) {
			allies.set(div, true);
			all(message, ["allies"]);
			return;
		}
	}
	for (let div of axis.keys()) {
		if (div.toLowerCase().startsWith(divName.toLowerCase())) {
			axis.set(div, true);
			all(message, ["axis"]);
			return;
		}
	}
}

function rand(message, command) {
	if (command[0]) {
		switch (command[0].toLowerCase()) {
			case "axis":
				message.reply(randomDeck(axis));
				break;
			case "allies":
				message.reply(randomDeck(allies));
				break;
		}
	} else {
		if (Math.random() < 0.5) {
			message.reply(randomDeck(axis));
		} else {
			message.reply(randomDeck(allies));
		}
	}
}
function randomDeck(side) {
	let list = Array.from(side.keys()).filter(x => { return side.get(x) });
	return list[random(list.length)];
}

function random(num) {
	return Math.floor(Math.random() * num);
}


module.exports.exec = exec;
module.exports.init = realreset;
module.exports.help = help;