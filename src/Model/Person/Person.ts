import {Table, Column, Model, CreatedAt, UpdatedAt, AllowNull, IsUUID, PrimaryKey, NotNull, BeforeCreate, BeforeUpdate, Length, DataType, AfterCreate, AfterUpdate, IsEmail, Unique} from 'sequelize-typescript';

import {hashedPassword} from '../utils/password'

@Table({timestamps: true, tableName: "person", schema: "core"})
class Person extends Model<Person> {
    @BeforeCreate
    static encryptPasswordIfChanged = encryptPasswordIfChanged
    @BeforeUpdate
    static encryptPassword = encryptPassword

    @IsUUID(4) @PrimaryKey @Unique @Column
    id: number;
    
    @AllowNull(false) @Column
    first_name: string;
    
    @Column 
    last_name: string;

    @Length({min: 6, msg: 'password must be at least 6 characters'})
    @Column({ type: DataType.STRING, allowNull: false })
    password: string;

    @AllowNull(false) @Unique @Column 
    username: string;
    
    @AllowNull(false) @IsEmail @Unique @Column 
    email: string;

    @CreatedAt created_at: number;
    
    @UpdatedAt updated_at: number;

    
}

export default Person;

export function encryptPasswordIfChanged(user:Person) {
    if (user.get('password') && user.changed('password')) {
        //   encryptPassword(user.get('password'));
        const hashedPw = hashedPassword(user.password)
        user.password = hashedPw;
    }
}

export function encryptPassword(user: Person){
    if(user.get('password')){
        const hashedPw = hashedPassword(user.password)
        user.password = hashedPw;
    }
}