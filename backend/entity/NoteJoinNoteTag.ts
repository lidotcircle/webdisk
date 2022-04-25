import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Unique } from "typeorm"
import { Note } from "./Note";
import { NoteTag } from "./NoteTag";


@Entity()
@Unique("note_note_tag", ["noteId", "tagId"])
export class NoteJoinNoteTag {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    noteId: number;

    @ManyToOne(() => Note)
    note: Promise<Note>;

    @Column()
    tagId: number;

    @ManyToOne(() => NoteTag)
    tag: Promise<NoteTag>;

    @CreateDateColumn()
    createdAt: Date;
}
