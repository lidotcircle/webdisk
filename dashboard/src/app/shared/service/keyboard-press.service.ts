import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export enum Keycode {
    Unindentified,
    Shift, Alt, Ctrl, Meta,
    DOWN, UP, LEFT, RIGHT,
    ENTER, ESC=0x7E,

    /** ASCII */
    SPACE=0x20, EXCLAMINATION, QUOTATION, HASH, DOLLAR, PERCENT, AMPERSAND,
    APOSTROPHOE=0x39, LEFT_BRACKET, RIGHT_BRACKET, ASTERISK, PLUS,
    COMMA=0x44, MINUS, PERIOD, SLASH,
    N0=0x30, N1, N2, N3, N4, N5, N6, N7, N8, N9,
    COLON=0x3A, SEMICOLON=0x3B, LESS_THAN, 
    EQAUL=0x3D, GREATER_THAN, QUESTION, AT=0x40,
    A =0x41, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z,
    LEFT_TALL_BRACKET=0x5B, BACKSLASH, RIGHT_TALL_BRACKET=0x5D,  CARET, UNDERSCORE,
    a =0x61, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z,
    LEFT_CURL_BRACKET=0x7B, VERTICAL=0x7C, RIGHT_CURL_BRACKET=0x7D, TILDE,

    F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12,
}
export class Keyval {
    code: Keycode = Keycode.Unindentified;
    key:  string;
    repeat: boolean = false;
}

@Injectable({
    providedIn: 'root'
})
export class KeyboardPressService {
    private _up   = new Subject<Keyval>();
    private _down = new Subject<Keyval>();
    get up():   Observable<Keyval> {return this._up;}
    get down(): Observable<Keyval> {return this._down;}
    private _ctrl  = false;
    private _shift = false;
    private _alt   = false;
    get ctrl(): boolean  {return this._ctrl;}
    get shift(): boolean {return this._shift;}
    get alt(): boolean   {return this._alt;}

    private up_listener;
    private down_listener;
    private in_press_table: Map<Keycode, number> = new Map<Keycode, number>();

    constructor() {
        this.down_listener = document.body.addEventListener('keydown', this.keydownListener.bind(this));
        this.up_listener = document.body.addEventListener('keyup',   this.keyupListener.bind(this));
        window.addEventListener("blur", () => this.in_press_table.clear());
        window.addEventListener("focus", () => this.in_press_table.clear());
    }

    private keydownListener(ev: KeyboardEvent) {
        this._shift = ev.shiftKey;
        this._ctrl  = ev.ctrlKey;
        this._alt   = ev.altKey;
        const kv = new Keyval();
        const code = this.keymap(ev.key);
        kv.code = code;
        kv.repeat = ev.repeat;

        if(kv.code != Keycode.Unindentified) {
            this.in_press_table.set(code, Date.now());
        }
        console.log('key down ', ev.key);
        this._down.next(kv);
    }

    private keyupListener(ev: KeyboardEvent) {
        this._shift = this._shift && !ev.shiftKey;
        this._ctrl  = this._ctrl  && !ev.ctrlKey;
        this._alt   = this._alt   && !ev.altKey;
        const kv = new Keyval();
        kv.code = this.keymap(ev.key);
        if(this.in_press_table.has(kv.code)) {
            this.in_press_table.delete(kv.code);
        }
        console.log('key up ', ev.key);
        this._up.next(kv);
    }

    public InPress(key: Keycode | string): boolean {
        let _key = typeof key == 'string' ? this.keymap(key) : key;
        return this.in_press_table.has(_key);
    }

    private keymap(evkey: string) //{
    {
        let ans = Keycode.Unindentified;

        switch (evkey) {
            case "Shift":   
                ans = Keycode.Shift; break;
            case "Control": 
                ans = Keycode.Ctrl; break;
            case "Alt":     
                ans = Keycode.Alt; break;
            case "Meta":    
                ans = Keycode.Meta; break;

            case "Down":
            case "ArrowDown":
                ans = Keycode.DOWN; break;
            case "Up":
            case "ArrowUp":
                ans = Keycode.UP; break;
            case "Left":
            case "ArrowLeft":
                ans = Keycode.LEFT; break;
            case "Right":
            case "ArrowRight":
                ans = Keycode.RIGHT; break;

            case "Enter":
                ans = Keycode.ENTER; break;
            case "Esc":
            case "Escape":
                ans = Keycode.ESC; break;

            case "F1":
                ans = Keycode.F1; break;
            case "F2":
                ans = Keycode.F2; break;
            case "F3":
                ans = Keycode.F3; break;
            case "F4":
                ans = Keycode.F4; break;
            case "F5":
                ans = Keycode.F5; break;
            case "F6":
                ans = Keycode.F6; break;
            case "F7":
                ans = Keycode.F7; break;
            case "F8":
                ans = Keycode.F8; break;
            case "F9":
                ans = Keycode.F9; break;
            case "F10":
                ans = Keycode.F10; break;
            case "F11":
                ans = Keycode.F11; break;
            case "F12":
                ans = Keycode.F12; break;

            case "0":
                ans = Keycode.N0; break;
            case "1":
                ans = Keycode.N1; break;
            case "2":
                ans = Keycode.N2; break;
            case "3":
                ans = Keycode.N3; break;
            case "4":
                ans = Keycode.N4; break;
            case "5":
                ans = Keycode.N5; break;
            case "6":
                ans = Keycode.N6; break;
            case "7":
                ans = Keycode.N7; break;
            case "8":
                ans = Keycode.N8; break;
            case "9":
                ans = Keycode.N9; break;

            case "A":
                ans = Keycode.A; break;
            case "B":
                ans = Keycode.B; break;
            case "C":
                ans = Keycode.C; break;
            case "D":
                ans = Keycode.D; break;
            case "E":
                ans = Keycode.E; break;
            case "F":
                ans = Keycode.F; break;
            case "G":
                ans = Keycode.G; break;
            case "H":
                ans = Keycode.H; break;
            case "I":
                ans = Keycode.I; break;
            case "J":
                ans = Keycode.J; break;
            case "K":
                ans = Keycode.K; break;
            case "L":
                ans = Keycode.L; break;
            case "M":
                ans = Keycode.M; break;
            case "N":
                ans = Keycode.N; break;
            case "O":
                ans = Keycode.O; break;
            case "P":
                ans = Keycode.P; break;
            case "Q":
                ans = Keycode.Q; break;
            case "R":
                ans = Keycode.R; break;
            case "S":
                ans = Keycode.S; break;
            case "T":
                ans = Keycode.T; break;
            case "U":
                ans = Keycode.U; break;
            case "V":
                ans = Keycode.V; break;
            case "W":
                ans = Keycode.W; break;
            case "X":
                ans = Keycode.X; break;
            case "Y":
                ans = Keycode.Y; break;
            case "Z":
                ans = Keycode.Z; break;

            case "a":
                ans = Keycode.a; break;
            case "b":
                ans = Keycode.b; break;
            case "c":
                ans = Keycode.c; break;
            case "d":
                ans = Keycode.d; break;
            case "e":
                ans = Keycode.e; break;
            case "f":
                ans = Keycode.f; break;
            case "g":
                ans = Keycode.g; break;
            case "h":
                ans = Keycode.h; break;
            case "i":
                ans = Keycode.i; break;
            case "j":
                ans = Keycode.j; break;
            case "k":
                ans = Keycode.k; break;
            case "l":
                ans = Keycode.l; break;
            case "m":
                ans = Keycode.m; break;
            case "n":
                ans = Keycode.n; break;
            case "o":
                ans = Keycode.o; break;
            case "p":
                ans = Keycode.p; break;
            case "q":
                ans = Keycode.q; break;
            case "r":
                ans = Keycode.r; break;
            case "s":
                ans = Keycode.s; break;
            case "t":
                ans = Keycode.t; break;
            case "u":
                ans = Keycode.u; break;
            case "v":
                ans = Keycode.v; break;
            case "w":
                ans = Keycode.w; break;
            case "x":
                ans = Keycode.x; break;
            case "y":
                ans = Keycode.y; break;
            case "z":
                ans = Keycode.z; break;

            case " ":
                ans = Keycode.SPACE; break;
            case "!":
                ans = Keycode.EXCLAMINATION; break;
            case "\"":
                ans = Keycode.QUOTATION; break;
            case "#":
                ans = Keycode.HASH; break;
            case "$":
                ans = Keycode.DOLLAR; break;
            case "%":
                ans = Keycode.PERCENT; break;
            case "&":
                ans = Keycode.AMPERSAND; break;
            case "'":
                ans = Keycode.APOSTROPHOE; break;
            case "(":
                ans = Keycode.LEFT_BRACKET; break;
            case ")":
                ans = Keycode.RIGHT_BRACKET; break;
            case "*":
                ans = Keycode.ASTERISK; break;
            case "+":
                ans = Keycode.PLUS; break;
            case ",":
                ans = Keycode.COMMA; break;
            case "-":
                ans = Keycode.MINUS; break;
            case ".":
                ans = Keycode.PERIOD; break;
            case "/":
                ans = Keycode.SLASH; break;
            case ":":
                ans = Keycode.COLON; break;
            case ";":
                ans = Keycode.SEMICOLON; break;
            case "<":
                ans = Keycode.LESS_THAN; break;
            case "=":
                ans = Keycode.EQAUL; break;
            case ">":
                ans = Keycode.GREATER_THAN; break;
            case "?":
                ans = Keycode.QUESTION; break;
            case "@":
                ans = Keycode.AT; break;
            case "[":
                ans = Keycode.LEFT_TALL_BRACKET; break;
            case "\\":
                ans = Keycode.BACKSLASH; break;
            case "]":
                ans = Keycode.RIGHT_TALL_BRACKET; break;
            case "`":
                ans = Keycode.CARET; break;
            case "_":
                ans = Keycode.UNDERSCORE; break;
            case "{":
                ans = Keycode.LEFT_CURL_BRACKET; break;
            case "|":
                ans = Keycode.VERTICAL; break;
            case "}":
                ans = Keycode.RIGHT_CURL_BRACKET; break;
            case "~":
                ans = Keycode.TILDE; break;

            default:
                break;
        }

        return ans;
    } //}
}

