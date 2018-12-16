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

export default router;
