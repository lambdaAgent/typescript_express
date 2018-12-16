import { RequestValidator } from "./RequestMapping";
import { any } from "bluebird";

export default function createDocumentation(method:string, pathname:string, req:RequestValidator){
    const doc:SprinkleDoc = new SprinkleDoc();
    doc.pathname = pathname;
    doc.http_method = method;
    if("_requestBody" in req && req._requestBody.schema) {
        doc.requestBody
        //TODO: what to do with requestBody
    }

    if("_authorizeOption" in req && req._authorizeOption.validator){
        doc.authorization
        //TODO: what to do with authorization

    }
    if("_responseBody" in req && req._responseBody.valid){
        doc.responseBody = {
            default: { data: any, message: 'Success'},
        }
        Object.keys(req._responseBody).map(key => {
            const schema = req._responseBody[key]
            //TODO: what to do with schema
        })
    }
    if("_requestParams" in req && req._requestParams && req._requestParams.length > 0){
        doc.requestParams = req._requestParams.map(reqParam => {
            const propname = reqParam[0]
            const required = reqParam[1].required
            const type = reqParam[1].type
            const sprinkleDetail = reqParam[1]['@sprinkle'];
            return { 
                request_param: propname, 
                presence: required, // required
                type: type,
                '@sprinkle': sprinkleDetail
            }
        });
    }
    if("_pathVariables" in req && req._pathVariables && req._pathVariables.length > 0){
        doc.pathVariables = req._pathVariables.map(pathVar => {
            const pathname = pathVar[0]
            const type = pathVar[1].type
            const sprinkleDetail = pathVar[1]['@sprinkle'];
            return { 
                pathname, type,
                '@sprinkle': sprinkleDetail
             };
        });
    }

    return doc;
}

export class SprinkleDocDescription {
    '@description': string;
    '@example': string;
}

class SprinkleDoc {
    route: string;
    pathname: string;
    '@sprinkle'?: SprinkleDocDescription;
    http_method: string;
    authorization?: {
        presence: boolean; // required
        authType: string;
        '@sprinkle'?: SprinkleDocDescription;
    }
    pathVariables?: Array<{
        pathname:string;
        type: Function;
        '@sprinkle'?: SprinkleDocDescription;
    }>
    requestParams?: Array<{
        request_param: string;
        presence: boolean; // required
        type: Function;
        '@sprinkle'?: SprinkleDocDescription;
    }>
    requestBody?: {
        schema: Object;
        '@sprinkle'?: SprinkleDocDescription;
    }
    responseBody?: {
        //200: {data: any, message: string|string[] }
        default: { data:any, message: string|string[] } 
        '@sprinkle'?: SprinkleDocDescription;
    }
}