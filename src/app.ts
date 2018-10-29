import config = require('config');
import * as express from 'express';
import * as bodyParser from 'body-parser';
import logger = require('./utils/logger');
import * as cors from "cors";

// DbUtils
import { Db_blog } from './utils/dbUtils'

// model
import migrationScript from './utils/migrationScript'
import Person, { PersonRepository } from './model/Person'

//import controllers
// import * as healthcheckController from './controllers/controller-healthcheck';
// import * as sampleController from './controllers/controller-sample';

const app: express.Express = express();
const router: express.Router = express.Router();
app.use(cors());
app.use(bodyParser.json());
app.use(router);  // tell the app this is the router we are using

//healthcheck routes
// router.get('/', healthcheckController.healthcheck);
// router.get('/healthcheck', healthcheckController.healthcheck);
// // sampleController routes
// router.get('/servertime', sampleController.getTime);
// router.get('/transaction', sampleController.sampleTransaction);


//catch 404 and forward to error handler
//@ts-ignore
app.use((req, res, next) => {
    var err = new Error('Not Found');
    err['status'] = 404;
    next(err);
 });
 
 // error handlers
 
 // development error handler
 // will print stacktrace
 if (app.get('env') === 'development') {
    //@ts-ignore
    app.use((err: any, req, res, next) => {
        res.status(err['status'] || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
 }

app.listen(config.server.port, function () {
    logger.info(`server listening on port: ${config.port}`);

    Db_blog.authenticate()
    .then(() => {
        logger.info('Db_blog Connection has been established successfully.')
        migrationScript()


        const sample = new Person({first_name: 'vidy', last_name:'alfredo', username: 'alfred', email: 'test@email.com', _password_encrypted: 'password'})
        PersonRepository.insert(sample)
            
    })
    .catch(err => {
        logger.error('Db_blog Unable to connect to the database:', err);
    });
}); 