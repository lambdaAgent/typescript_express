import * as crypto from 'crypto'
import {DataToken, Token} from './Token'
import TokenError from '../Error/TokenError'
import * as jwt from 'jsonwebtoken'
import { Request } from 'express'
const config = require('config')

const algorithm = 'aes-256-ctr';
const passwordForBody = config.token.passwordForBody
const secret = config.token.secret
const jwtMaxAge = config.token.maxAge
// const issuer = config.token.issuer

export function sign(data:DataToken):Promise<[string, Token]>{
    return new Promise((resolve, reject) => {
        const _data = encrypt(JSON.stringify(data), passwordForBody)
        const unsignedToken = JSON.stringify(new Token(_data, jwtMaxAge))
        jwt.sign(unsignedToken, secret, (err, signedtoken) => {
            if(err) {
                err.time = new Date().getTime()
                return reject(err)
            }
            resolve([signedtoken, JSON.parse(unsignedToken)])
        })
    })
}
export function verify(token:string): Promise<Token>{
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, function(err, decoded) {
            if(err) return reject(err)
            const data = decrypt(decoded.data, passwordForBody)
            decoded.data = JSON.parse(data)
            return resolve(decoded)
        });
    })
}
export function validate(req:Request): Promise<TokenError|boolean>{
    return new Promise((resolve, reject) => {
        if(!req.headers.authorization || typeof req.headers.authorization === 'object') {
            return resolve(TokenError.TOKEN_INVALID)
        }
        const token:string = req.headers.authorization as string
        verify(token)
            .then(decoded => {
                if(decoded.expiredIn > new Date().getTime()/1000){
                return resolve(TokenError.EXPIRED)
                }
            })
            .catch(reject)
    })
}
export function authenticate(req:Request):Promise<TokenError|boolean>{
    return new Promise((resolve, reject) => {
        if(!req.headers.authorization || typeof req.headers.authorization === 'object') {
            return resolve(TokenError.TOKEN_INVALID)
        }
        const token:string = req.headers.authorization as string
        verify(token)
            .then(decoded => {
                if(decoded.expiredIn > new Date().getTime()/1000){
                return resolve(TokenError.EXPIRED)
                }
            })
            .catch(reject)
    })
}


// do not use a global iv for production, 
// generate a new one for each encryption

export function encrypt(text:string, password:string): string{
    var cipher = crypto.createCipher(algorithm,password)
    var crypted = cipher.update(text,'utf8','hex')
    crypted += cipher.final('hex');
    return crypted;
}

export function decrypt(text:string, password:string): string{
    var decipher = crypto.createDecipher(algorithm,password)
    var dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
    return dec;
}
   

