import { DataToken } from "../Token";

export class AuthToken {
    constructor(objArgs){
        Object.keys(objArgs).forEach(key => {
            this[key] = objArgs[key]
        })
    }
    person_id: number
    email:string
    expires:number
    data?: string|DataToken
    token?: string
}

export class AuthCacheUtil {
    static AuthCache = {}
    static get(token:string):boolean|AuthToken {
        // This action will remove the token if expired
        if(!this.AuthCache.hasOwnProperty(token)) return false
        const expires:number = this.AuthCache[token].expires
        const isExpired:boolean = expires >= new Date().getTime()
        if(isExpired) {
            delete this.AuthCache[token]
            return false
        }
        return this.AuthCache[token]
    }
    static set(token:string, value:AuthToken){
        this.AuthCache[token] = value
    }

    static renew(oldToken:string, newToken:string, value:AuthToken, renewTime:number){
        if(!this.AuthCache.hasOwnProperty(oldToken)) return false
        delete this.AuthCache[oldToken]

        value.expires = new Date().getTime() + renewTime
        this.set(newToken,value)
        return true
    }
    static clear(){
        this.AuthCache = {}
    }
}

export default AuthToken