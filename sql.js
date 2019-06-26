const sqlite3 = require('sqlite3').verbose();
const tables = require("./tables");
const mapsConst = tables.maps;
const divConst = [tables.allydivs, tables.axisdivs];


async function register(message){
    let user = message.author;
    try{
        await runQuery(`insert into players(id,elo1v1,elo2v2,eloTeam) values (${user.id},1500,1500,1500)`);
        message.channel.send(`<@${user.id}> добро пожаловать!`);
    } catch (err){
        if(err.message === "SQLITE_CONSTRAINT: UNIQUE constraint failed: players.id"){
            message.channel.send(`<@${user.id}> уже зарегистрирован!`);
        } else {
            message.channel.send(err.message);
        }
    }
} 

async function regMatch(size,sides,map,mapBans,alliesBans,axisBans){
    let matchId = await runQuery(`insert into matches(map,size) values (${map},${size})`);

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
    let match = await select1Query(`select size from matches where rowid = ${matchId}`);
    let eloname = (match.size == 1)?`elo1v1`:(match.size==2)?`elo2v2`:`eloTeam`;          
    let players = await selectQuery(`select cast(playerid as text) as id, side, division, ${eloname} as elo from sides join players on sides.playerid = players.id where matchid = ${matchId}`);
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
        throw `<@${user.id}> не зарегистрирован`;
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
    await runQuery(`update matches set result = ${result}, date = datetime('now') where rowid = ${matchid}`);
    await runQuery(`update players set currentmatch = null where currentmatch = ${matchid}`);
}

async function getStats(message,user){
    let main = await select1Query(`select * from players where id = ${user.id}`);
    let games = await selectQuery(`select * from sides join matches on matches.rowid = sides.matchid where sides.playerid = ${user.id}; `);
    let gamesCount = games.length;
    let gamesCount1v1 = games.filter(g=>g.size == 1).length;
    let gamesCount2v2 = games.filter(g=>g.size == 2).length;
    let gamesCountTeam = games.filter(g=>g.size > 2).length;
    let gamesWin1v1 = games.filter(g=> g.side == g.result && g.size == 1).length;
    let gamesWin2v2 = games.filter(g=> g.side == g.result && g.size == 2).length;
    let gamesWinTeam = games.filter(g=> g.side == g.result && g.size > 2).length;
    message.reply(`
Всего игр: ${gamesCount}
Текущий матч: ${main.currentmatch==null?'нет':`%${main.currentmatch}`}
---1v1---
ELO: ${main.elo1v1}
Побед: ${gamesWin1v1}
Поражений: ${gamesCount1v1-gamesWin1v1}
%: ${(gamesWin1v1/gamesCount1v1)*100}%
---2v2---
ELO: ${main.elo2v2}
Побед: ${gamesWin2v2}
Поражений: ${gamesCount2v2-gamesWin2v2}
%: ${(gamesWin2v2/gamesCount2v2)*100}%
---Коммандные---
ELO: ${main.eloTeam}
Побед: ${gamesWinTeam}
Поражений: ${gamesCountTeam-gamesWinTeam}
%: ${(gamesWinTeam/gamesCountTeam)*100}%
`)
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
    let games = await selectQuery(`select rowid as id, result from matches where result IS NOT NULL order by datetime(date)`);
    await runQuery(`update players set elo1v1 = 1500, elo2v2 = 1500, eloTeam = 1500`);
    

    for(game of games){
        console.log(game.id);
        let players = await getMatchSides(game.id);
        let change = await updateRating(players.filter(p => p.side==0),players.filter(p=>p.side == 1), game.result, players.length/2 );
        console.log(change.map(p =>{return `<@${p.id}> ${p.elo} => ${p.newElo}`}).join('\n'));
    }
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
module.exports.getMatchSides = getMatchSides;
module.exports.updateRating = updateRating;
module.exports.commit = commit;
module.exports.canPlay = canPlay;
module.exports.regMatch = regMatch;
module.exports.getPlayerCurrentMatch = getPlayerCurrentMatch;
module.exports.getStats = getStats;
module.exports.recalcRating = recalcRating;

