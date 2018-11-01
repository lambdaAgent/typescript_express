import {Table, Column, Model, CreatedAt, UpdatedAt, AllowNull, IsUUID, PrimaryKey, NotNull, BeforeCreate, BeforeUpdate, Length, DataType, AfterCreate, AfterUpdate, IsEmail, Unique, HasOne, HasMany, BelongsTo, ForeignKey} from 'sequelize-typescript';

import {hashedPassword} from '../../utils/password'
import PersonDetail from '../PersonDetail/PersonDetail'
import Asset from '../Asset/Asset'

@Table({timestamps: true, tableName: "person", schema: "core"})
class Person extends Model<Person> {
    @BeforeCreate
    static encryptPasswordIfChanged = encryptPasswordIfChanged
    @BeforeUpdate
    static encryptPassword = encryptPassword

    @IsUUID(4) @PrimaryKey @Unique @Column
    id: number;
    
    @AllowNull(false) @IsEmail @Unique @Column 
    email: string
    @Length({min: 6, msg: 'password must be at least 6 characters'})
    @Column({ type: DataType.STRING, allowNull: false })
    password: string
    @AllowNull(false) @Column 
    role: string

    @AllowNull(true) @Unique @Column 
    username?: string;
    
    @HasOne(() => PersonDetail)
    person_detail?: PersonDetail

    //jointable is person_asset
    assets: string
    asset_length: number
    
    @CreatedAt created_at: number;
    
    @UpdatedAt updated_at: number;

    // ========== Relationship =============

    // has Many with social_media
    // @HasMany(() => {})    
    // social_media_id?: string[]

    // has many assets    
    @HasMany(() => Asset)
    asset?: Asset
    
}

export default Person

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