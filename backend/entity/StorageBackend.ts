import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { User } from "./User"


@Entity()
export class StorageBackend {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    user: Promise<User>;

    @Column()
    userId: number;

    @Column({enum: ["alioss"]})
    type: string;

    @Column()
    srcPrefixOrigin: string;

    @Column({unique: true})
    srcPrefix: string;

    @Column()
    config: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
