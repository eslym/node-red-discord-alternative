import {EditorRED} from "node-red";

export type Optional<T> = {
    [key in keyof T]?: T[key];
};

// for html
declare global {
    const RED: EditorRED;
}
