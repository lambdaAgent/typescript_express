import { Request } from "express";
import * as validate from 'validate.js';
import { request } from "http";

function constructObjectFromRefUrl (refUrl){
    console.log('refUrl', refUrl)
    let obj = {};
    let pathIndex = -1;
    for (let idx=0; idx<refUrl.length; idx++){
        const str = refUrl[idx];
        if(str === '/') pathIndex+=1;
        if(str === '/' && refUrl[idx+1] && refUrl[idx+1] === ':') {
            //search for '}'
            for(let inner=idx+2; inner<1000;inner++){
                const innerStr = refUrl[inner];
                if(innerStr === '/'){
                    const key = refUrl.slice(idx+2, inner)
                    obj[key] = pathIndex
                    idx = inner;
                    break;
                }
            }
        }
        if(str === '?') break;
    }
    return obj
}

class ValidatorOption {
    required: boolean;
    type: Function;
    as?: string
}


const objToValidate = {
    username: 'asfd',
    password: '1'
}
 
const SCHEMA = {
    username: {
        presence: true,
        exclusion: {
        within: ["nicklas"],
        message: "'%{value}' is not allowed"
        }
    },
    password: {
        presence: true,
        length: {
        minimum: 6,
        message: "must be at least 6 characters"
        }
    }
}

class Test {
    _pathVariables:Array<[string, ValidatorOption]> = [
        ["one", {required:true, type: String, as: "ONE"}],
        ["two", {required:true, type: Number, as: "TWO"}],
        ["three", {required:true, type: Boolean, as: "THREE"}],
    ];
    _requestParams:Array<[string, ValidatorOption]> = [
        ["searchBy", {required:true, type: String}],
        ["ascending", {required:true, type: Boolean, as: "TWO"}],
    ];
    _HttpPathName = '/asdf/{one}/asdf/{two}/{three}';
    //@ts-ignore
    _executeRequestParam(req:Request):{errorMessages:String[], isValid:boolean, result: {}} {
        const _result = {};
        let queryString:string = req.url.split('?')[1];
        if(!queryString)  return {errorMessages: ['No Query String'], isValid:false, result:_result} 
        const queryStringArr = queryString.split('&');
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
        //@ts-ignore
        return {errorMessages, isValid, result:_result}
    }
    //@ts-ignore
    _executePathVariable(req:Request):{errorMessages:string[], isValid:boolean, result:{}}{
        let _result = {};
        const objMap = constructObjectFromRefUrl(this._HttpPathName);
        const path = req.url.split('//')[1].split('/').slice(1);
        const errorMessages = this._pathVariables.map((o)=> {
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

    _requestBodyOption = {
        schema: SCHEMA
    }
    //@ts-ignore
    _executeRequestBody(req:Request):{errorMessages:string[], isValid:boolean, result:{}}{
        const objToValidate = req.body;
        const schema = this._requestBodyOption.schema;
        let objError = {};
        if(schema) objError = validate(objToValidate, schema);
        const errorMessages = Object.keys(objError).map(key => objError[key]);
        const isValid = errorMessages.length === 0;
        return { errorMessages, isValid, result: isValid ? objToValidate : {} };
    }
}

let req = {
    body: objToValidate,
    url: 'http://www.vidy.com/asdf/value1/asfd/1/true?searchBy=asdf&ascending=true'
};


//@ts-ignore
// const result = new Test()._executeRequestParam(req);
// const result = new Test()._executePathVariable(req);
const result = new Test()._executeRequestBody(req);
console.log(result)