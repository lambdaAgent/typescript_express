import {Db_blog} from './dbUtils'
import logger = require('./logger');

function migrate(){
    const query = `
    CREATE SCHEMA IF NOT EXISTS core AUTHORIZATION vidy;

    CREATE TABLE IF NOT EXISTS core.person(
        id SERIAL PRIMARY KEY,
        username varchar(255) unique,
        first_name varchar(255),
        last_name varchar(255),
        password varchar(255),
        email varchar(255) unique,
        created_at TIME,
        updated_at TIME
      );`
    Db_blog.query(query).then(logger.info).catch(logger.error)
}

export default migrate