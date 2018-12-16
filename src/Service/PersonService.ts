import { Db_blog } from '../utils/dbUtils'
import Person from '../Model/Person/Person';
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
    static registerUser(email:string, password:string): Promise<string> {
        return new Promise((resolve, reject) => {
            let recentlyCreatedUserDetailId, recentlyCreatedUserId;
            Db_blog.transaction(function (t:sequelize.Transaction) {
                return Person.create({
                    email,
                    password
                }, {transaction: t}).then(function (user:Person) {
                    recentlyCreatedUserId = user.id
                    return PersonDetail.create({
                        person_id: user.id,
                        email, type:'user'
                    }, {transaction: t})
                    .then((userDetail:PersonDetail) => {recentlyCreatedUserDetailId = userDetail.id});
                });
            }).then(function (_) {
                logger.info(`registered User with ${email} at ${new Date().getTime()}`)
                resolve(recentlyCreatedUserId)
                // update user with person detail
                PersonDetail
                  .findOne({where: {id: recentlyCreatedUserDetailId}})
                  .then((userDetail:PersonDetail|null):void => {
                      if(!userDetail) reject(`Failed to link user ${recentlyCreatedUserId} with PersonDetail ${recentlyCreatedUserDetailId}` )
                      userDetail!.person_id = recentlyCreatedUserDetailId
                      userDetail!.save()
                  })

            }).catch(function (err) {
                logger.error(`Error registering user with ${email} at ${new Date().getTime()}`)
                reject(err)
            })
        }) // Promise
    }
}
