import * as j2s from 'joi-to-swagger';
import { PathParam, RequestParam } from './Swagger';
import { ObjectSchema } from 'joi';


export function convertJoiParamToSwagger(joiValidation:ObjectSchema, param:PathParam|RequestParam):PathParam{
    //@ts-ignore
    const isRequired = joiValidation._flags.presence === 'required';
    const {swagger, comp} = j2s(joiValidation);
    param['required'] = isRequired;
    Object.keys(swagger).forEach(key => {
        param[key] = swagger[key];
    })
    return param;
}