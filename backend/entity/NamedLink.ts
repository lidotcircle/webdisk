import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm"
import { User } from "./User"


@Entity()
export class NamedLink {
    @PrimaryGeneratedColumn()
    id: number

    @Column({unique: true})
    name: string

    @Column()
    target: string

    @ManyToOne(() => User, {eager: true})
    user: User

    @CreateDateColumn()
    createdAt: Date

    @Column()
    expireAt: Date
}
