import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { Note } from "./Note";


@Entity()
export class NoteHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    patch: string;

    @ManyToOne(() => Note)
    note: Promise<Note>;

    @Column()
    noteId: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
