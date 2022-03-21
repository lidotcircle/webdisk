import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm"
import { User } from "./User"


@Entity()
export class InvitationCode {
    @PrimaryGeneratedColumn()
    id: number

    @Column({unique: true})
    code: string

    @ManyToOne(() => User, user => user.invitationCodes)
    user: User
}
