import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { User } from "./User"


@Entity()
export class Note {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({enum: [ "markdown", "todo" ]})
    contentType: string;

    @Column({type: "text"})
    content: string;

    @ManyToOne(() => User)
    user: Promise<User>;

    @Column()
    generation: number;

    @Column()
    userId: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
