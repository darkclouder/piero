import "@ext/Set";

import type { Board } from "@canvas/board/Board";
import { BoardMode } from "@canvas/board/controllers/BoardMode";
import type {
    DeselectObjectEvent,
    SelectObjectEvent,
} from "@canvas/board/controllers/objects/SelectObjectController";
import type { Group } from "@canvas/board/objects/foundation/Group";
import type { GeometricObject } from "@canvas/board/objects/GeometricObject";
import type { BoardItem } from "@canvas/board/objects/items/BoardItem";
import type {
    Selectable,
    SelectionOptions,
} from "@canvas/board/objects/ui/selectable/Selectable";
import { SelectBoxFrame } from "@canvas/board/objects/ui/SelectBoxFrame";
import type { Subscription } from "@canvas/primitives/events";
import { EventHandler, unsubscribeAll } from "@canvas/primitives/events";
import {
    BoundingBox,
    doBoundingBoxesOverlap,
    Vector2,
} from "@canvas/primitives/space";
import { Binding } from "@config/bindings";
import type { ImmutableSetView } from "@ext/Set";

import type {
    MouseDownEvent,
    MouseMoveEvent,
    MouseUpEvent,
} from "./MouseInteractionController";

export class SelectBoxController {
    readonly onSelect = new EventHandler<SelectObjectEvent>();
    readonly onDeselect = new EventHandler<DeselectObjectEvent>();

    private subscriptions: Subscription[] = [];
    private selectSubscriptions: Subscription[] = [];
    private activeSelectSubscriptions: Subscription[] = [];
    private isActive = false;
    private _selectedObjects: Set<BoardItem> = new Set();
    private _objectOptions = new Map<BoardItem, SelectionOptions>();
    private frame = new SelectBoxFrame();
    private startPosition = Vector2.origin;

    constructor(readonly board: Board) {}

    public get selectedObjects(): ImmutableSetView<BoardItem> {
        return this._selectedObjects.immutable();
    }

    public getOptions(boardItem: BoardItem): SelectionOptions {
        return this._objectOptions.get(boardItem);
    }

    public activate(): void {
        const mode = this.board.controller.mode;

        this.subscriptions.push(
            mode.onEnter.listen(BoardMode.Select, () => {
                this.enterSelectMode();
            }),
        );
        this.subscriptions.push(
            mode.onExit.listen(BoardMode.Select, () => {
                this.exitSelectMode();
            }),
        );
        this.subscriptions.push(
            this.board.onDespawn.listen(undefined, target => {
                if (this._selectedObjects.has(<BoardItem>(<unknown>target))) {
                    this._selectedObjects.delete(<BoardItem>(<unknown>target));
                }
            }),
        );

        if (mode.state === BoardMode.Select) {
            this.enterSelectMode();
        }
    }

    public deactivate(): void {
        this.exitSelectMode();
        unsubscribeAll(this.subscriptions);
    }

    private onMouseDown(e: MouseDownEvent): void {
        if (e.target !== undefined) {
            // Only activate a select box if dragging is started on the empty canvas
            return;
        }

        if (this.isActive) {
            return;
        }

        // Start select
        this.isActive = true;

        const mouse = this.board.controller.mouse;

        this.selectSubscriptions.push(
            mouse.onMouseMove.listen(undefined, e => {
                this.onSelectMove(e);
            }),
        );

        const worldPosition = this.board.viewport.toWorldPosition(e.position);
        this.startPosition = worldPosition;

        this.frame.updateSize(worldPosition, Vector2.origin);
        this.board.addObjectsAbove(
            [this.frame],
            this.board.controller.minOverlayMarker,
        );
    }

    private onMouseUp(e: MouseUpEvent): void {
        if (this.isActive) {
            // End select
            this.isActive = false;
            unsubscribeAll(this.activeSelectSubscriptions);
            this.board.removeObjects([this.frame]);

            const viewport = this.board.viewport;

            // Find objects in selection frame
            const worldPosition = viewport.toWorldPosition(e.position);

            const frameBox = BoundingBox.normalized(
                viewport.toViewportPosition(this.startPosition),
                viewport.toViewportSize(
                    worldPosition.minus(this.startPosition),
                ),
            );

            const selectCandidates: Selectable[] = [];

            for (const object of this.board.objects) {
                for (const selectable of findSelectables(object)) {
                    const objectBox = selectable.boundingBox(
                        this.board.viewport,
                    );

                    if (doBoundingBoxesOverlap(frameBox, objectBox)) {
                        selectCandidates.push(selectable);
                    }
                }
            }

            const useMultiSelect = Binding.MultiSelect.modifiers(e);

            if (useMultiSelect) {
                this.board.controller.select.toggleSelection(selectCandidates);
            } else {
                this.board.controller.select.selectMany(selectCandidates);
            }
        }
    }

    private onSelectMove(e: MouseMoveEvent): void {
        if (this.isActive) {
            const worldPosition = this.board.viewport.toWorldPosition(
                e.position,
            );
            const size = worldPosition.minus(this.startPosition);
            this.frame.updateSize(this.startPosition, size);
        }
    }

    private enterSelectMode(): void {
        const mouse = this.board.controller.mouse;

        this.selectSubscriptions.push(
            mouse.onMouseDown.listen(undefined, e => {
                this.onMouseDown(e);
            }),
        );
        this.selectSubscriptions.push(
            mouse.onMouseUp.listen(undefined, e => {
                this.onMouseUp(e);
            }),
        );
    }

    private exitSelectMode(): void {
        unsubscribeAll(this.selectSubscriptions);
    }
}

export function findSelectables(object: GeometricObject): Selectable[] {
    if ("isSelectable" in object) {
        const selectable = <Selectable>object;

        if (selectable.isSelectable) {
            return [selectable];
        }
    }

    if ("children" in object) {
        // TODO: Create abstract type to only contain children
        return (<Group>object).children.map(findSelectables).flat();
    }

    return [];
}
