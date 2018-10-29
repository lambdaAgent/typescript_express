import {Db_blog} from './dbUtils'
import logger = require('./logger');

function migrate(){
    const query = `CREATE TABLE IF NOT EXISTS person(
        username varchar(255),
        first_name varchar(255),
        last_name varchar(255),
        _password_encrypted varchar(255),
        email varchar(255),
        created_at bigint,
        updated_at bigint
      );`
    Db_blog.query(query).then(logger.info)
      .catch(logger.error)
      
}

export default migrate