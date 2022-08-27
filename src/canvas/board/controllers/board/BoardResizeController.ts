import type { Board } from "canvas/board/Board";
import { Vector2 } from "canvas/primitives/space";

export class BoardResizeController {
    private eventListener: () => void;

    constructor(private board: Board) {
        this.eventListener = () => {
            this.onResize();
        };
    }

    public activate(): void {
        this.board.window.addEventListener("resize", this.eventListener);
        this.onResize();
    }

    public deactivate(): void {
        this.board.window.removeEventListener("resize", this.eventListener);
    }

    private onResize(): void {
        this.board.viewport = this.board.viewport.modified(
            new Vector2(
                this.board.boardElement.clientWidth,
                this.board.boardElement.clientHeight,
            ),
        );
    }
}
