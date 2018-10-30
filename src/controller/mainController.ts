import { Router, Request, Response } from 'express';
// import PersonDetail from '../model/Detail/Detail';
import Person from '../model/Person/Person';
import HttpError from '../Error/HttpError/HttpError'
import * as Password from '../utils/password'
import Token, { DataToken, TokenUtil } from '../Token/Token';
import {AuthCacheUtil, AuthToken} from '../Token/Auth/AuthCache'
import Roles from '../Token/Roles';
import PathDetailUtil from '../utils/PathDetail'

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

export default router;


// HELPER
const error400 = (res,message) => res.status(400).json({message})
const errorContentType = (res) => res.status(400).json({message: 'wrong content type'})

function validateLoginBody(req, res, next){
    const body = req.body;
    
    if(Object.keys(body).length === 0) return errorContentType(res)
    if(!("email" in body && "password" in body)) return error400(res, 'username or password is blank')
    if(!body.email && !body.password) return error400(res, 'username or password is blank')

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
    return function(req:Request, _:Response, next){
        //@ts-ignore
        console.log(req.dataToken)
        next
    }
}