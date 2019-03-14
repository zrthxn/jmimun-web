const database = require('./Database').database;
const crypto = require('crypto');
const ServerConfig = require('../config.json');

exports.validateCSRFTokens = (key, token) => {
    return new Promise((resolve,reject)=>{
        database.ref('csrf-tokens/' + key)
            .once('value')
            .then((csrfToken)=>{
                if (csrfToken.val().token === token) {
                    if( (new Date()).getTime()-csrfToken.val().valTime < (20*60000) ) {
                        console.log('CSR Key Verified', key)
                        resolve(true)
                    } else {
                        database.ref('csrf-tokens/' + key).remove().then(()=>{
                            console.log('CSR Key Expired', key)
                            resolve(false)
                        })
                    }
                } else {
                    console.log('CSR Key Rejected', key)
                    reject('TOKEN_MISMATCH')
                }
            }).catch((err)=>{
                console.log('ERR_DB DatabaseError')
                reject('ERR_DB DatabaseError', err)
            })
    })
}

exports.generateCSRFTokens = () => {
    var key = generateTokenKey(12)
    var token = crypto.createHmac('sha256', ServerConfig.clientKey).update(key).digest('hex')
    return new Promise((resolve,reject)=>{
        database.ref('csrf-tokens/' + key).set({
            "token": token,
            "valTime": (new Date()).getTime()
        }).then(()=>{
            resolve({ key: key, token: token })
        }).catch((e)=>{
            console.log(e)
            reject(e)
        })
    })
}

exports.validateAPIKey = (apiKey, api, user) => {
    return new Promise((resolve,reject)=>{
        database.ref('api-keys/' + apiKey)
            .once('value')
            .then((api_key)=>{
                resolve(true)
                // if (api_key.val() === token) {
                //     console.log('CSR Key Verified', key)
                //     resolve(true)
                // } else {
                //     resolve(false)
                // }
            }).catch((err)=>{
                reject(err)
            })
    })
}

function generateTokenKey(len) {
    var k = ""
    for(let i=0;i<len;i++)
        k += Math.floor(Math.random()*16).toString('16');
    return k
}