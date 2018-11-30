import { Router, NextFunction, Request, Response } from "express";
import * as validate from "validate.js"
import constructObjectFromRefUrl from './constructObjectFromRefUrl';
import createDocumentation, { SprinkleDocDescription } from './createDocumentation'
import { error } from "util";

class ValidatorOption {
    '@sprinkle'?:SprinkleDocDescription;
    required: boolean;
    type: Function;
    as?: string
}


export default class RequestMapping {
    static of(app:Router): RequestMap{
        return new RequestMap(app)
    }
}


class RequestMap {
    _route:Router;
    _routeDocs:any[] = [];
    constructor(route:Router){ 
        this._route = route;
        this._routeDocs = [];
    }
    get(pathname:string):RequestValidator{
        const req = new RequestValidator(this._route, 'get', pathname);
        return req
    }
    post(pathname:string):RequestValidator{
        return new RequestValidator(this._route, 'post', pathname);
    }
    put(pathname:string):RequestValidator{
        return new RequestValidator(this._route, 'put', pathname);
    }
    delete(pathname:string):RequestValidator{
        return new RequestValidator(this._route, 'delete', pathname);
    }
}

declare class RequestBodyOption{
    valid:boolean;
    schema:Object;
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

export class RequestValidator {
    constructor(_route:Router, _HttpMethod:string, pathname:string){
        this._route = _route;
        this._HttpMethod = _HttpMethod;
        this._HttpPathName = pathname;
    }
    _route:Router;
    _HttpMethod:string;
    _HttpPathName:string;
    _authorizeOption:AuthorizeOption;
    //@ts-ignore
    _pathVariables:[[string, ValidatorOption]] = [];
    //@ts-ignore
    _requestParams:[[string, ValidatorOption]] = [];
    _requestBody: {
        valid: boolean,
        schema: object, // ConstraintObject
    }
    _responseBody:any = {}; // {valid:boolean, 200: schemaObject}
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
        const _result = {};
        let queryString:string = req.url.split('?')[1];
        if(!queryString)  return {errorMessages: ['No Query String'], isValid:false, result:_result} 
        const queryStringArr = queryString.split('&');
        //@ts-ignore
        let errorMessages = this._requestParams.map(o => {
             //either return one or undefined
             let errorMessage = ''
             let isFound = false;
             queryStringArr.forEach((query:string) => {
                 if(isFound) return;

                const [requestParam, option] = o;
                const { required, type, as} = option;    
                const [key, value] = query.split('=');
                if(requestParam === key){
                    isFound = true;
                    if(required && !value) errorMessage = `RequestParam ${requestParam} cannot be null`
                    if(type && (type.name === 'Boolean') && (value !== 'true' && value !== 'false')){
                        errorMessage = `RequestParam ${requestParam} must be Boolean`
                    } else if(!validate[`is${type.name}`](type(value))) {
                        errorMessage = `RequestParam ${requestParam} must be ${type.name}`
                    }
    
                    let typeCastValue;
                    if(type.name === 'Boolean') {
                       typeCastValue = (value === 'false') ? false : true;
                    } else {
                        typeCastValue = type(value);
                    }
                    if(as) { _result[as] = typeCastValue }
                    else {_result[key] = typeCastValue } 
                } 
            })
            return errorMessage;
        }).filter(isValid => !!isValid);

        const isValid = errorMessages.length === 0;
        return {errorMessages, isValid, result:_result}
    }
    _executePathVariable(req:Request):ExecutionResult{
        let _result = {};
        const objMap = constructObjectFromRefUrl(this._HttpPathName);
        const isQueryStringValidating = Object.keys(objMap).length > 0;
        if(!isQueryStringValidating){
            return {isValid:true, errorMessages:[], result:{}}
        }
        const path = req.url.split('/').slice(1);
        //@ts-ignore
        const errorMessages = this._pathVariables.map((o) => {
             //either return one or undefined
                let [pathname, { required, type, as}] = o;
                const position = objMap[pathname];
                let value = path[position]; 
                    value = value.indexOf('?') ? value.split('?')[0] : value;
                const obj = {[pathname]: value};

                if(required && !value) return `PathVariable ${pathname} cannot be null`
                if(type && (type.name === 'Boolean') && (value !== 'true' && value !== 'false')){
                    return `PathVariable ${pathname} must be Boolean`
                } else if(!validate[`is${type.name}`](type(value))) {
                    return `PathVariable ${pathname} must be ${type.name}`
                }

                let typeCastValue;
                if(type.name === 'Boolean') {
                   typeCastValue = (value === 'false') ? false : true;
                } else {
                    typeCastValue = type(value);
                }

                if(as) { _result[as] = typeCastValue }
                else {_result[pathname] = typeCastValue } 
                return undefined

        }).filter(isValid => !!isValid)
    
        const isValid = errorMessages.length === 0;
        //@ts-ignore
        return {errorMessages, isValid, result:_result}
    }
    _executeRequestBody(req:Request):ExecutionResult{
        if(!this._requestBody) return {errorMessages: [], isValid: true, result:{}};

        const objToValidate = req.body;
        const schema = this._requestBody.schema;
        let objError:Object = {};
        if(schema) objError = validate(objToValidate, schema);
        if(!objToValidate) objError = {'error': 'No Request Body is found'}
        if(Object.keys(objToValidate).length === 0) objError = {'error': 'No Request Body is found'}

        let errorMessages:string[] = [];
        (objError) && Object.keys(objError).forEach(key => {
            objError[key].length > 0 && objError[key].forEach(err => {
                if(Array.isArray(err)) {
                    return err.forEach(e => errorMessages.push(e));
                } else {
                    return errorMessages.push(err);
                }
            })
        });
        const isValid = errorMessages.length === 0;
        // need to flatten the errorMessages
        return { errorMessages, isValid, result: isValid ? objToValidate : {} };
    }
    _executeResponseBody(obj:any, statusCode:string|number){
        const schema = this._responseBody[statusCode]
        if(!schema) return { isValid: false, objError: {SchemaNotFound: 'No Schema provided for response status ' + statusCode }}
        const objError = validate(obj, schema);
        const isValid = objError ? Object.keys(objError).length < 0 : true;

        return { isValid, objError };
    }
    _returnResponse(res, status, message){
        return res.status(status).json({message})
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
            valid: option.valid ? option.valid : (option.schema ? true : false),
            schema: option.schema
        };
        return this;
    }
    RequestHeader(){
        return;
    }
    RequestParam(queryvar:string, validatorOptions:ValidatorOption):RequestValidator{
        //@ts-ignore
         this._requestParams.push([queryvar, validatorOptions]);
        return this;
    }
    PathVariable(pathvar:string, validatorOptions:ValidatorOption):RequestValidator {
        const { type } = validatorOptions;
        const self = this;        
        (function validatePathVariable(){
            if(!validate.isFunction(type)) throw new Error (self._prefixError() + 'Not a valid type.')
        }())
        //@ts-ignore
         this._pathVariables.push([pathvar, validatorOptions]);
        return this;
    }
    ResponseBody(obj){
        if("valid" in obj && obj.valid && !obj[200]) throw new Error(this._prefixError() + 'Response need to be validated but no schema')
        if(obj) this._responseBody = obj;
        return this;
    }
    
    Apply(callback:(RESULT:Object, req:Request, res:Response, next:NextFunction)=>void):RequestValidator{
        const self = this;
        const {_route, _HttpMethod, _HttpPathName } = this;
        _route[_HttpMethod](_HttpPathName, (req:Request, res:Response, next:NextFunction) => {
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

            if(errorMessages.length > 0 ){
                return this._returnResponse(res, BAD_PATH_VARIABLE_STATUS, errorMessages);
            }
            
            RESULT = {...RESULT, ...pathVariableResult.result, ...requestParamResult.result, ...requestBodyResult.result};  
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

