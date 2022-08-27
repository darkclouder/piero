import "ext/Set";

import type { Board } from "canvas/board/Board";
import { BoardMode, canSelect } from "canvas/board/controllers/BoardMode";
import type { GeometricObject } from "canvas/board/objects/GeometricObject";
import type { BoardItem } from "canvas/board/objects/items/BoardItem";
import type {
    Selectable,
    SelectionOptions,
} from "canvas/board/objects/ui/selectable/Selectable";
import { getTopSelectableOnEventStack } from "canvas/board/objects/ui/selectable/Selectable";
import type { Subscription } from "canvas/primitives/events";
import {
    EventBase,
    EventHandler,
    unsubscribeAll,
} from "canvas/primitives/events";
import type { Optional } from "canvas/primitives/types";
import { Binding } from "config/bindings";
import type { ImmutableSetView } from "ext/Set";

import type {
    MouseClickEvent,
    MouseDownEvent,
} from "./MouseInteractionController";

export class SelectObjectEvent extends EventBase<GeometricObject> {
    public targetSubstitution: Optional<GeometricObject>;

    constructor(eventStack?: GeometricObject[]) {
        super(eventStack);
    }
}
export class DeselectObjectEvent extends SelectObjectEvent {}

export class SelectObjectController {
    readonly onSelect = new EventHandler<SelectObjectEvent>();
    readonly onDeselect = new EventHandler<DeselectObjectEvent>();

    private subscriptions: Subscription[] = [];
    private selectSubscriptions: Subscription[] = [];
    private _selectedObjects: Set<BoardItem> = new Set();
    private _objectOptions = new Map<BoardItem, SelectionOptions>();

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
                this.enterSelect();
            }),
        );
        this.subscriptions.push(
            mode.onExit.listen(BoardMode.Select, () => {
                this.exitSelect();
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
            this.enterSelect();
        }
    }

    public deactivate(): void {
        this.exitSelect();
        unsubscribeAll(this.subscriptions);
    }

    public selectOne(selectable: Selectable): void {
        this.selectMany([selectable]);
    }

    public selectMany(selectables: Selectable[], exclusive = true): void {
        if (exclusive) {
            const select = new Set(
                selectables.map(selectable => selectable.content),
            );
            const deselect = [...this._selectedObjects].filter(
                item => !select.has(item),
            );

            this.deselectMany(deselect);
        }

        selectables.forEach(selectable => {
            const item = selectable.content;
            const options = selectable.options;

            if (!this._selectedObjects.has(item)) {
                this._selectedObjects.add(item);
                this._objectOptions.set(item, options);
                this.onSelect.dispatch(new SelectObjectEvent([item]));
            }
        });
    }

    public deselectMany(objects: BoardItem[]): void {
        for (const object of objects) {
            this._selectedObjects.delete(object);
            this.onDeselect.dispatch(new DeselectObjectEvent([object]));
        }
    }

    public deselectAll(): void {
        this.deselectMany([...this._selectedObjects]);
    }

    public toggleSelection(selectables: Selectable[]): void {
        selectables.forEach(selectable => {
            const item = selectable.content;

            if (this._selectedObjects.has(item)) {
                this._selectedObjects.delete(item);
                this._objectOptions.delete(item);

                this.onDeselect.dispatch(new DeselectObjectEvent([item]));
            } else {
                this._selectedObjects.add(item);
                this._objectOptions.set(item, selectable.options);

                this.onSelect.dispatch(new SelectObjectEvent([item]));
            }
        });
    }

    public onObjectMouseDown(e: MouseDownEvent): void {
        if (!canSelect(this.board.controller.mode.state)) {
            return;
        }

        const selectable = getTopSelectableOnEventStack(e.eventStack);

        if (selectable === undefined) {
            return;
        }

        if (Binding.SingleSelect.mousePress(e)) {
            // Only do single select on mousedown if there is only one selection
            if (this._selectedObjects.size <= 1) {
                this.selectOne(selectable);
            }
        } else if (Binding.MultiSelect.mousePress(e)) {
            // Multi-select always works on mousedown because it's less distructive
            if (e.target !== undefined) {
                this.toggleSelection([selectable]);
            }
        }
    }

    public onObjectClick(e: MouseClickEvent): void {
        if (!canSelect(this.board.controller.mode.state)) {
            return;
        }

        const selectable = getTopSelectableOnEventStack(e.eventStack);

        if (selectable === undefined) {
            return;
        }

        if (Binding.SingleSelect.mousePress(e)) {
            // Multiple selections: Perform single select that has not
            // been performed during mousedown
            if (this._selectedObjects.size > 1) {
                this.selectOne(selectable);
            }
        }
    }

    private enterSelect(): void {
        const mouse = this.board.controller.mouse;

        this.selectSubscriptions.push(
            mouse.onMouseDown.listen(undefined, e => {
                this.onMouseDown(e);
            }),
        );
    }

    private exitSelect(): void {
        unsubscribeAll(this.selectSubscriptions);
    }

    private onMouseDown(e: MouseDownEvent): void {
        if (
            e.target === undefined &&
            canSelect(this.board.controller.mode.state) &&
            Binding.SingleSelect.mousePress(e) &&
            this._selectedObjects.size <= 1
        ) {
            this.deselectAll();
        }
    }
}
