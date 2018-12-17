import { RequestParam } from './../helper/Swagger/Swagger';
import * as SwaggerInterface from 'swagger-schema-official';
import { RequestValidator } from './RequestMapping';
import { Router, NextFunction, Request, Response } from "express";
import constructObjectFromRefUrl from '../helper/constructObjectFromRefUrl';
import StripUnknown from '../helper/StripUnknown'
import Swagger, {PathDetail, PathParam, convertJoiParamToSwagger } from '../helper/Swagger/Swagger'
import createDocumentation, { SprinkleDocDescription } from '../helper/createDocumentation'
import * as Joi from 'joi'
import logger = require('../logger');

export default class RequestMapping {
    static of(app:Router, basepath:string): RequestMap {
        if(basepath[0] !== '/') throw new Error ('basepath must start with "/"');
        if(basepath === '/') basepath = '';
        return new RequestMap(app, basepath);
    }
}

class RequestMap {
    private _route:Router;
    private _basepath:string;
    private _swagger:Swagger;
    constructor(route:Router, basepath:string){ 
        this._route = route;
        this._basepath= basepath;
        this._swagger = new Swagger();
        this._swagger.basePath=basepath;
        this._swagger.swagger = "2.0";
        this._swagger.host = "http://localhost:8000";
        this._swagger.schemes = ["https", "http"];
    }
    get(pathname:string):RequestValidator{
        return new RequestValidatorImpl(this._route,this._swagger, 'get', this._basepath, pathname);
    }
    post(pathname:string):RequestValidator{
        return new RequestValidatorImpl(this._route,this._swagger, 'post', this._basepath, pathname);
    }
    put(pathname:string):RequestValidator{
        return new RequestValidatorImpl(this._route,this._swagger, 'put', this._basepath, pathname);
    }
    delete(pathname:string):RequestValidator{
        return new RequestValidatorImpl(this._route, this._swagger,'delete', this._basepath, pathname);
    }
}

declare class RequestBodyOption{
    valid:boolean;
    schema:Joi.ObjectSchema;
    '@sprinkle'?:SprinkleDocDescription;
}
declare class AuthorizeOption{
    type?: string;
    validator: (token:string)=>boolean;
    responseMessage?: string;
    responseStatus?: string|number;
    '@sprinkle'?:SprinkleDocDescription;
}
declare class ExecutionResult {
    errorMessages:Array<String>; 
    isValid:boolean;
    result:{}
}

export interface RequestValidator{
    RequestBody(option?:RequestBodyOption):RequestValidator;
    AuthorizeHeader(option: AuthorizeOption):RequestValidator;
    RequestCriteria(schema:Joi.ObjectSchema): RequestValidator;
    Apply(callback:(RESULT:Object, req:Request, res:Response, next:NextFunction)=>void):RequestValidator;
    Swagger():Swagger;
    RequestParam(queryvar:string, joiValidation: Joi.Schema):RequestValidator;
    PathVariable(pathvar:string, joiValidation:Joi.Schema):RequestValidator ;
    ResponseBody(obj):RequestValidator;
}

export class RequestValidatorImpl implements RequestValidator{
    constructor(_route:Router, swagger:Swagger, _HttpMethod:string, basepath:string, pathname:string){
        this._route = _route;
        this._HttpMethod = _HttpMethod;
        this._HttpPathName = pathname;
        this._basepath = basepath;
        this._swagger = swagger;
        this._pathDetail = new PathDetail();
    }

    _pathDetail: PathDetail;
    _basepath:string;
    _swagger: Swagger;
    _route:Router;
    _HttpMethod:string;
    _HttpPathName:string;
    _authorizeOption:AuthorizeOption;
    //@ts-ignore
    _pathVariables:Object = {};
    //@ts-ignore
    _requestParams:Object = {};
    _requestBody?: {
        schema: Joi.ObjectSchema, // ConstraintObject
    };
    _requestCriteria?: {
        schema: Joi.ObjectSchema, // ConstraintObject
    }
    _responseBody?:any = {}; // {valid:boolean, 200: schemaObject}
    _prefixError = () => `Error on ${this._HttpMethod.toUpperCase()}, ${this._HttpPathName}. Reason: `;
    _executeAuthorize(req):boolean{
        if(!this._authorizeOption) return true
        let {validator, type} = this._authorizeOption;
            type = type ? type.trim() : 'Basic'
        const authorizeToken = req.headers.authorization;
        if(!authorizeToken) return false;
        const tokenType = type[0].toUpperCase() + type.slice(1) + ' ';
        
        if(!authorizeToken.startsWith(tokenType)) return false;
        
        return validator(authorizeToken.split(tokenType)[1]);
    }
    _executeRequestParam(req:Request):ExecutionResult {
        let errorMessages: string[] = [];
        let result: Object = {};
        const queryString:string = req.url.split('?')[1];
        let objToValidate = {}
        if(Object.keys(this._requestParams).length <= 0) return {errorMessages, isValid: true, result};
        if(!queryString)  return {errorMessages: ['No Query String'], isValid:false, result} 
        let schema:Joi.Schema = Joi.object().keys(this._requestParams as Joi.SchemaMap).unknown();

        queryString.split('&').forEach(keyValue => {
            const [key, value] = keyValue.split('=');
            objToValidate[key] = value;
        });
       
        const objError = Joi.validate(objToValidate, schema, {abortEarly: false});
        if(!objError.error){
            return {errorMessages, isValid: true,
                result: objToValidate
            }
        }
        
        errorMessages = objError.error.details.map(err => {
            const message = err.message.split(" ").slice(1).join(" ");
            const path = err.path;
            return path + " " + message;
        })
        return { errorMessages, isValid: false, result }
    }
    _executePathVariable(req:Request):ExecutionResult{
        let errorMessages: string[] = [];
        let result: Object = {};
        if(Object.keys(this._pathVariables).length <= 0) return {errorMessages, isValid: true, result};

        let objToValidate = {}
        const path = req.url.split('/').slice(1);
        const objMap = constructObjectFromRefUrl(this._HttpPathName);
        const isQueryStringValidating = Object.keys(objMap).length > 0;
        if(!isQueryStringValidating){
            return {isValid:true, errorMessages:[], result:{}}
        }
        Object.keys(this._pathVariables).forEach(pathname => {
            const position = objMap[pathname];
            let value = path[position];
                value = value.indexOf('?') ? value.split('?')[0] : value;
            objToValidate[pathname] = value;
        })

        let schema:Joi.Schema = Joi.object().keys(this._pathVariables as Joi.SchemaMap).unknown();

        const objError = Joi.validate(objToValidate, schema, {abortEarly: false});
        if(!objError.error){
            return {errorMessages, isValid: true,
                result: objToValidate
            }
        }
        
        errorMessages = objError.error.details.map(err => {
            const message = err.message.split(" ").slice(1).join(" ");
            const path = err.path;
            return path + " " + message;
        })
        return { errorMessages, isValid: false, result }
    }
    _executeRequestBody(req:Request):ExecutionResult{
        if(!this._requestBody) return {errorMessages: [], isValid: true, result:{}};
        let result;
        const objToValidate = req.body;
        const schema = this._requestBody.schema;
        if(schema) result = Joi.validate(objToValidate, schema, { abortEarly: false });

        let errorMessages:string[] = [];
        (result.error) && result.error.details.forEach((err:any) => {
            const message = err.message.split(" ").slice(1).join(" ");
            const pathname = err.path[0];
            errorMessages.push(pathname+ " " + message)
        });
        let stripUnknownKeys = StripUnknown.target(schema).value(result.value)
        const isValid = errorMessages.length === 0;
        return { errorMessages, isValid, result : stripUnknownKeys}
    }
    _executeResponseBody(obj:any, statusCode:string|number){
        const schema = this._responseBody[statusCode]
        if(!schema) return { isValid: false, objError: {SchemaNotFound: 'No Schema provided for response status ' + statusCode }}
        const objError = Joi.validate(obj, schema, {abortEarly: false, stripUnknown: true });
        const isValid = objError.error ? false : true;

        return { isValid, objError };
    }
    _returnResponse(res, status, message){
        return res.status(status).json({message})
    }

    _executeRequestCriteria(req:Request){
        let errorMessages: string[] = [];
        let queryString:string = req.url.split('?')[1];
        let objToValidate = {}
        if(!this._requestCriteria) return { errorMessages, isValid:true, result:{} }
        if(!queryString)  return {errorMessages: ['No Query String'], isValid:false, result:{}} 
        let schema:Joi.ObjectSchema = this._requestCriteria.schema;

        queryString.split('&').forEach(keyValue => {
            const [key, value] = keyValue.split('=');
            objToValidate[key] = value;
        });
       
        let result = Joi.validate(objToValidate, schema, {abortEarly: false });
        (result.error) && result.error.details.forEach((err:any) => {
            const message = err.message.split(" ").slice(1).join(" ");
            const pathname = err.path[0];
            errorMessages.push(pathname+ " " + message)
        });
        let stripUnknownKeys = StripUnknown.target(schema).value(result.value)
        const isValid = errorMessages.length === 0;
        return { errorMessages, isValid, result : stripUnknownKeys}
    }

    RequestCriteria(schema:Joi.ObjectSchema): RequestValidator{
        const self = this;

        (function validateRequestBody(){
            if(!schema) throw new Error(self._prefixError() + 'No schema is provided.')
        })()
        schema.unknown();
        
        this._requestCriteria = {
            schema
        };
        return this;
    }

    AuthorizeHeader(option: AuthorizeOption):RequestValidator{        
        const self = this;
        (function validateAuthorize(){
            if(!option) throw new Error(self._prefixError() + ` No validator to authorize the token`);
        })()
       
        const responseMessage = option.responseMessage ? option.responseMessage : 'Not Authorized';
        const responseStatus = option.responseStatus ? option.responseMessage : 401;
        const type = option.type ? option.type : 'jwt';
        const validator = option.validator;
        //token can be accessed in .APPLY
        this._authorizeOption = { type, responseMessage, responseStatus, validator };
        return this;
    }

    RequestBody(option?:RequestBodyOption):RequestValidator{
        const self = this;
        
        (function validateRequestBody(){
            if(!option) throw new Error(self._prefixError() + 'No arguments is provided.')
            if(option.valid && !option.schema) throw new Error(self._prefixError() + 'No schema to Validate request body');
        })()
        this._requestBody = {
            schema: option.schema
        };
        return this;
    }
    RequestHeader(){
        return;
    }
    RequestParam(queryvar:string, joiValidation: Joi.ObjectSchema):RequestValidator{
        this._requestParams[queryvar] = joiValidation;
        let param = new PathParam(queryvar);
        param = convertJoiParamToSwagger(joiValidation, param)
        this._pathDetail.parameters.push(param)
        return this;
    }
    PathVariable(pathvar:string, joiValidation:Joi.ObjectSchema):RequestValidator {
        this._pathVariables[pathvar] = joiValidation;
        let param = new RequestParam(pathvar);
        param = convertJoiParamToSwagger(joiValidation, param)
        this._pathDetail.parameters.push(param)
        return this;
    }
    ResponseBody(obj):RequestValidator{
        if("valid" in obj && obj.valid && !obj[200]) throw new Error(this._prefixError() + 'Response need to be validated but no schema')
        if(obj) this._responseBody = obj;
        return this;
    }
    Swagger(){
        const path = '/'+this._HttpPathName.split('/')[1];
        this._swagger.paths[path]= {
            [this._HttpMethod]: this._pathDetail
        };
        console.log(JSON.stringify(this._swagger.paths));
        return this._swagger;
    }
    
    Apply(callback:(RESULT:Object, req:Request, res:Response, next:NextFunction)=>void):RequestValidator{
        const self = this;
        const {_route, _HttpMethod, _HttpPathName } = this;

        _route[_HttpMethod](this._basepath+_HttpPathName, (req:Request, res:Response, next:NextFunction) => {
            let RESULT = {};
            let errorMessages:Array<String> = [];
            const BAD_PATH_VARIABLE_STATUS = 400;

            if(!this._executeAuthorize(req)){
                // if not authorized return 401
                return this._returnResponse(res, this._authorizeOption.responseStatus, this._authorizeOption.responseMessage);
            } 

            const pathVariableResult = this._executePathVariable(req);
            if(!pathVariableResult.isValid) errorMessages = errorMessages.concat(pathVariableResult.errorMessages);

            const requestParamResult = this._executeRequestParam(req);
            if(!requestParamResult.isValid) errorMessages = errorMessages.concat(requestParamResult.errorMessages); 

            const requestBodyResult = this._executeRequestBody(req);
            if(!requestBodyResult.isValid) errorMessages = errorMessages.concat(requestBodyResult.errorMessages);

            const requestCriteriaResult = this._executeRequestCriteria(req);
            if(!requestCriteriaResult.isValid) errorMessages = errorMessages.concat(requestBodyResult.errorMessages);

            if(errorMessages.length > 0 ){
                return this._returnResponse(res, BAD_PATH_VARIABLE_STATUS, errorMessages);
            }
            
            RESULT = {  ...RESULT, 
                        pathVariables: pathVariableResult.result, 
                        requestParams: requestParamResult.result, 
                        requestBody: requestBodyResult.result, 
                        criteria: requestCriteriaResult.result
                     };  
            //@ts-ignore          
            res.validJson = function (obj) {
                //@ts-ignore
                if(self._responseBody.valid){
                    const statusCode = res.statusCode;
                    const { isValid, objError } = self._executeResponseBody(obj, statusCode);
                    if(isValid) {
                        return res.json(obj);
                    }

                    return res.status(500).json({data: objError, 
                        message: 'Failed Validation of Response DTO'
                    });
                   
                }
                //no need to validate
                return res.json(obj)
            };
            
            callback(RESULT, req, res, next);
        });
        return this;
    }
}

