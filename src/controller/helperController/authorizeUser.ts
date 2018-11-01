import { Request, Response } from 'express'
import { AuthToken, AuthCacheUtil } from '../../Token/Auth/AuthCache'
import Token, { DataToken, TokenUtil } from '../../Token/Token';
import { RouteDetail, PathDetailUtil } from '../../utils/PathDetail'
import { error400, errorContentType } from './errorController'
import Roles, { Role } from '../../Token/Roles';

export default authorizeUser
export function authorizeUser(path:string){
    return function(req:any|Request, res:Response, next){
        const method = req.method
        const authToken:AuthToken = AuthCacheUtil.get(req.dataToken) as AuthToken
        const routeDetail: RouteDetail = PathDetailUtil.getRouteDetail(path)
        const userPermissions:string[] = (authToken.data as DataToken).role.permissions
        const pagePermissions:string[] = routeDetail.methodPermissions
                                    .filter(methodPermission => methodPermission.method === method)[0]
                                    .permissions
        for(let i=0; i<userPermissions.length;i++){
            const userPermission = userPermissions[i]
            if(pagePermissions.indexOf(userPermission) >= 0){
                next()
                break;
            }
        }

        // not allow
        return res.status(403).json({message: 'User is not allowed to access the page'})
    }
}


export function validateLoginBody(req, res, next){
    const body = req.body;
    if(Object.keys(body).length === 0) return errorContentType(res)
    if(!("email" in body && "password" in body)) return error400(res, 'email or password is blank')
    if(!body.email && !body.password) return error400(res, 'email or password is blank')
    if(typeof body.email !== 'string') return error400(res, 'email or password must be a string')
    if(typeof body.password !== 'string') return error400(res, 'email or password must be a string')
    return next()
}




export function validateToken(req, res, next) {
    //1. validate token not expired
    //2. token already in AuthCache
    const body = req.body
    if(Object.keys(body).length === 0) return errorContentType(res)
    if(!("token" in body) || !body.token ) return res.status(401).json({message:'Token is not valid'})
    const token = body.token
    const data:AuthToken|boolean = AuthCacheUtil.get(token)
    if(data) {
        req.dataToken = data
        next()
    }
    else return res.status(401).json({message:'Token is not valid'})
}

export function matchRolesFromString(rolename:string): Role|null{
    let matchedRole:Role|null = null
    Object.keys(Roles).forEach((key:string) => {
        if( (Roles[key] as Role).name === rolename){
            matchedRole = Roles[key]
        }
    })[0];
    
    return matchedRole
}