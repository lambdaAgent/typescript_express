import {Table, Column, Model, CreatedAt, UpdatedAt, AllowNull, IsUUID, PrimaryKey, NotNull, BeforeCreate, BeforeUpdate, Length, DataType, AfterCreate, AfterUpdate, IsEmail, Unique, HasOne, HasMany} from 'sequelize-typescript';

import {hashedPassword} from '../../utils/password'
import PersonDetail from '../PersonDetail/PersonDetail'

@Table({timestamps: true, tableName: "person", schema: "core"})
class Person extends Model<Person> {
    @BeforeCreate
    static encryptPasswordIfChanged = encryptPasswordIfChanged
    @BeforeUpdate
    static encryptPassword = encryptPassword

    @IsUUID(4) @PrimaryKey @Unique @Column
    id: number;
    
    @AllowNull(false) @IsEmail @Unique @Column 
    email: string;
    @Length({min: 6, msg: 'password must be at least 6 characters'})
    @Column({ type: DataType.STRING, allowNull: false })
    password: string;

    @AllowNull(true) @Unique @Column 
    username?: string;
    
    @AllowNull(true) @Column
    first_name?: string;
    
    @AllowNull(true) @Column 
    last_name?: string;

    @HasOne(() => PersonDetail)
    person_detail?: PersonDetail

    //jointable is person_asset
    assets: string
    asset_length: number
    
    @CreatedAt created_at: number;
    
    @UpdatedAt updated_at: number;

    
}

export default Person;


//helpers
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