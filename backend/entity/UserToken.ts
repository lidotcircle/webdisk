import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm"
import { User } from "./User"


@Entity()
export class UserToken {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User)
    user: Promise<User>

    @Column()
    userId: number

    @Column()
    tokenid: string

    @Column()
    usage: string

    @Column()
    expireAt: Date
}
