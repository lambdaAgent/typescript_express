import {Table, Column, Model,AutoIncrement, CreatedAt, UpdatedAt, AllowNull, ForeignKey,
    PrimaryKey, NotNull, BeforeCreate, BeforeUpdate, Length, DataType, BelongsTo, 
    IsEmail, Unique, HasMany} from 'sequelize-typescript';

import Person from '../Person/Person'
import { AssertionError } from 'assert';

@Table({timestamps: true, tableName: "person_detail", schema: "core"})
class PersonDetail extends Model<PersonDetail> {
    @PrimaryKey @AutoIncrement @Column(DataType.INTEGER)
    id: number;

    @AllowNull(false) @IsEmail @Unique @Column 
    email:string
    @AllowNull(false) @Column(DataType.STRING)
    type: string;

    @AllowNull(true) @Column
    first_name: string
    @AllowNull(true) @Column
    last_name: string

    @CreatedAt created_at: number;
    
    @UpdatedAt updated_at: number;

    // ======= RELATION ===============
    @ForeignKey(() => Person) @Column
    person_id: number;
    @BelongsTo(() => Person, 'person_id')
    owner: Person;
    
}


export default PersonDetail