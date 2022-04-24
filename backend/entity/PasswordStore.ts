import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm"
import { User } from "./User"


@Entity()
export class PasswordStore {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => User)
    user: User

    @Column()
    userId: number;

    @Column()
    site: string

    @Column()
    account: string

    @Column()
    password: string
}
