import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm"
import { User } from "./User"


@Entity()
export class UserToken {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User)
    user: User

    @Column()
    tokenid: string

    @Column()
    usage: string

    @Column()
    expireAt: Date
}
