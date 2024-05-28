export class CommentSaveDto {
    filmId?: number;
    nik?: string;
    text?: string;


    constructor(data: Partial<CommentSaveDto>) {
        this.filmId = data.filmId
        this.nik = data.nik;
        this.text = data.text;
    }
}