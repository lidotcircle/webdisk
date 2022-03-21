import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { User } from "./User"


@Entity()
export class RefreshToken {
    @PrimaryGeneratedColumn()
    id: number

    @Column({unique: true})
    token: string

    @ManyToOne(() => User)
    user: User

    @Column()
    updateCount: number

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
