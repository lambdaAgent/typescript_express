import { IsEmail } from 'sequelize-typescript';
import * as Joi from 'joi';
import { Router, Request, Response } from 'express';
// import PersonDetail from '../model/Detail/Detail';
import Person from '../Model/Person/Person';
import HttpError from '../Error/HttpError'
import * as Password from '../utils/password'
import Token, { DataToken, TokenUtil } from '../Token/Token';
import {AuthCacheUtil, AuthToken} from '../Token/Auth/AuthCache'
import Roles, { Role } from '../Token/Roles';
import PathDetailUtil, { RouteDetail } from '../utils/PathDetail'
import PersonService from '../Service/PersonService'
import logger = require('../utils/logger');
import { authorizeUser, validateLoginBody, validateToken, matchRolesFromString } from './helperController/authorizeUser'
import RequestMapping from '../utils/RequestMapping/RequestMapping'

const router: Router = Router();

const RM = RequestMapping.of(router);

//'detail/{id}?searchBy=asdf&ascending=true'

const loginDTO = Joi.object().keys({
    username: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    isAdmin: Joi.boolean().required(),
}).unknown();

const schema = {
    data: Joi.any().required(),
    message: Joi.required()
}

const PersonCriteria:Joi.ObjectSchema = Joi.object().keys({
    ascending: Joi.bool().required(),
    searchBy: Joi.string().required()
})


RM.post('/asdf/:id/:username')
  .PathVariable("id", Joi.string().required())
  .PathVariable("username", Joi.string().required())
  .RequestParam("ascending", Joi.boolean().required())
  .RequestParam("searchBy", Joi.string().required())
  .RequestCriteria(PersonCriteria)
  .RequestBody({ valid: true, schema: loginDTO })
  .ResponseBody({ valid: true, 
    200: schema,
    400: {}
  })
  .Apply((validatorResult:any, req, res:any, next) => {
        const criteria = validatorResult.criteria;
        console.log("validatorResult", validatorResult)
        const responseDTO = {
            data: validatorResult,
            message: ''
        };    

      res.status(200).validJson(responseDTO)
  })




RM.post('/asdf/:id/:hello')
  .AuthorizeHeader({ validator: () => {return true}})
//   .PathVariable("id", {required: true, type: String })
//   .PathVariable("hello", {required: true, type: String})
//   .RequestParam("ascending", {required:true, type: Boolean })
//   .RequestParam("searchBy", {required:true, type: String})
//   .RequestBody({valid: true, schema: loginDTO })
  .ResponseBody({
    valid: true, 
    200: schema,
    400: {}
  })
  .Apply((validatorResult, req, res, next) => {
      console.log(validatorResult);
      //@ts-ignore
      validatorResult.worth = -1;
      const responseDTO = {
          data: validatorResult,
          message: ''
      };

      //@ts-ignore
      res.status(200).json(responseDTO)
  })

PathDetailUtil.registerRoute('/', 'get', Roles.ALL)
router.get('/', 
    (req: Request, res: Response) => {
        console.log(req)
        res.status(200).json('Hello, World!');
    });

PathDetailUtil.registerRoute('/detail', 'post', Roles.User)
router.post('/detail/{as}', validateToken, authorizeUser('/detail'), 
    (req: Request, res: Response, next) => {
        //get email from token??
        const token:string = (req as any).dataToken
        let requester: DataToken|null;
        TokenUtil.verify(token)
            .then((decoded) => {
                requester = decoded.data
                Person.findOne({where: {email:decoded.data.ownerEmail}})
            })
            //@ts-ignore
            .then((user:Person|null)=> {
                if(!user) return res.status(404).json({message: 'User not found'})
                if(requester!.role === Roles.Admin) {
                    // if admin just return the way it is
                    return res.status(200).json({})
                } else {
                    // if not admin, need to filter the user
                }
            })
            .catch(err => HttpError.handleDatabaseError(err, req, res, next))
    })

PathDetailUtil.registerRoute('/login', 'post', Roles.ALL)
router.post('/login', validateLoginBody, 
    (req:Request, res: Response, next) => {
        const {email, password} = req.body
        console.log(req.headers)
        Person.findOne({where: {email}})
        .then(person => {
            if(!person) return res.status(404).json({message: 'This email is not registered'})

            return new Promise((resolve, reject) => {
                const hashedPassword = person.dataValues.password!
                Password.verifyPassowrd(password, hashedPassword).then((isValidated):Response|void => {
                    if(!isValidated) return res.status(400).json({message: 'Wrong password'})
                    let role:Role|null=null;
                    try{ 
                        role = matchRolesFromString((person.dataValues as Person).role)
                    } catch(err){
                        return reject(err)
                    }
                    const payload:DataToken = {
                        role: role as Role,
                        ownerEmail: person.dataValues.email!,
                    }
                    TokenUtil.sign(payload).then(([signedToken, _]) => {
                        const tokenObj:TokenObject = {signedToken, payload, person_id: person.id as number} as TokenObject
                        resolve(tokenObj)
                    }).catch(next) 
                }).catch(next)
            })
        })
        .then((tokenObj) => setTokenToAuthCache(tokenObj as TokenObject, email))
        .then((signedToken: string) => res.status(200).json({token: signedToken}))
        .catch(next)
    })

PathDetailUtil.registerRoute('/register', 'post', Roles.ALL)
router.post('/register', validateLoginBody, authorizeUser('/register'), 
    (req:Request, res:Response, next) => {
        const {email, password} = req.body
        PersonService.IsEmailRegistered(email)
            .then((isRegister):Promise<undefined|string>=> {
                if(isRegister) {
                    res.status(400).json({message: 'User has already registered'})
                    return Promise.resolve(undefined)
                } else {
                    return PersonService.registerUser(email, password)                      
                }
            })
            .then((recentlyCreatedUserId:undefined|string):Promise<any>|void => {
                if(typeof recentlyCreatedUserId === 'undefined') return Promise.reject( new Error('recentlyCreatedUserId is null'))

                if(typeof recentlyCreatedUserId === 'string') {
                    const defaultRole = Roles.User
                    const payload:DataToken = {
                        role: defaultRole,
                        ownerEmail: email!,
                    }
                    const userId:number = Number(recentlyCreatedUserId)
                
                    if(isNaN(userId)) return Promise.reject( new Error('Failed to convert user Id to number'))
                
                    TokenUtil.sign(payload)
                    .then(([signedToken, _]) => {
                        const tokenObj:TokenObject = {signedToken, payload, person_id: userId} as TokenObject
                        return setTokenToAuthCache(tokenObj, email)
                    })
                    .then(signedToken => res.status(200).json({token: signedToken}))                    
                }
                else res.status(500).json({message: 'Failed to registered'})
            })
            .catch(next)
    })

export default router;

type TokenObject = {
    signedToken: string, 
    payload: DataToken, 
    person_id: number
}

function setTokenToAuthCache(tokenObj:TokenObject, email: string):Promise<string>{
    return new Promise((resolve) => {
        //set the token to AuthCache
        const signedToken:string = tokenObj.signedToken
        const payload:DataToken = tokenObj.payload
        const person_id: number = tokenObj.person_id
        const value = new AuthToken({data: payload, email, person_id })
        AuthCacheUtil.set(signedToken, value)
        resolve(signedToken)
    })
}

