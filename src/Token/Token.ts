import * as TokenUtil from './TokenUtil'
import {Role} from './Roles'

type DataToken = {
    role: Role,
    ownerEmail: string,
}
class Token {
    constructor(data, expiredIn){
        this.data = data
        this.expiredIn = new Date().getTime() + expiredIn
    }
    data: DataToken // encrypted (type Data)
    expiredIn: number
}

export default Token
export {
    TokenUtil, DataToken, Token
}

