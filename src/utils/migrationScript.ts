import {Db_blog} from './dbUtils'
import logger = require('./logger');

function migrate(){
    const query = `
    CREATE SCHEMA IF NOT EXISTS core AUTHORIZATION vidy;

    CREATE TABLE IF NOT EXISTS core.person(
        person_id SERIAL PRIMARY KEY,
        username varchar(255),
        first_name varchar(255),
        last_name varchar(255),
        password varchar(255) NOT NULL,
        email varchar(255) unique NOT NULL,
        person_detail_id bigint,
        asset_id bigint, /* jointable person_asset */
        user_type varchar(255),
        created_at TIME,
        updated_at TIME
      );
      
    CREATE TABLE IF NOT EXISTS core.person_detail(
        person_detail_id SERIAL PRIMARY KEY,
        email varchar(255) NOT NULL,
        first_name varchar(255) NOT NULL,
        last_name varchar(255) NOT NULL,
        social_media_id varchar(255), /* jointable persondetail_social_media*/
        person_id: Person;
    `
    Db_blog.query(query).then(logger.info).catch(logger.error)
}

export default migrate