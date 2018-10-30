import * as crypto from 'crypto'
import {Data, Token} from './Token'
import TokenError from '../../enum/Error/TokenError'
import config from 'config'
import jwt from 'jsonwebtoken'
import { Request, Response } from 'express';

const algorithm = 'aes-256-ctr';
const passwordForBody = config.token.passwordForBody
const secret = config.token.secret
const jwtMaxAge = config.token.maxAge
const issuer = config.token.issuer

export default class TokenUtil {
    static sign(data:Data):Promise<string>{
        return new Promise((resolve, reject) => {
            const payload = encrypt(JSON.stringify(data), passwordForBody)
            jwt.sign(payload, secret, {issuer, expiresIn: jwtMaxAge}, (err, token) => {
                if(err) return reject(err)
                resolve(token)               
            })
        })
    }
    static verify(token:string): Promise<Token>{
        return new Promise((resolve, reject) => {
            jwt.verify(token, secret, function(err, decoded) {
                if(err) return reject(err)
                const data = decrypt(decoded.data, passwordForBody)
                decoded.data = JSON.parse(data)
                return resolve(decoded)
            });
        })
    }
    static validate(req:Request, res:Response): boolean|TokenError{
        if(!req.headers.authorization) {
            return TokenError.TOKEN_INVALID
        }
        const token:string = req.headers.authorization!
        TokenUtil.verify(token)
                 .then(decoded => {
                     if(decoded.expired > new Date().getTime()/1000){
                        return TokenError.EXPIRED
                     }
                     
                 })
        return true
    }
    static authenticate(req:Request, res:Response):boolean|TokenError{
        if(!req.headers.authorization) {
            return TokenError.TOKEN_INVALID
        }
        return true
    }
}


  // do not use a global iv for production, 
  // generate a new one for each encryption

  function encrypt(text:string, password:string): string{
    var cipher = crypto.createCipher(algorithm,password)
    var crypted = cipher.update(text,'utf8','hex')
    crypted += cipher.final('hex');
    return crypted;
  }
   
  function decrypt(text:string, password:string): string{
    var decipher = crypto.createDecipher(algorithm,password)
    var dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
    return dec;
  }
   

