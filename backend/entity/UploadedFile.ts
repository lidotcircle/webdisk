import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm"
import { User } from "./User"


@Entity()
export class UploadedFile {
    @PrimaryGeneratedColumn()
    id: number

    @Column({unique: true})
    fileid: string

    @Column()
    target: string

    @ManyToOne(() => User)
    user: Promise<User>

    @Column()
    userId: number

    @CreateDateColumn()
    createdAt: Date
}
