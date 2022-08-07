import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from "typeorm"
import { DataRecordGroup } from "./DataRecordGroup"


@Entity()
export class DataRecord {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column()
    groupId: number;

    @ManyToOne(() => DataRecordGroup, { onDelete: 'CASCADE'})
    group: Promise<DataRecordGroup>;

    @Column()
    data: string;

    @CreateDateColumn()
    createdAt: Date;
}
