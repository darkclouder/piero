import {
    BoundingBox,
    doBoundingBoxesOverlap,
    Vector2,
} from "@canvas/primitives/space";
import { expect } from "chai";

describe("doBoundingBoxesOverlap", () => {
    it("should not overlap far away from each other", () => {
        const a = new BoundingBox(new Vector2(0, 0), new Vector2(10, 10));
        const b = new BoundingBox(new Vector2(15, 15), new Vector2(10, 10));

        expect(doBoundingBoxesOverlap(a, b)).to.be.false;
        expect(doBoundingBoxesOverlap(b, a)).to.be.false;
    });

    it("should not overlap next to each other", () => {
        const a = new BoundingBox(new Vector2(0, 0), new Vector2(10, 10));
        const b = new BoundingBox(new Vector2(15, 0), new Vector2(10, 10));

        expect(doBoundingBoxesOverlap(a, b)).to.be.false;
        expect(doBoundingBoxesOverlap(b, a)).to.be.false;
    });

    it("should not overlap below each other", () => {
        const a = new BoundingBox(new Vector2(0, 0), new Vector2(10, 10));
        const b = new BoundingBox(new Vector2(0, 15), new Vector2(10, 10));

        expect(doBoundingBoxesOverlap(a, b)).to.be.false;
        expect(doBoundingBoxesOverlap(b, a)).to.be.false;
    });

    it("should not overlap directly adjecent", () => {
        const a = new BoundingBox(new Vector2(0, 0), new Vector2(10, 10));
        const b = new BoundingBox(new Vector2(10, 10), new Vector2(10, 10));

        expect(doBoundingBoxesOverlap(a, b)).to.be.false;
        expect(doBoundingBoxesOverlap(b, a)).to.be.false;
    });

    it("should overlap with itself", () => {
        const a = new BoundingBox(new Vector2(0, 0), new Vector2(10, 10));

        expect(doBoundingBoxesOverlap(a, a)).to.be.true;
    });

    it("should overlap in top left", () => {
        const a = new BoundingBox(new Vector2(0, 0), new Vector2(10, 10));
        const b = new BoundingBox(new Vector2(5, 5), new Vector2(10, 10));

        expect(doBoundingBoxesOverlap(a, b)).to.be.true;
        expect(doBoundingBoxesOverlap(b, a)).to.be.true;
    });

    it("should overlap in top right", () => {
        const a = new BoundingBox(new Vector2(0, 0), new Vector2(10, 10));
        const b = new BoundingBox(new Vector2(-5, 5), new Vector2(10, 10));

        expect(doBoundingBoxesOverlap(a, b)).to.be.true;
        expect(doBoundingBoxesOverlap(b, a)).to.be.true;
    });

    it("should overlap inside", () => {
        const a = new BoundingBox(new Vector2(0, 0), new Vector2(10, 10));
        const b = new BoundingBox(new Vector2(2, 2), new Vector2(5, 5));

        expect(doBoundingBoxesOverlap(a, b)).to.be.true;
        expect(doBoundingBoxesOverlap(b, a)).to.be.true;
    });

    it("should overlap at edge", () => {
        const a = new BoundingBox(new Vector2(0, 0), new Vector2(10, 10));
        const b = new BoundingBox(new Vector2(-2, 2), new Vector2(5, 5));

        expect(doBoundingBoxesOverlap(a, b)).to.be.true;
        expect(doBoundingBoxesOverlap(b, a)).to.be.true;
    });

    it("should overlap if intersection contains no corners", () => {
        const a = new BoundingBox(new Vector2(0, 0), new Vector2(10, 10));
        const b = new BoundingBox(new Vector2(2, -2), new Vector2(5, 15));

        expect(doBoundingBoxesOverlap(a, b)).to.be.true;
        expect(doBoundingBoxesOverlap(b, a)).to.be.true;
    });
});
