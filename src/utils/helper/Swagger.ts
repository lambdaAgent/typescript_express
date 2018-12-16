import * as SwaggerInterface from 'swagger-schema-official';
import { RequestValidatorImpl } from '../RequestMapping/RequestMapping';
class Swagger implements SwaggerInterface.Spec{
    swagger: string;
    info: SwaggerInterface.Info;
    externalDocs?: SwaggerInterface.ExternalDocs;
    host?: string;
    basePath?: string;
    schemes?: string[];
    consumes?: string[];
    produces?: string[];
    paths: {[pathName: string]: SwaggerInterface.Path};
    definitions?: {[definitionsName: string]: SwaggerInterface.Schema };
    parameters?: {[parameterName: string]: SwaggerInterface.BodyParameter|SwaggerInterface.QueryParameter};
    responses?: {[responseName: string]: SwaggerInterface.Response };
    security?: Array<{[securityDefinitionName: string]: string[]}>;
    securityDefinitions?: { [securityDefinitionName: string]: SwaggerInterface.Security};
    tags?: SwaggerInterface.Tag[];
}

export default Swagger;