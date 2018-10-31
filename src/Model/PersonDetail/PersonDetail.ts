import {Table, Column, Model,AutoIncrement, CreatedAt, UpdatedAt, AllowNull, ForeignKey,
    PrimaryKey, NotNull, BeforeCreate, BeforeUpdate, Length, DataType, BelongsTo, 
    IsEmail, Unique} from 'sequelize-typescript';

import Person from '../Person/Person'

@Table({timestamps: true, tableName: "person_detail", schema: "core"})
class PersonDetail extends Model<PersonDetail> {
    @PrimaryKey @AutoIncrement @Column(DataType.INTEGER)
    id: number;

    email:string
    first_name: string
    last_name: string

    // has Many with social_media
    social_media?: string[]

    // has many asset row
    asset: string
    
    @BelongsTo(() => Person)
    person_id: Person;

    @AllowNull(false) @Column(DataType.STRING)
    type: string;
}
`
CREATE TABLE IF NOT EXISTS core.person(
    id SERIAL PRIMARY KEY,
    email varchar(255) unique NOT NULL,
    belongs_to_person varchar(255) NOT NULL,
    last_name varchar(255) NOT NULL,
    password varchar(255) NOT NULL,
    email varchar(255) unique NOT NULL,
    created_at TIME,
    updated_at TIME
  );
`

export default PersonDetail