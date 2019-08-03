const tables = require("./tables.json");


var size = 2;

var notbanned = new Set(tables.maps[size]);


function exec(message, command) {
	if (command[0]) {
		switch (command[0].toLowerCase()) {
			case "all":
				all(message);
				break;

			case "size":
				setsize(message, command[1]);
				break;


			case "ban":
				ban(message, command.slice(1));
				break;

			case "unban":
				unban(message, command.slice(1));
				break;

			case "random":
				rand(message);
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

function setsize(message, newsize) {
	if (/(\d)v\d/.test(newsize)) {
		newsize = newsize.match(/(\d)v\d/)[0];
	} else {
		message.reply("Невенрный формат");
		return;
	}

	let newsizeInt = Number.parseInt(newsize) * 2;
	if (!isNaN(newsizeInt) && newsizeInt <= 8 && newsizeInt >= 2) {
		size = newsizeInt;
		reset(message);
	}

}

function help() {
	res = "";
	res = res.concat("**$map size <1v1|2v2|3v3|4v4>** - сменить набор карт по размеру\n")
	res = res.concat("**$map all** - просмотреть текущий список карт\n");
	res = res.concat("**$map random** - выбрать случайную карту из доступных\n");
	res = res.concat("**$map ban <название карты>** - забанить карту\n");
	res = res.concat("**$map unban <название карты>** - разбанить карту\n");
	res = res.concat("**$map reset** - сбросить список забаненых карт\n")
	return res;

}

function random(num) {
	return Math.floor(Math.random() * num);
}

function all(message) {
	ret = `${size / 2}v${size / 2}\n`;
	ret = ret.concat("Доступны:\n");
	for (div of notbanned) {
		ret = ret.concat(div + "\n");
	}
	if (notbanned.size != tables.maps[size].length) {
		ret = ret.concat("\nЗабанены:\n");
		for (map of tables.maps[size]) {
			if (!notbanned.has(map)) {
				ret = ret.concat(map + "\n");
			}
		}
	}
	message.reply("```" + ret + "```");
}

function unban(message, command) {
	mapName = "";
	for (i in command) {
		mapName = mapName.concat(command[i] + ' ');
	}
	mapName = mapName.trim();
	if (mapName === '') return;

	for (map of tables.maps[size]) {
		if (map.toLowerCase().startsWith(mapName.toLowerCase())) {
			if (notbanned.has(map)) {
			} else {
				notbanned.add(map);
			}
			all(message);
			return;
		}
	}
	message.reply("Карта " + mapName + " не найдена");
}

function ban(message, command) {
	mapName = "";
	for (i in command) {
		mapName = mapName.concat(command[i] + ' ');
	}
	mapName = mapName.trim();
	if (mapName === '') return;

	for (map of tables.maps[size]) {
		if (map.toLowerCase().startsWith(mapName.toLowerCase())) {
			if (!notbanned.has(map)) {
			} else {
				notbanned.delete(map);
			}
			all(message);
			return;
		}
	}
	message.reply("Карта " + mapName + " не найдена");
}

function reset(message) {
	notbanned = new Set(tables.maps[size]);
	message.reply("Карты сброшены")
}

function rand(message) {
	let notbannebarr = Array.from(notbanned);
	if (notbannebarr.length != 0) {
		message.reply(notbannebarr[random(notbannebarr.length)]);
	} else {
		message.reply("Не осталсоь доступныx");
	}

}


module.exports.exec = exec;
module.exports.help = help;
