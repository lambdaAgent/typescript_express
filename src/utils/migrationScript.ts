import {Db_blog} from './dbUtils'
import logger = require('./logger');

function migrate(){
    const query = `
    CREATE SCHEMA IF NOT EXISTS core AUTHORIZATION vidy;

    CREATE TABLE IF NOT EXISTS core.person(
        id SERIAL PRIMARY KEY,
        username varchar(255) unique NOT NULL,
        first_name varchar(255) NOT NULL,
        last_name varchar(255) NOT NULL,
        password varchar(255) NOT NULL,
        email varchar(255) unique NOT NULL,
        created_at TIME,
        updated_at TIME
      );`
    Db_blog.query(query).then(logger.info).catch(logger.error)
}

export default migrate