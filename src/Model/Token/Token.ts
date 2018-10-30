const jwt = require('jsonwebtoken')
const config = require('config')
const crypto = require('crypto')
const algorithm = 'aes-256-ctr';
const passwordForBody = config.token.passwordForBody
const secret = config.token.secret
const jwtMaxAge = config.token.maxAge
const issuer = config.token.issuer

// C=create, R=read, U=update, D=delete
enum action {
    None=null,
    
}

//an enum
interface Role {
    name: string,
    roles: string[]
}
export class Roles {
    static Admin:Role = {name: 'admin', roles: []}
}

export type Data = {
    permission: string,
    role: Role
}
export class TokenError {
    static None = null
    static EXPIRED = { status: 401, message: 'Token is expired' }

}

export class Token {
    data: Data // encrypted (type Data)
    expired: number
}

export class TokenUtil {
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
    static isValid(token:string): boolean|TokenError{
        TokenUtil.verify(token)
                 .then(decoded => {
                     if(decoded.expired > new Date().getTime()/1000){
                        return TokenError.EXPIRED
                     }
                     if(decoded.data.permission !== ){
                         return 
                     }
                 })
        return true
    }
}

export default Token


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
   

