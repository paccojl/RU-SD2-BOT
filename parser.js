/*
  This file is reworked and translated from SD2-SODBOT ReplayParser by Matthew Betts.
*/


const Discord = require("discord.js");
const fetch = require("node-fetch");
const fileType = require("file-type");

function getGameDuration(time) {
  if (time === "0" || time === 0) {
    return "No Limit";
  }
  const minutes = Math.floor(time / 60);
  const seconds = time - minutes * 60;
  return `${minutes}:${seconds.padStart(2)}`;
}


function getHeader(binData){
    let res = [];
    for(i=0;i<5;i++){
      let count = parseInt(binData.slice(0,5),2);
      res.push(parseInt(binData.slice(5,5+count),2));
      binData = binData.slice(5+count);
    }
    return res;
}
module.exports.getDivision = getDivision;
function getDivision(code) {
  let base64data = Buffer.from(code, "base64");
  let binaryData = "";
  for (x of base64data.values()) {
    binaryData = binaryData.concat(x.toString(2).padStart(8,"0"));
  }
  let header = getHeader(binaryData);
  return [divs[header[2]],incomeTypes[header[4]]];
}

module.exports.replayInfo = replayInfo;
function replayInfo(message){
  const url = message.attachments.first().url;
  fetch(url)
    .then(res => res.buffer())
    .then(async buffer => {
      fileType(buffer);
      content = buffer.toString();
      content = content.slice(content.search(`{"game":`));
      const gameBlock = content.slice(0,content.search("}}")+2);
      content = content.slice(content.search(`{"result":`));
      const resultBlock = content.slice(0,content.search("}}")+2);
      const gameDataAll = JSON.parse(gameBlock);
      const gameData = gameDataAll.game;
      const resultData = JSON.parse(resultBlock).result;

      const gameName = gameData.ServerName;
      const duration = getGameDuration(resultData.Duration);
      const startMoney = gameData.InitMoney;
      const timeLimit = getGameDuration(gameData.TimeLimit);
      const gameVersion = gameData.Version;
      const outCome = victory[resultData.Victory];
      const scoreCap = `${scoreLimit[gameData.ScoreLimit]} (${gameData.ScoreLimit})`;
      const income = incomeLevel[gameData.IncomeRate];
      const gameMode = mode[gameData.VictoryCond];
      const inversePoints = gameData.InverseSpawnPoints?"Прямые":"Перевёрнутые";

      const mapInfo = gameData.Map.match(/_\dx\d_(.+)_LD_(\dv\d)/);
      const mapName = maps[mapInfo[1]];
      const mapSize = mapInfo[2];

      let players = [];

      for(playerKey of Object.keys(gameDataAll).slice(1)){
        let player = gameDataAll[playerKey];
        let name = player.PlayerName?player.PlayerName:"AI";
        let eugId = player.PlayerUserId;
        let level = player.PlayerLevel;
        let elo = player.PlayerElo;
        let rank = player.PlayerRank;
        let deck = player.PlayerDeckContent;
        let [div,income] = getDivision(player.PlayerDeckContent);
        let side = player.PlayerAlliance;
        players.push({"name":name,"elo":elo,"rank":rank,"deck":deck,"side":side,"level":level,"eugId":eugId,"div":div,"income":income});
      }

      const embed = new Discord.RichEmbed();

      embed.setTitle(gameName ? gameName : "");
      embed.setColor(0x00AE86);
      embed.setAuthor(message.author.username,message.author.avatarURL);
      embed.addField("Исход боя", `||${outCome}||`, true);
      embed.addField("Продолжительность", `||${duration}||`, true);

      embed.setFooter(`Версия игры: ${gameVersion}`);
      embed.addField("Лимит очков", scoreCap, true);
      embed.addField("Лимит времени", timeLimit, true);
      embed.addField("Доход", income, true);
      embed.addField("Режим", gameMode, true);
      embed.addField("Стартовые поинты", startMoney, true);
      embed.addField("Карта", `${mapName} ${mapSize}`, true);
      embed.addField("Точки спавна", inversePoints, true);

      for(player of [ ...players.filter(p=>p.side) , ...players.filter(p=>!p.side)]){
        embed.addBlankField();
        embed.addField("Игрок", `${player.name} (EugID: ${player.eugId})`);
        embed.addField("Уровень", `${player.level}`,true);
        embed.addField("Ранг", `${player.rank} (${player.elo})`,true);
        embed.addField("Дивизия", `${player.div} (${player.income})`);
        embed.addField("Код дивизии", `${player.deck}`);
      }


      message.channel.send(embed);
    });
};

//Data

/**
For each value, there's a header (bit counter, typically 5 bits), and a body (actual value, size(s) encoded in header):
Deck code fragment example, 33 units:

|bool   |bool   | division     | card count |income |units encoding         ||header  |unit       |transport  ||header  |unit       |transport  |...
|00001|1|00001|0|01000|10000110|00110|100001|00001|0|00010|00010|00010|01011||01|00|01|00111111100|00101011010||01|00|00|00010001101|01110011001|...
|1    |1|1    |0|8    |<   8  >|6    |<  6 >|1    |1|2    |2    |2    |11   || <  2+2+2+11+11                >||
|1 bit|T|1 bit|F|8 bit|division|6 bit|cards |1 bit|$|count|phase|xp   |unit || unit card                      ||

for comparison, 1 unit deck:
|bool   |bool   | division     |crd cnt|income |units encoding         ||headr|unit       |transport  || padding
|00001|1|00001|0|01000|10000110|00001|1|00001|0|00001|00001|00001|01011||1|0|1|01100011100|00000000000||00000000
|1    |1|1    |0|8    |<   8  >|1    |1|1    |1|1    |1    |1    |11   ||< 1+1+1+11+11               >||
  
*/

const incomeTypes = {
    0:"Balanced",
    1:"Vanguard",
    2:"Maverick",
    3:"Juggernaut"
}

const divs = {
  132 : "2-ya Gvard. Tankovy Korpus",
  260 : "3-ya Gvard. Tankovy Korpus",
  134 : "29-ya Tankovy Korpus",
  144 : "3-ya Gvard. Mechanizi. Korpus",
  148 : "Podv. Gruppa Tyurina",
  147 : "Podv. Gruppa Bezuglogo",
  150 : "9-ya Gvard. Kavalerii",
  143 : "26-ya Gvard. Strelkovy",
  145 : "44-ya Gvard. Strelkovy",
  142 : "184-ya Strelkovy",
  70 : "3rd US Armoured",
  153 : "2e Blindée",
  152 : "15th Infantry",
  66 : "3rd Canadian Infantry",
  71 : "5. Panzer",
  135 : "20. Panzer",
  155 : "21. Panzer",
  154 : "116. Panzer",
  157 : "Panzer Lehr",
  138 : "Gruppe Harteneck",
  259 : "1. Skijäger",
  137 : "78. Sturm",
  149 : "14. Infanterie",
  136 : "28. Jäger",
  156 : "352. Infantrie",
  139 : "Korück 559",
  140 : "1. Lovas",
  141 : "12. Tartalék"
}

const incomeLevel = {
  "0": "None",
  "1": "Very Low",
  "2": "Low",
  "3": "Normal",
  "4": "High",
  "5": "Very High"
};

const mode = {
  "2": "Conquest",
  "3": "Closer Combat",
  "5": "Breakthrough"
};

const victory = {
  "0": "Total Defeat",
  "1": "Major Defeat",
  "2": "Minor Defeat",
  "3": "Draw",
  "4": "Minor Victory",
  "5": "Major Victory",
  "6": "Total Victory"
};

const scoreLimit = {
  "1000": "Low",
  "2000": "Normal",
  "4000": "High"
};



const maps = {
  Urban_River_Bobr: "Bobr",
  Ville_Centrale_Haroshaje :  "Haroshaje",
  River_Swamp_Krupa : "Krupa",
  Lenina : "Lenina",
  Plateau_Central_Orsha_E : "Orsha East",
  Proto_levelBuild_Orsha_N : "Orsha North",
  Ostrowno : "Ostrowno",
  Shchedrin : "Shchedrin",
  Lacs_Sianno : "Sianno",
  Slutsk_E : "Slutsk East",
  Slutsk_W : "Slutsk West",
  Slutsk : "Slutsk",
  Foret_Tsel : "Tsel",
  Highway : "Autobahn Zur Holle",
  Beshankovichy : "Beshankovichy",
  West_Bobrujsk : "Bobrujsk West",
  Astrouna_Novka : "Novka",
  Veselovo : "Veselovo",
  East_Vitebsk : "Vitebsk East",
  Urban_roads_Krupki : "Krupki",
  Lipen : "Lipen",
  Lyakhavichy : "Lyakhavichy",
  Marecages_Naratch_lake : "Naratch Lake",
  Rivers_Pleshchenitsy_S : "Pleshchenitsy South",
  Bridges_Smolyany : "Smolyany",
}