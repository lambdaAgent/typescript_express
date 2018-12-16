import {Request, Response} from 'express'
import {ValidationError, ConnectionRefusedError, UniqueConstraintError} from 'sequelize';
import logger = require('../utils/logger');

const HttpError = {
    handleDatabaseError(err, req:Request, _:Response, next){
        err.time = new Date().getTime()
        if(err.constructor.name === ConnectionRefusedError.name) {
            err.status = 500
            next(err)
        }
        else if(err.constructor.name === ValidationError.name || err.constructor.name === UniqueConstraintError.name){
            err.status = 400
            logger.error(`Validation error see detail below ${err.time}`, req.body)
            err.message = err.errors.map(e => e.message)
            next(err)
        }
    },
    handle404(req:Request,__:Response, next){
        const err = new Error(`${req.path} Not Found`) as any;
        err['status'] = 404;
        err.time = new Date().getTime()
        next(err);
    },
    handle4xxAnd5xx(err, _:Request, res:Response, __){
        res.status(err['status'] || 500);
        err.time = err.time || new Date().getTime()
        //4xx
        if(err.status >= 400 && err.status < 500){
            logger.error(`${err.time} >>>`, err.message) //hide the stacktrace
            return res.status(err.status || 500).json({message: err.message});   
        }
        
        //5xx
        if(process.env.NODE_ENV !== 'production'){
            // not in production, send the complete error to client for debugging
            logger.error(`${err.time} >>>`, err) // show stacktrace
            return res.status(err.status || 500).json({message: err});
        }
        else {
            // in production, send default server error to client
            logger.error(`${err.time} >>>`, err)
            return res.status(err.status || 500).json({message: err.message || 'Internal Server Error'})
        }
    }
}

export default HttpError