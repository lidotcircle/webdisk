import { Entity, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, JoinColumn } from "typeorm"
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
    @JoinColumn()
    selfInvitationCode: Promise<InvitationCode>;

    @Column({nullable: true})
    selfInvitationCodeId: number;

    @OneToMany(() => InvitationCode, invitationCode => invitationCode.user)
    invitationCodes: Promise<InvitationCode[]>;

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @Column()
    rootpath: string
}
