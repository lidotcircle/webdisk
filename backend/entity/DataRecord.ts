import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm"
import { User } from "./User"


@Entity()
export class DataRecord {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    dgroup: string

    @Column()
    data: string

    @ManyToOne(() => User)
    user: Promise<User>

    @Column({type: 'int', nullable: true})
    userId: number | null;
}
