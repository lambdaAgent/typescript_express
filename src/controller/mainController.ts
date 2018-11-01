import { Router, Request, Response } from 'express';
// import PersonDetail from '../model/Detail/Detail';
import Person from '../Model/Person/Person';
import HttpError from '../Error/HttpError/HttpError'
import * as Password from '../utils/password'
import Token, { DataToken, TokenUtil } from '../Token/Token';
import {AuthCacheUtil, AuthToken} from '../Token/Auth/AuthCache'
import Roles from '../Token/Roles';
import PathDetailUtil, { RouteDetail } from '../utils/PathDetail'
import PersonService from '../Service/PersonService'
import logger = require('../utils/logger');
import { log } from 'util';

const router: Router = Router();

PathDetailUtil.registerRoute('/', 'get', Roles.ALL)
router.get('/', (_: Request, res: Response) => {
    res.status(200).json('Hello, World!');
});

PathDetailUtil.registerRoute('/detail', 'post', Roles.User)
router.post('/detail', validateToken, authorizeUser('/detail'), (req: Request, res: Response, next) => {
    const detail = req.body
    const person = new Person(detail)
    person.save({validate: true})
          .then(_ => res.status(200).json({message: 'success'}))
          .catch(err => HttpError.handleDatabaseError(err, req, res, next))
});

PathDetailUtil.registerRoute('/login', 'post', Roles.ALL)
router.post('/login', validateLoginBody, (req:Request, res: Response, next) => {
    const {email, password} = req.body
    Person.findOne({where: {email}})
      .then(person => {
        if(!person) return res.status(404).json({message: 'This email is not registered'})

        return new Promise((resolve) => {
            const hashedPassword = person.dataValues.password!
            Password.verifyPassowrd(password, hashedPassword).then((isValidated) => {
                if(!isValidated) return res.status(400).json({message: 'Wrong password'})
                const payload:DataToken = {
                    role: Roles.User,
                    issuerEmail: person.dataValues.email!,
                }
                return TokenUtil.sign(payload).then(([signedToken, _]) => {
                    resolve({signedToken, payload})
                    return res.status(200).json({token: signedToken})
                }).catch(next)
            }).catch(next)
        })
      })
      .then((tokenObj:any) => {
            //set the token to AuthCache
            const signedToken:string = tokenObj.signedToken
            const payload:DataToken = tokenObj.payload
            const value = new AuthToken({data: payload, email})
            AuthCacheUtil.set(signedToken, value)
      })
      .catch(next)
})

PathDetailUtil.registerRoute('/register', 'post', Roles.ALL)
router.post('/register', validateLoginBody, (req:Request, res:Response, next) => {
    const {email, password} = req.body
    console.log(password, typeof password)
    PersonService.IsEmailRegistered(email)
        .then((isRegister):Promise<undefined|boolean>=> {
            logger.info('ISREGISTERED', isRegister)
            if(isRegister) {
                 res.status(400).json({message: 'User has already registered'})
                 return Promise.resolve(undefined)
            } else {
                return PersonService.registerUser(email, password)                      
            }
        })
        .then(resultOfRegistering => {
            if(typeof resultOfRegistering === 'undefined') return
            logger.info('RESULT OF REGISTERING', resultOfRegistering)
            if(resultOfRegistering) res.status(200).json({message: 'User successfully registered'})
            else res.status(500).json({message: 'Failed to registered'})
        })
        .catch(next)
})

export default router;


// HELPER
const error400 = (res,message) => res.status(400).json({message})
const errorContentType = (res) => res.status(400).json({message: 'wrong content type'})

function validateLoginBody(req, res, next){
    const body = req.body;
    if(Object.keys(body).length === 0) return errorContentType(res)
    if(!("email" in body && "password" in body)) return error400(res, 'email or password is blank')
    if(!body.email && !body.password) return error400(res, 'email or password is blank')
    if(typeof body.email !== 'string') return error400(res, 'email or password must be a string')
    if(typeof body.password !== 'string') return error400(res, 'email or password must be a string')
    return next()
}


function validateToken(req, res, next) {
    //1. validate token not expired
    //2. token already in AuthCache
    const body = req.body
    if(Object.keys(body).length === 0) return errorContentType(res)
    if(!("token" in body) || !body.token ) return res.status(401).json({message:'Token is not valid'})
    const token = body.token
    const data = AuthCacheUtil.get(token) 
    if(data) {
        req.dataToken = data
        next()
    }
    else return res.status(401).json({message:'Token is not valid'})
}

function authorizeUser(path:string){
    console.log(path)
    return function(req:Request, res:Response, next){
        const method = req.method
        //@ts-ignore
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