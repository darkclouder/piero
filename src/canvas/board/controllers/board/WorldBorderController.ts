import type { Board } from "canvas/board/Board";
import { WorldBorder } from "canvas/board/objects/ui/WorldBorder";

export class WorldBorderController {
    private objects: WorldBorder[] = [
        new WorldBorder(false),
        new WorldBorder(true),
    ];

    constructor(private board: Board) {}

    public activate(): void {
        this.board.addObjectsBelow(
            this.objects,
            this.board.controller.minContentMarker,
        );
    }

    public deactivate(): void {
        this.board.removeObjects(this.objects);
    }
}
