import express, { Request, Response, NextFunction } from "express";
import { noteService } from "../5-Services/note-service";
import { NoteModel } from "../3-Models/note-model";
import { StatusCode } from "../3-Models/enums";
import { socketService } from "../5-Services/socket-service";

const router = express.Router();

// GET http://localhost:3001/api/notes
router.get("/notes", async (request: Request, response: Response, next: NextFunction) => {
    try {
        const notes = await noteService.getAllNotes();
        response.json(notes);
    } catch (err: any) {
        next(err);
    }
});

// GET http://localhost:3001/api/notes/:id
router.get("/notes/:id", async (request: Request, response: Response, next: NextFunction) => {
    try {
        const id = +request.params.id;
        const note = await noteService.getNoteById(id);
        response.json(note);
    } catch (err: any) {
        next(err);
    }
});

// POST http://localhost:3001/api/notes
router.post("/notes", async (request: Request, response: Response, next: NextFunction) => {
    try {
        const note = new NoteModel(request.body);
        const addedNote = await noteService.addNote(note);
        socketService.broadcast("note-updated");
        response.status(StatusCode.Created).json(addedNote);
    } catch (err: any) {
        next(err);
    }
});

// PUT http://localhost:3001/api/notes/reorder
router.put("/notes/reorder", async (request: Request, response: Response, next: NextFunction) => {
    try {
        const updates = request.body; // array of { id: number, order: number }
        await noteService.reorderNotes(updates);
        socketService.broadcast("note-updated");
        response.sendStatus(StatusCode.NoContent);
    } catch (err: any) {
        next(err);
    }
});

// PUT http://localhost:3001/api/notes/:id
router.put("/notes/:id", async (request: Request, response: Response, next: NextFunction) => {
    try {
        request.body.id = +request.params.id;
        const note = new NoteModel(request.body);
        const updatedNote = await noteService.updateNote(note);
        socketService.broadcast("note-updated");
        response.json(updatedNote);
    } catch (err: any) {
        next(err);
    }
});

// DELETE http://localhost:3001/api/notes/:id
router.delete("/notes/:id", async (request: Request, response: Response, next: NextFunction) => {
    try {
        const id = +request.params.id;
        await noteService.deleteNote(id);
        socketService.broadcast("note-updated");
        response.status(StatusCode.NoContent).sendStatus(StatusCode.NoContent);
    } catch (err: any) {
        next(err);
    }
});

export const noteController = router;
