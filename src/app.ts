import config = require('config');
import * as express from 'express';
import * as bodyParser from 'body-parser';
import logger = require('./utils/logger');
import * as cors from "cors";
import { Router, Request, Response } from 'express';
import multer from 'multer'; // v1.0.5
// const upload = multer(); // for parsing multipart/form-data
const app: express.Express = express();

// MIDDLEWARE
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// INTERCEPT
    app.use((req:Request, res:Response, next) => {
        // Intercept here
        // TokenUtil.validate(req)
        // if(!req.headers.authorization || typeof req.headers.authorization === 'object') {
        //    return resolve(TokenError.TOKEN_INVALID)
        // }
        // .then((validate:TokenError|boolean) => {
        //     if(validate instanceof TokenError) {
        //         res.status(400).json({message: ''})
        //         return Promise.reject(JSON.stringify(req) + validate)
        //     }
        //     return Promise.resolve(req)
        // })
        // .then(request => { 
        //     TokenUtil.authenticate(request).then((authenticated:TokenError|boolean) => {
        //         if(authenticated instanceof TokenError) {
        //             res.status(400).json({message: ''})
        //             return Promise.reject(JSON.stringify(request) + authenticated)
        //         }
        //         return Promise.resolve(authenticated)
        //     })
        // })
        // .then(_ => next())
        // .catch(logger.error)
        next();
    })

// ROUTES

//import controllers
require('./controller/mainController')(app);
import HttpError from './Error/HttpError';

app.use(HttpError.handle404);
app.use(HttpError.handle4xxAnd5xx);

process.on('unhandledRejection', (reason) => logger.error(new Date().getTime(), reason))
app.listen(config.server.port, function () {
    logger.info(`server listening on port: ${config.server.port}`);

    // Db_blog.authenticate()
    //         .then(() => {
    //             logger.info('Db_blog Connection has been established successfully.')
    //             logger.info('DB MODEL' + JSON.stringify(Db_blog.models))
    //         })
    //         .catch(err => logger.error('Db_blog Unable to connect to the database:', err));
}); 

