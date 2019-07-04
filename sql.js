/*
CREATE TABLE players(
id integer primary key, currentmatch REFERENCES matches(id) ON DELETE SET NULL, elo1v1 real, elo2v2 real, eloTeam real);
CREATE TABLE sides (matchid REFERENCES matches(id) ON DELETE CASCADE, playerid integer, side integer, division integer);
CREATE TABLE divbans
(matchid REFERENCES matches(id) ON DELETE CASCADE, playerid integer, division integer);
CREATE TABLE mapbans
(matchid REFERENCES matches(id) ON DELETE CASCADE, playerid integer, map integer);
CREATE TABLE matches
(id integer primary key, map integer, date text, dateCommit text , result integer, size integer);
CREATE TABLE banlist
(id integer primary key, date text, username text);
*/

const sqlite3 = require('sqlite3').verbose();
const tables = require("./tables");
const mapsConst = tables.maps;
const divConst = [tables.allydivs, tables.axisdivs];


async function register(message){
    let user = message.author;
    if(isBanned(user.id)){
        message.channel.send(`<@${user.id}> заблокирован!`)
    }
    try{
        await runQuery(`insert into players(id) values (${user.id})`);
        message.channel.send(`<@${user.id}> добро пожаловать!`);
    } catch (err){
        if(err.message === "SQLITE_CONSTRAINT: UNIQUE constraint failed: players.id"){
            message.channel.send(`<@${user.id}> уже зарегистрирован!`);
        } else {
            message.channel.send(err.message);
        }
    }
} 

async function unregister(message){
    if(message.mentions.users.size != 1){
        return;
    }
    let user = message.mentions.users.first();
    try{
        await runQuery(`delete from matches where exists(select * from sides where playerid = ${user.id} and matchid = matches.id)`);
        await runQuery(`delete from players where id = ${user.id}`);
        await runQuery(`insert into banlist(id,date,username) values (${user.id},datetime('now'),${user.username})`)
        await recalcRating();
        message.reply(`Игрок <@${user.id}> удалён из базы данных. Все матчи с его участием удалены. Рейтинг остальных игроков пересчитан.`)
    } catch (err){
        message.reply("Ошибка:"+err);
    }
}

async function isBanned(userid){
    return new Boolean(await select1Query(`select * from banlist where id = ${userid}`));
}

async function deleteMatch(message){
    if(message.content.test(/no(\d+)/)){
        let matchid = Number.parseInt(message.content.match(/no(\d+)/)[1]);
        try{
            await runQuery(`delete form matches where id = ${matchid}`);
            await recalcRating();
            message.channel.send(`Матч №${matchid} отменён/удалён. Рейтинг пересчитан без учёта данного матча.`)
        } catch (err){
            message.reply("Ошибка:"+err);
        }
    } else {
        message.reply("Неправильный формат")
    }
}

async function regMatch(size,sides,map,mapBans,alliesBans,axisBans){
    let matchId = await runQuery(`insert into matches(map,size,date) values (${map},${size},datetime('now'))`);

    let sidesvalues = sides.map((p)=>{return `(${matchId},${p.id},${p.side},${divConst[p.side].indexOf(p.division)})`}).join(',');

    runQuery(`insert into sides(matchid,playerid,side,division) values ${sidesvalues}`);

    let mapbanvalues = mapBans.map(mb=>{return `(${matchId},${mapsConst[size*2].indexOf(mb)})`}).join(`,`);

    runQuery(`insert into mapbans(matchid, map) values ${mapbanvalues}`);

    let alliesbanvalues = alliesBans.map(db=>{return `(${matchId},${divConst[0].indexOf(db)})`}).join(`,`);
    let axisbanvalues = axisBans.map(db => {return `(${matchId},${divConst[1].indexOf(db)})`}).join(`,`);

    runQuery(`insert into divbans(matchid,division) values ${alliesbanvalues},${axisbanvalues}`);
    
    for(player of sides){
        setPlayerCurrentMatch(player,matchId);
    }

    return matchId;
}

async function getMatchSides(matchId){
    let match = await select1Query(`select size from matches where id = ${matchId}`);
    let eloname = (match.size == 1)?`elo1v1`:(match.size==2)?`elo2v2`:`eloTeam`;          
    let players = await selectQuery(`select cast(playerid as text) as id, side, division, ifnull(${eloname},1500) as elo from sides join players on sides.playerid = players.id where matchid = ${matchId}`);
    return await players;

}

async function canPlay(users){
    for(user of users){
        let matchId = await getPlayerCurrentMatch(user);
        if (matchId != null){
            throw `<@${user.id}> участвует в матче №${matchId} и не может участвовать в других матчах до подтверждения результатов`;
        }
    }
    return true;
}

async function getPlayerCurrentMatch(user){
    try{
        let matchId = (await select1Query(`select currentmatch from players where id = ${user.id}`)).currentmatch;
        return matchId;
    } catch (err){
        throw `<@${user.id}> не зарегистрирован(Используйте команду $register)`;
    }
    
    
}

async function setPlayerCurrentMatch(user,matchid){
    try{
       await runQuery(`update players set currentmatch = ${matchid} where id = ${user.id}`);
    } catch (err){
        throw `<@${user.id}> не зарегистрирован`;
    }

}

function calcElo(playerElo,OpponentElo,result,K){
    let q = 1/(1+10 ** ((OpponentElo - playerElo)/400));
    return (playerElo + (K*(result - q))).toFixed(3);
}

async function getElo(user,size){
    let eloname = (size == 1)?`elo1v1`:(size==2)?`elo2v2`:`eloTeam`; 
    return await select1Query(`select cast(id as text), ${eloname} from players where id = ${user.id}`);
}

async function setElo(user,size,newElo){
    let eloname = (size == 1)?`elo1v1`:(size==2)?`elo2v2`:`eloTeam`;  
    runQuery(`update players set ${eloname} = ${newElo} where id = ${user.id}`);
}

async function commit(matchid,result){
    await runQuery(`update matches set result = ${result}, dateCommit = datetime('now') where id = ${matchid}`);
    await runQuery(`update players set currentmatch = null where currentmatch = ${matchid}`);
    let players = await getMatchSides(matchid);
    return await updateRating(players.filter(p => p.side==0),players.filter(p=>p.side == 1), result, players.length/2 );
}

async function getStats(message,user){
    try{
        let main = await select1Query(`select * from players where id = ${user.id}`);
        let games = await selectQuery(`select * from sides join matches on matches.id = sides.matchid where sides.playerid = ${user.id}; `);
        let rank1v1 = (await select1Query(`select rank from (select dense_rank() over (order by elo1v1 desc) as rank, id from players where elo1v1 is not null) where id = ${user.id}`));
        let rank2v2 = (await select1Query(`select rank from (select dense_rank() over (order by elo2v2 desc) as rank, id from players where elo2v2 is not null) where id = ${user.id}`));
        let rankTeam = (await select1Query(`select rank from (select dense_rank() over (order by eloTeam desc) as rank, id from players where eloTeam is not null) where id = ${user.id}`));
        let gamesCount = games.length;
        let gamesCount1v1 = games.filter(g=>g.size == 1).length;
        let gamesCount2v2 = games.filter(g=>g.size == 2).length;
        let gamesCountTeam = games.filter(g=>g.size > 2).length;
        let gamesWin1v1 = games.filter(g=> g.side == g.result && g.size == 1).length;
        let gamesWin2v2 = games.filter(g=> g.side == g.result && g.size == 2).length;
        let gamesWinTeam = games.filter(g=> g.side == g.result && g.size > 2).length;
        message.reply(`\`\`\`
Всего игр: ${gamesCount}
Текущий матч: ${main.currentmatch==null?'нет':`%${main.currentmatch}`}
---1v1---
ELO: ${main.elo1v1}
Место в рейтинге: ${rank1v1?rank1v1.rank:"null"}
Побед: ${gamesWin1v1}
Поражений: ${gamesCount1v1-gamesWin1v1}
%: ${(gamesWin1v1/gamesCount1v1)*100}%
---2v2---
ELO: ${main.elo2v2}
Место в рейтинге: ${rank2v2?rank2v2.rank:"null"}
Побед: ${gamesWin2v2}
Поражений: ${gamesCount2v2-gamesWin2v2}
%: ${(gamesWin2v2/gamesCount2v2)*100}%
---Коммандные---
ELO: ${main.eloTeam}
Место в рейтинге: ${rankTeam?rankTeam.rank:"null"}
Побед: ${gamesWinTeam}
Поражений: ${gamesCountTeam-gamesWinTeam}
%: ${(gamesWinTeam/gamesCountTeam)*100}%\`\`\``);
        } catch (err){
            message.reply(err);
        }
    
}

async function updateRating(allies,axis,result,size){ 

    let aliesaverage = allies.reduce((acc,p)=> acc+p.elo,0) / allies.length;    
    let axisaverage = axis.reduce((acc,p)=> acc+p.elo,0) / axis.length;

    let K = 30 * (1500/((aliesaverage+axisaverage)/2));

    let newaxis = axis.map(p => {
        return {id:p.id,  elo: p.elo, newElo : calcElo(p.elo,aliesaverage,result,K)};
    });
    let newallies = allies.map(p => {
        return {id:p.id, elo: p.elo, newElo : calcElo(p.elo,axisaverage,result^1,K)};
    });

    for(player of [...newaxis,...newallies]){
        setElo(player,size,player.newElo);
    }
    return [...newaxis,...newallies];
    
}

async function recalcRating(){
    let games = await selectQuery(`select id, result from matches where result IS NOT NULL order by datetime(dateCommit)`);
    await runQuery(`update players set elo1v1 = null, elo2v2 = null, eloTeam = null`);
    

    for(game of games){
        console.log(game.id);
        let players = await getMatchSides(game.id);
        let change = await updateRating(players.filter(p => p.side==0),players.filter(p=>p.side == 1), game.result, players.length/2 );
        console.log(change.map(p =>{return `<@${p.id}> ${p.elo} => ${p.newElo}`}).join('\n'));
    }
}

async function leaderboard(message,size,num = 10){
    let client = message.client;
    let eloname = sizeToEloName(size);
    let board = await selectQuery(`select dense_rank() over (order by ${eloname} desc) as rank, ${eloname} as elo, cast(id as text) as id from players where ${eloname} is not null limit ${num}`);
    let reply = '';
    for(e of board){
        reply += `${e.rank.toString().padStart(5)} | ${e.elo.toString().padEnd(9)}| ${(await client.fetchUser(e.id)).username}\n`;
    }
    message.channel.send(`\`\`\`Rank ${size}v${size}\n${reply}\`\`\``);
    
}

function sizeToEloName(size){
    return (size == 1)?`elo1v1`:(size==2)?`elo2v2`:`eloTeam`;
}

//promise wraps on database methods

/**
 * Promise wrap around database all() method.
 * returns list of result rows
 * @param {string} query SQL SELECT query
 * @returns Promise on result rows list
 * @throws error returned by base
 */
function selectQuery(query){
    let db = new sqlite3.Database('./data.db');
    try{
        return new Promise((resolve,reject) => {
            db.all(query,function(err,rows){
                if (err) reject(err);
                resolve(rows);
            })
        });
    } finally {
        db.close();
    }
}


/**
 * Promise wrap around database get() method.
 * returns first row of result
 * @param {string} query SQL SELECT query
 * @returns Promise on reulst row
 * @throws error returned by base
 */
function select1Query(query){
    let db = new sqlite3.Database('./data.db');
    try{
        return new Promise((resolve,reject) => {
            db.get(query,function(err,row){
                if (err) reject(err);
                resolve(row);
            })
        });
    } finally {
        db.close();
    }
}

/**
 * Promise wrap around database run() method.
 * for UPDATE INSERT and other commands that does not return rows
 * @param {string} query SQL query
 * @returns Promise on inserted row id 
 * @throws error returned by base
 */
function runQuery(query){
    let db = new sqlite3.Database('./data.db');
    try{
        return new Promise((resolve,reject) => {
        db.run(query,function(err){
            if (err) reject(err);
            resolve(this.lastID);
        })
    });
    } finally {
        db.close();
    }
    
}

module.exports.register = register;
module.exports.unregister = unregister;
module.exports.deleteMatch=deleteMatch;
module.exports.getMatchSides = getMatchSides;
module.exports.commit = commit;
module.exports.canPlay = canPlay;
module.exports.regMatch = regMatch;
module.exports.getPlayerCurrentMatch = getPlayerCurrentMatch;
module.exports.getStats = getStats;
module.exports.recalcRating = recalcRating;
module.exports.leaderboard = leaderboard;

