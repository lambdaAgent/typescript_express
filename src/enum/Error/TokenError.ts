
export default class TokenError {
    static None = null
    static EXPIRED = { status: 401, message: 'Token is expired' }
    static UNAUTHORIZED = { status: 403, message: 'You are not allowed to access this page'}
    static TOKEN_INVALID = { status: 401, message: 'Token is invalid'}
}
