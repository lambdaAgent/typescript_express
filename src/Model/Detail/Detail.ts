import {Table, Column, Model,AutoIncrement, CreatedAt, UpdatedAt, AllowNull, ForeignKey,
    PrimaryKey, NotNull, BeforeCreate, BeforeUpdate, Length, DataType, BelongsTo, 
    IsEmail, Unique} from 'sequelize-typescript';

import Person from '../Person/Person'

@Table({timestamps: true, tableName: "person_detail", schema: "core"})
class PersonDetail extends Model<PersonDetail> {
    @PrimaryKey @AutoIncrement @Column(DataType.INTEGER)
    id: number;
    
    @AllowNull(false)
    @ForeignKey(() => Person)
    @Column(DataType.INTEGER)
    person_id: number;
    
    @BelongsTo(() => Person, {
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
    })
    person: Person;
    
    @AllowNull(false) @Column(DataType.STRING)
    type: string;
}

export default PersonDetail