import {Table, Column, Model, CreatedAt, UpdatedAt, AllowNull, IsUUID, PrimaryKey, NotNull, BeforeCreate, BeforeUpdate, Length, DataType, AfterCreate, AfterUpdate, IsEmail, Unique, HasOne, HasMany, AutoIncrement, BelongsTo, ForeignKey} from 'sequelize-typescript';

import Person from '../Person/Person'
import DocumentAssetType from '../../enum/DocumentAssetType'

@Table({timestamps: true, tableName: "person_detail", schema: "core"})
class Asset extends Model<Asset> {
    @PrimaryKey @AutoIncrement @Column(DataType.INTEGER)
    id: number;

    @Column filename: string
    @Column file_extension: string
    @Column document_url: string
    @Column document_type: DocumentAssetType

    @CreatedAt created_at: number;
    
    @UpdatedAt updated_at: number;

    // ========== Relationship =============
    // assets belongs to person 
    @ForeignKey(() => Person) @Column
    person_id: string

    @BelongsTo(() => Person, 'person_id')
    owner: Person
}

export default Asset