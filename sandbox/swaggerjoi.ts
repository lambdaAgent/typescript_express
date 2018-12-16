console.log('jee;')
import * as Joi from 'joi'
var j2s = require('joi-to-swagger');


const loginDTO = Joi.object().keys({
    username: Joi.string().email().required().description('An email'),
    password: Joi.string().min(6).required(),
    isAdmin: Joi.boolean().required(),
}).unknown()

  let {swagger, components} = j2s(loginDTO);
