import type { Board } from "canvas/board/Board";
import { Group } from "canvas/board/objects/foundation/Group";
import { RotateContainer } from "canvas/board/objects/foundation/RotateContainer";
import type { GeometricObject } from "canvas/board/objects/GeometricObject";
import type { BoardItem } from "canvas/board/objects/items/BoardItem";
import { allPositionings } from "canvas/board/objects/ui/selectable/ResizeFrame";
import type { ResizeHandlePositioning } from "canvas/board/objects/ui/selectable/ResizeHandle";
import { SelectionOverlay } from "canvas/board/objects/ui/selectable/SelectionOverlay";
import type { Optional } from "canvas/primitives/types";

export class SelectionOptions {
    constructor(
        readonly canMove: boolean = false,
        readonly canResize: boolean = false,
        readonly canRotate: boolean = false,
        readonly resizeHandles: ResizeHandlePositioning[] = allPositionings,
    ) {}
}

export class Selectable extends Group {
    readonly isSelectable = true;

    readonly rotatedContent: Optional<RotateContainer<BoardItem>>;

    private overlay: SelectionOverlay;
    private overlayWrapper: GeometricObject;
    private _isSelected = false;

    constructor(
        readonly content: BoardItem,
        readonly options: SelectionOptions = content.selectionOptions ||
            new SelectionOptions(),
    ) {
        super();

        this.overlay = new SelectionOverlay(this, this.options);

        this.rotatedContent = new RotateContainer(this.content, this.content);
        this.overlayWrapper = new RotateContainer(this.overlay, this.content);
        this.children = [this.rotatedContent];
    }

    public get isSelected(): boolean {
        return this._isSelected;
    }

    public set isSelected(isSelected: boolean) {
        if (this._isSelected != isSelected) {
            this._isSelected = isSelected;

            if (this._isSelected) {
                this.board.addObjectsAbove(
                    [this.overlayWrapper],
                    this.board.controller.minOverlayMarker,
                );
            } else {
                this.board.removeObjects([this.overlayWrapper]);
            }
        }

        this.overlay.isSelected = isSelected;
    }

    public onSpawn(board: Board): void {
        super.onSpawn(board);

        const select = board.controller.select;
        const mouse = this.board.controller.mouse;

        this.subscriptions.push(
            mouse.onMouseDown.listen(this, e => {
                select.onObjectMouseDown(e);
            }),
        );
        this.subscriptions.push(
            mouse.onMouseClick.listen(this, e => {
                select.onObjectClick(e);
            }),
        );

        this.subscriptions.push(
            select.onSelect.listen(undefined, e => {
                this.isSelected = this.isSelected || e.target == this.content;
            }),
        );
        this.subscriptions.push(
            select.onDeselect.listen(undefined, e => {
                this.isSelected = this.isSelected && e.target != this.content;
            }),
        );
    }

    public onDespawn(board: Board): void {
        if (this._isSelected) {
            this.board.removeObjects([this.overlayWrapper]);
        }
        super.onDespawn(board);
    }
}

export function getTopSelectableOnEventStack<T>(
    eventStack: Optional<T[]>,
): Optional<Selectable> {
    if (eventStack === undefined) {
        return undefined;
    }

    for (const item of eventStack) {
        if ("isSelectable" in item) {
            return <Selectable>(<unknown>item);
        }
    }

    return undefined;
}
