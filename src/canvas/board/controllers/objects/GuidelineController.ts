import type { Board, SpawnEvent } from "canvas/board/Board";
import { findSelectables } from "canvas/board/controllers/objects/SelectBoxController";
import { rotateBoundingBox } from "canvas/board/objects/foundation/RotateContainer";
import type { BoardItem } from "canvas/board/objects/items/BoardItem";
import { Guideline } from "canvas/board/objects/ui/Guideline";
import type { Subscription } from "canvas/primitives/events";
import { unsubscribeAll } from "canvas/primitives/events";
import type { Vector2 } from "canvas/primitives/space";
import type { Optional } from "canvas/primitives/types";
import { Viewport } from "canvas/render/Viewport";
import { debounce } from "canvas/utils/debounce";
import { DebugConfig } from "config/debug";
import {
    activateCenterGuides,
    showGuidelineDistance,
    standardMinGuideDistance,
} from "config/interaction";

enum GuideOrigin {
    // Higher number = higher priority (TopLeft > BottomRight > Center)
    Center = 0,
    BottomRight = 1,
    TopLeft = 2,
}

export class Guide {
    constructor(
        readonly vertical: boolean,
        readonly value: number,
        readonly origin: GuideOrigin,
    ) {}
}

export class GuidelineController {
    private guides: Guide[] = [];
    private guidelines: Guideline[] = [];

    private subscriptions: Subscription[] = [];

    constructor(private board: Board) {}

    public activate(): void {
        const debouncedOnChange = debounce(() => {
            this.onChange();
        }, 50);

        const onDeSpawn = (e: SpawnEvent) => {
            if (!("isGuideline" in e.target)) {
                debouncedOnChange();
            }
        };

        this.subscriptions.push(
            this.board.onSpawn.listen(undefined, onDeSpawn),
        );
        this.subscriptions.push(
            this.board.onDespawn.listen(undefined, onDeSpawn),
        );
        this.subscriptions.push(
            this.board.onChangeViewport.listen(undefined, e => {
                if (e.newViewport.zoomLevel !== e.oldViewport?.zoomLevel) {
                    debouncedOnChange();
                }
            }),
        );
        this.subscriptions.push(
            this.board.controller.move.onMove.listen(
                undefined,
                debouncedOnChange,
            ),
        );
        this.subscriptions.push(
            this.board.controller.resize.onResize.listen(
                undefined,
                debouncedOnChange,
            ),
        );
        this.subscriptions.push(
            this.board.controller.rotate.onRotate.listen(
                undefined,
                debouncedOnChange,
            ),
        );
    }

    public deactivate(): void {
        unsubscribeAll(this.subscriptions);
    }

    public getSnapGuide(
        worldPosition: Vector2,
        vertical: boolean,
    ): Optional<Guide> {
        const viewport = this.board.viewport;
        const posValue = vertical ? worldPosition.x : worldPosition.y;

        return this.guides
            .filter(guide => guide.vertical == vertical)
            .map(guide => ({
                guide: guide,
                distance: this.getViewDistance(viewport, posValue, guide.value),
            }))
            .filter(x => x.distance <= showGuidelineDistance)
            .min((a, b) => a.distance - b.distance)?.guide;
    }

    public showGuides(guides: Guide[]): void {
        const guidelines = guides.map(guide => new Guideline(guide));
        this.board.addObjects(guidelines);
        this.guidelines.push(...guidelines);
    }

    public clear(): void {
        this.board.removeObjects(this.guidelines);
        this.guidelines = [];
    }

    private getViewDistance(viewport: Viewport, a: number, b: number): number {
        return Math.abs(b - a) * viewport.zoomLevel;
    }

    private onChange(): void {
        const guides = this.getAllGuides();

        const vertical = guides.filter(guide => guide.vertical);
        const horizontal = guides.filter(guide => !guide.vertical);

        const viewMinGuideDistance =
            standardMinGuideDistance / this.board.viewport.zoomLevel;

        this.guides = [
            ...selectGuides(deduplicateGuides(vertical), viewMinGuideDistance),
            ...selectGuides(
                deduplicateGuides(horizontal),
                viewMinGuideDistance,
            ),
        ];

        if (DebugConfig.alwaysShowGuidelines) {
            this.showGuides(this.guides);
        }
    }

    private getAllGuides(): Guide[] {
        const guides: Guide[] = [];

        const boardItems = this.getBoardItems();
        const selected = this.board.controller.select.selectedObjects;

        for (const boardItem of boardItems) {
            if (boardItem.isFixed || selected.has(boardItem)) {
                continue;
            }

            const defaultBoundingBox = boardItem.boundingBox(Viewport.world);

            const bb = rotateBoundingBox(defaultBoundingBox, boardItem.radians);

            guides.push(new Guide(true, bb.position.x, GuideOrigin.TopLeft));
            if (activateCenterGuides) {
                guides.push(
                    new Guide(
                        true,
                        bb.position.x + bb.size.x / 2.0,
                        GuideOrigin.Center,
                    ),
                );
            }
            guides.push(
                new Guide(
                    true,
                    bb.position.x + bb.size.x,
                    GuideOrigin.BottomRight,
                ),
            );

            guides.push(new Guide(false, bb.position.y, GuideOrigin.TopLeft));
            if (activateCenterGuides) {
                guides.push(
                    new Guide(
                        false,
                        bb.position.y + bb.size.y / 2.0,
                        GuideOrigin.Center,
                    ),
                );
            }
            guides.push(
                new Guide(
                    false,
                    bb.position.y + bb.size.y,
                    GuideOrigin.BottomRight,
                ),
            );
        }

        return guides;
    }

    private getBoardItems(): BoardItem[] {
        return this.board.objects
            .map(object => {
                if ("isBoardItem" in object) {
                    return [<BoardItem>object];
                }

                const selectables = findSelectables(object);
                return selectables.map(selectable => selectable.content);
            })
            .flat();
    }
}

function selectGuides(
    deduplicated: [Guide[], number[]],
    minGuideDistance: number,
): Guide[] {
    const [unique, counts] = deduplicated;

    // Sort indices of all guides by importance
    const indices = unique.map((_, idx) => idx);
    indices.sort((aIdx, bIdx) => {
        const countDiff = counts[bIdx] - counts[aIdx];

        if (countDiff != 0) {
            return countDiff;
        }

        const a = unique[aIdx];
        const b = unique[bIdx];

        const originDiff = b.origin - a.origin;

        if (originDiff != 0) {
            return originDiff;
        }

        // TODO: distance of guide to selected objects, but not just as a third
        // layer if the other two have been equal, but rather as a weight for the count
        // Also: prioritise snap of middle boundary to a middle guide origin

        return 0;
    });

    const active = unique.map(() => true);

    // Go through indices from most to least important and deactivate
    // less important neighbors
    indices.forEach(idx => {
        if (!active[idx]) {
            // Object is already deactivated by a more important neighbor
            return;
        }

        deactivateNeighbors(unique, active, -1, minGuideDistance, idx);
        deactivateNeighbors(unique, active, 1, minGuideDistance, idx);
    });

    return unique.filter((_, idx) => active[idx]);
}

function deactivateNeighbors(
    guides: Guide[],
    active: boolean[],
    direction: 1 | -1,
    minGuideDistance: number,
    currIdx: number,
): void {
    const n = active.length;
    const curr = guides[currIdx];

    for (let i = currIdx + direction; i >= 0 && i < n; i += direction) {
        if (!active[i]) {
            return;
        }

        if (Math.abs(guides[i].value - curr.value) < minGuideDistance) {
            active[i] = false;
        } else {
            return;
        }
    }
}

function deduplicateGuides(guidelines: Guide[]): [Guide[], number[]] {
    const unique = new Map<number, Guide>();
    const counts = new Map<number, number>();

    for (const guideline of guidelines) {
        const value = guideline.value;
        const existing = unique.get(value);

        if (existing === undefined) {
            unique.set(value, guideline);
            counts.set(value, 1);
        } else {
            unique.set(value, selectGuideByPriority(existing, guideline));
            counts.set(value, counts.get(value) + 1);
        }
    }

    const sorted = [...unique.entries()]
        .sort((a, b) => a[1].value - b[1].value)
        .map(x => x[1]);
    const sortedCounts = sorted.map(guide => counts.get(guide.value));

    return [sorted, sortedCounts];
}

function selectGuideByPriority(one: Guide, other: Guide): Guide {
    if (one.origin - other.origin < 0) {
        return other;
    }
    return one;
}
