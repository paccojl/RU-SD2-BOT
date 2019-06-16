const sqlite3 = require('sqlite3').verbose();

async function register(message){
    let user = message.author;
    try{
        await runQuery(`insert into players(id) values (${user.id})`);
    } catch (err){
        if(err){ 
            if(err.message === "SQLITE_CONSTRAINT: UNIQUE constraint failed: players.id"){
                message.channel.send(`<@${user.id}> уже зарегистрирован!`);
            } else {
                message.channel.send(err.message);
            }
        } else{
            message.channel.send(`<@${user.id}> добро пожаловать!`);
        }
    }
} 

async function regMatch(players,map){
    let matchId = await runQuery(`insert into matches(map) values (${map})`);

    let sidesvalues = players.map((p)=>{return `(${match.id},${p.id},${p.side},${p.division})`}).join(',');

    runQuery(`insert into sides(matchid,playerid,side,division) values ${sidesvalues}`);

    return matchId;
}

async function getMatch(matchId){
    match = select1Query(`select * from matches where id = ${matchId}`);
    players = selectQuery(`select * from sides where matchid = ${matchId}`);
    return [await match,await players];

}


async function getPlayerCurrentMatch(user){
    let matchId = (await select1Query(`select currentmatch from players where id = ${user.id}`)).currentmatch;
    return matchId;
}

function setPlayerCurrentMatch(user,matchid){
    runQuery(`update players set currentmatch = ${matchid} where id = ${user.id}`);
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
//module.exports.unreg = unreg;
module.exports.regMatch = regMatch;
module.exports.getPlayerCurrentMatch = getPlayerCurrentMatch;

