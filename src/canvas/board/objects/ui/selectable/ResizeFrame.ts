import { Group } from "canvas/board/objects/foundation/Group";
import type { SelectionOverlay } from "canvas/board/objects/ui/selectable/SelectionOverlay";

import {
    ResizeHandle,
    ResizeHandlePositioning,
    ResizeHandleStyle,
} from "./ResizeHandle";

export const allPositionings = [
    ResizeHandlePositioning.TopLeft,
    ResizeHandlePositioning.TopCenter,
    ResizeHandlePositioning.TopRight,
    ResizeHandlePositioning.MiddleRight,
    ResizeHandlePositioning.BottomRight,
    ResizeHandlePositioning.BottomCenter,
    ResizeHandlePositioning.BottomLeft,
    ResizeHandlePositioning.MiddleLeft,
];

export class ResizeFrame extends Group {
    constructor(
        readonly overlay: SelectionOverlay,
        handlePositionings: ResizeHandlePositioning[] = allPositionings,
        handleStyle: ResizeHandleStyle = new ResizeHandleStyle(),
    ) {
        super();
        this.children = createHandles(this, handlePositionings, handleStyle);
    }
}

function createHandles(
    frame: ResizeFrame,
    positionings: ResizeHandlePositioning[],
    handleStyle: ResizeHandleStyle,
): ResizeHandle[] {
    return positionings.map(
        positioning => new ResizeHandle(frame, positioning, handleStyle),
    );
}
