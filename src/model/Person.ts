// import {Table, Column, Model, CreatedAt, UpdatedAt, AllowNull} from 'sequelize-typescript';

// @Table
// class Person extends Model<Person> {
//     @Column first_name: string;
//     @Column last_name: string;
//     @Column _password_encrypted: string;
//     @Column username: string;
//     @Column email: string;
//     @CreatedAt 
//     creationDate: Date;
    
//     @UpdatedAt 
//     updatedOn: Date;
// }

// export default Person

import { Db_blog } from '../utils/dbUtils'
import { create } from 'domain';
import { type } from 'os';

class Person {
    constructor(objArgs: Person){
        Object.keys(objArgs).forEach(key => 
            this[key] = objArgs[key]
        )
    }

    first_name: string;
    last_name: string;
    _password_encrypted: string;
    username: string;
    email: string;
    created_at?: Date|null;
    updated_at?: Date|null;
}

class PersonRepository {
    static insert(person: Person){
        const tableName = person.constructor.name.toLowerCase();
        const createdAt = new Date().getTime()
        let values: any[] = []
        const keys = Object.keys(person).map((key:string) => {
            //@ts-ignore
            let value:any = person[key]
            if(typeof value === 'string') value = `'${value}'`
            if(value.constructor.name === 'Date') value = new Date(value).toISOString().slice(0, 19).replace('T', ' ');

            values.push(value)
            return key
        });
        keys.push('created_at')
        values.push(createdAt)
        const query = `INSERT INTO ${tableName}(${keys.join(',')}) VALUES (${values.join(',')});`
        return Db_blog.query(query)
    }
}

export default Person
export { PersonRepository }