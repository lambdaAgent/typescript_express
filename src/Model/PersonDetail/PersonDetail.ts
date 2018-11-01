import {Table, Column, Model,AutoIncrement, CreatedAt, UpdatedAt, AllowNull, ForeignKey,
    PrimaryKey, NotNull, BeforeCreate, BeforeUpdate, Length, DataType, BelongsTo, 
    IsEmail, Unique} from 'sequelize-typescript';

import Person from '../Person/Person'

@Table({timestamps: true, tableName: "person_detail", schema: "core"})
class PersonDetail extends Model<PersonDetail> {
    @PrimaryKey @AutoIncrement @Column(DataType.INTEGER)
    id: number;

    @AllowNull(false) @IsEmail @Unique @Column 
    email:string
    @ForeignKey(() => Person) @Column
    person_id: number;
    @BelongsTo(() => Person, 'person_id')
    person: Person;
    @AllowNull(false) @Column(DataType.STRING)
    type: string;


    @AllowNull(true) @Column
    first_name: string
    @AllowNull(true) @Column
    last_name: string

    // has Many with social_media
    @AllowNull(true) @Column(DataType.STRING)
    social_media_id?: string[]

    // has many asset 
    @AllowNull(true) @Column(DataType.STRING)
    asset: string
    
    @CreatedAt created_at: number;
    
    @UpdatedAt updated_at: number;

}


export default PersonDetail