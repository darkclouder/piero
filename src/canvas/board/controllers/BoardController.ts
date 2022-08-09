import type { Board } from "@canvas/board/Board";
import { FontController } from "@canvas/board/controllers/board/FontController";
import { WorldBorderController } from "@canvas/board/controllers/board/WorldBorderController";
import { BoardMode } from "@canvas/board/controllers/BoardMode";
import { GuidelineController } from "@canvas/board/controllers/objects/GuidelineController";
import { MoveObjectController } from "@canvas/board/controllers/objects/MoveObjectController";
import { ResizeObjectController } from "@canvas/board/controllers/objects/ResizeObjectController";
import { RotateObjectController } from "@canvas/board/controllers/objects/RotateObjectController";
import { SelectBoxController } from "@canvas/board/controllers/objects/SelectBoxController";
import { LayerMarker } from "@canvas/board/objects/foundation/LayerMarker";
import { StateMachine } from "@canvas/primitives/StateMachine";

import { BoardResizeController } from "./board/BoardResizeController";
import { PanController } from "./board/PanController";
import { ZoomController } from "./board/ZoomController";
import { MouseInteractionController } from "./objects/MouseInteractionController";
import { SelectObjectController } from "./objects/SelectObjectController";

export class BoardController {
    // Markers
    readonly minContentMarker = new LayerMarker();
    readonly maxContentMarker = new LayerMarker();
    readonly minOverlayMarker = this.maxContentMarker;
    readonly maxOverlayMarker = new LayerMarker();

    // Mode
    readonly mode = new StateMachine<BoardMode>(BoardMode.Select);

    // Board level
    readonly boardResize: BoardResizeController;

    readonly zoom: ZoomController;
    readonly pan: PanController;

    readonly font: FontController;

    readonly worldBorder: WorldBorderController;

    // Object interaction
    readonly select: SelectObjectController;
    readonly selectBox: SelectBoxController;
    readonly move: MoveObjectController;
    readonly resize: ResizeObjectController;
    readonly rotate: RotateObjectController;

    readonly guideline: GuidelineController;

    readonly mouse: MouseInteractionController;

    constructor(private board: Board) {
        this.boardResize = new BoardResizeController(board);

        this.zoom = new ZoomController(board);
        this.pan = new PanController(board);

        this.font = new FontController(board);

        this.worldBorder = new WorldBorderController(board);

        this.select = new SelectObjectController(board);
        this.selectBox = new SelectBoxController(board);
        this.move = new MoveObjectController(board);
        this.resize = new ResizeObjectController(board);
        this.rotate = new RotateObjectController(board);

        this.guideline = new GuidelineController(board);

        this.mouse = new MouseInteractionController(board);

        this.addMarkers();
    }

    public activate(): void {
        this.boardResize.activate();

        this.zoom.activate();
        this.pan.activate();

        this.font.activate();

        this.worldBorder.activate();

        this.select.activate();
        this.selectBox.activate();

        if (!this.board.config.viewOnlyMode) {
            this.move.activate();
            this.resize.activate();
            this.rotate.activate();

            this.guideline.activate();
        }

        this.mouse.activate();
    }

    public deactivate(): void {
        this.boardResize.deactivate();

        this.zoom.deactivate();
        this.pan.deactivate();

        this.font.deactivate();

        this.worldBorder.activate();

        this.select.deactivate();
        this.selectBox.deactivate();
        this.move.deactivate();
        this.resize.deactivate();
        this.rotate.deactivate();

        this.guideline.deactivate();

        this.mouse.deactivate();
    }

    private addMarkers(): void {
        this.board.addObjects([
            this.minContentMarker,
            this.minOverlayMarker,
            this.maxOverlayMarker,
        ]);
    }
}
