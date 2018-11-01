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
import { authorizeUser, validateLoginBody, validateToken } from './helperController/authorizeUser'

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
