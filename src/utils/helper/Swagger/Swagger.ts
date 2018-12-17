import {Spec, Info, ExternalDocs, Path, Schema, BodyParameter, QueryParameter,
Response, Security, Tag, Operation, Parameter, Reference, PathParameter } from 'swagger-schema-official';
import { convertJoiParamToSwagger } from './convertJoiParamToSwagger'

class Swagger implements Spec{
    swagger: string;
    info: Info;
    externalDocs?: ExternalDocs;
    host?: string;
    basePath?: string;
    schemes?: string[];
    consumes?: string[];
    produces?: string[];
    paths: {[pathName: string]: Path} = {};
    definitions?: {[definitionsName: string]: Schema };
    parameters?: {[parameterName: string]: BodyParameter|QueryParameter};
    responses?: {[responseName: string]: Response };
    security?: Array<{[securityDefinitionName: string]: string[]}>;
    securityDefinitions?: { [securityDefinitionName: string]: Security};
    tags?: Tag[];
}
export class PathDetail implements Path {
    $ref?: string;
    get?: Operation;
    put?: Operation;
    post?: Operation;
    delete?: Operation;
    options?: Operation;
    head?: Operation;
    patch?: Operation;
    parameters: Array<Parameter | Reference> = [];
    responses: {[responseName:string]:Response} = {};
}

export class PathParam implements PathParameter {
    constructor(name, description?){
        this.name = name;
        this.description = description;
    }
    name: string;
    in: string = "path";
    description: string; 
    required:boolean;
    type:string;
}

export class RequestParam implements PathParameter {
    constructor(name, description?){
        this.name = name;
        this.description = description;
    }
    name: string;
    in: string = "query";
    description: string; 
    required:boolean;
    type:string;
}



export default Swagger;


export { convertJoiParamToSwagger }