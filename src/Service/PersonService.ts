import { Db_blog } from '../utils/dbUtils'
import Person from '../model/Person/Person';
import PersonDetail from '../Model/PersonDetail/PersonDetail'
import logger = require('../utils/logger');
import sequelize = require('sequelize');

export default class PersonService {
    static IsEmailRegistered(email:string): Promise<boolean>{
        return new Promise((resolve, reject) => {
            Person.findOne({where: {email}})
            .then(user => {
                if(!user) resolve(false)
                else resolve(true)
            })
            .catch(reject)
        })
    }
    static registerUser(email:string, password:string): Promise<any> {
        return new Promise((resolve, reject) => {
            Db_blog.transaction(function (t:sequelize.Transaction) {
                return PersonDetail.create({
                    //TODO: index belongs_to_person on person_detail table
                    belongs_to_person: email,
                    email
                }, {transaction: t}).then(function (userDetail:PersonDetail) {
                return Person.create({
                    belongs_to_person: userDetail.id,
                    email, password
                }, {transaction: t});
                });
            }).then(function (result) {
                logger.info(`registered User with ${email} at ${new Date().getTime()}`)
                resolve(result)
            }).catch(function (err) {
                logger.error(`Error registering user with ${email} at ${new Date().getTime()}`)
                reject(err)
            })
        }) // Promise
    }
}
