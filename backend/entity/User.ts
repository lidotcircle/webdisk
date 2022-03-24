import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany } from "typeorm"
import { InvitationCode } from "./InvitationCode"


@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({unique: true})
    username: string

    @Column()
    password: string

    @OneToOne(() => InvitationCode, {nullable: true})
    selfInvitationCode: InvitationCode;

    @OneToMany(() => InvitationCode, invitationCode => invitationCode.user)
    invitationCodes: InvitationCode[];

    @Column()
    rootpath: string
}
