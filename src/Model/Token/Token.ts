const jwt = require('jsonwebtoken')
const config = require('config')
import TokenUtil from './TokenUtil'
import {Role, Roles} from './Roles'

type Data = {
    permission: string,
    role: Role
}
class Token {
    data: Data // encrypted (type Data)
    expired: number
}

export default Token
export {
    TokenUtil, Data, Token
}

