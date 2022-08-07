import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Unique } from "typeorm"
import { User } from "./User"


@Unique("dgroup_userId", ["dgroup", "userId"])
@Entity()
export class DataRecordGroup {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    dgroup: string;

    @ManyToOne(() => User)
    user: Promise<User>;

    @Column({type: 'int', nullable: true})
    userId: number | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
