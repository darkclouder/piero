import { lineWheelBoost, pageWheelBoost } from "@config/interaction";

export function getWheelBoost(e: WheelEvent): number {
    switch (e.deltaMode) {
        case WheelEvent.DOM_DELTA_LINE:
            return lineWheelBoost;
        case WheelEvent.DOM_DELTA_PAGE:
            return pageWheelBoost;
        default:
            return 1;
    }
}
