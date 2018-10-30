import config = require('config');
import * as express from 'express';
import * as bodyParser from 'body-parser';
import logger = require('./utils/logger');
import * as cors from "cors";
import { Router, Request, Response } from 'express';
import multer from 'multer'; // v1.0.5
// const upload = multer(); // for parsing multipart/form-data
const app: express.Express = express();

// DbUtils
import { Db_blog } from './utils/dbUtils'
import {TokenUtil} from './Token/Token'

// model
import Person from './model/Person/Person'
import TokenError from './Error/TokenError';

//import controllers
import indexRoute from './controller/mainController'
import debugRoute from './controller/debugController'
import HttpError from './Error/HttpError/HttpError';

// import * as healthcheckController from './controllers/controller-healthcheck';
// import * as sampleController from './controllers/controller-sample';

// MIDDLEWARE
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// INTERCEPT
    app.use((req:Request, res:Response, next) => {
        // Intercept here
        TokenUtil.validate(req)
        .then((validate:TokenError|boolean) => {
            if(validate instanceof TokenError) {
                res.status(400).json({message: ''})
                return Promise.reject(JSON.stringify(req) + validate)
            }
            return Promise.resolve(req)
        })
        .then(request => { 
            TokenUtil.authenticate(request).then((authenticated:TokenError|boolean) => {
                if(authenticated instanceof TokenError) {
                    res.status(400).json({message: ''})
                    return Promise.reject(JSON.stringify(request) + authenticated)
                }
                return Promise.resolve(authenticated)
            })
        })
        .then(_ => next())
        .catch(logger.error)
    })

// ROUTES
    app.use(indexRoute);  // tell the app this is the router we are using
    if(process.env.NODE_ENV !== 'production'){
        app.use(debugRoute)
    }
    //healthcheck routes
    // router.get('/', healthcheckController.healthcheck);
    // router.get('/healthcheck', healthcheckController.healthcheck);
    // // sampleController routes
    // router.get('/servertime', sampleController.getTime);
    // router.get('/transaction', sampleController.sampleTransaction);


//catch 404 and forward to error handler
    app.use(HttpError.handle404);
    app.use(HttpError.handle4xxAnd5xx);
    process.on('unhandledRejection', (reason) => logger.error(new Date().getTime(), reason))


// START
    app.listen(config.server.port, function () {
        logger.info(`server listening on port: ${config.server.port}`);

        Db_blog.authenticate()
                .then(() => logger.info('Db_blog Connection has been established successfully.'))
                .catch(err => logger.error('Db_blog Unable to connect to the database:', err));
    }); 