import { Vector2 } from "@canvas/primitives/space";
import { expect } from "chai";

describe("Vector2", () => {
    it("should initialize", () => {
        const v = new Vector2(3, 4);
        expect(v.x).to.eq(3);
        expect(v.y).to.eq(4);
    });

    it("should add two vectors", () => {
        const u = new Vector2(0, 1);
        const v = new Vector2(3, 4);
        const w = new Vector2(-1, 2);

        vectorEquals(u.plus(v).plus(w), new Vector2(2, 7));
    });

    it("should subtract two vectors", () => {
        const u = new Vector2(-1, 0);
        const v = new Vector2(3, 4);
        const w = new Vector2(-1, 2);

        vectorEquals(u.minus(v).minus(w), new Vector2(-3, -6));
    });

    it("should scale", () => {
        const a = new Vector2(-1, 4).scale(0.5);
        expect(a.x).to.eq(-0.5);
        expect(a.y).to.eq(2);

        const b = new Vector2(3, 0).scale(-2);
        expect(b.x).to.eq(-6);
        expect(b.y).to.eq(0);

        const c = new Vector2(0, 3).scale(0);
        expect(c.x).to.eq(0);
        expect(c.y).to.eq(0);
    });

    it("should rotate", () => {
        const v = new Vector2(2, 3);
        const c = new Vector2(3, -2);

        // Around origin
        vectorEquals(v.rotate(0), v, "no rotation around origin");
        vectorEquals(
            v.rotate(0.5 * Math.PI),
            new Vector2(-3, 2),
            "quarter rotation around origin",
        );
        vectorEquals(
            v.rotate(Math.PI),
            new Vector2(-2, -3),
            "half rotation around origin",
        );
        vectorEquals(
            v.rotate(1.5 * Math.PI),
            new Vector2(3, -2),
            "three quarter rotation around origin",
        );
        vectorEquals(
            v.rotate(-0.5 * Math.PI),
            new Vector2(3, -2),
            "left quarter rotation around origin",
        );
        vectorEquals(v.rotate(2 * Math.PI), v, "full rotation around origin");
        vectorEquals(
            v.rotate(2 * Math.PI + 0.9),
            v.rotate(0.9),
            "full rotational offset around origin",
        );

        // Around c
        vectorEquals(v.rotate(0, c), v, "no rotation around c");
        vectorEquals(
            v.rotate(0.5 * Math.PI, c),
            new Vector2(-2, -3),
            "quarter rotation around c",
        );
        vectorEquals(
            v.rotate(Math.PI, c),
            new Vector2(4, -7),
            "half rotation around c",
        );
        vectorEquals(
            v.rotate(1.5 * Math.PI, c),
            new Vector2(8, -1),
            "three quarter rotation around c",
        );
        vectorEquals(
            v.rotate(-0.5 * Math.PI, c),
            new Vector2(8, -1),
            "left quarter rotation around c",
        );
        vectorEquals(v.rotate(2 * Math.PI, c), v, "full rotation around c");
        vectorEquals(
            v.rotate(2 * Math.PI + 0.9, c),
            v.rotate(0.9, c),
            "full rotational offset around c",
        );
    });

    it("should yield a unique string", () => {
        const v = new Vector2(3, 4);
        const w = new Vector2(-1, 2);

        expect(v.toString()).to.eq(v.toString());
        expect(w.toString()).to.eq(w.toString());
        expect(v.toString()).to.not.eq(w.toString());
    });

    it("should round", () => {
        vectorEquals(new Vector2(-0.7, 2.3).round(), new Vector2(-1, 2));
    });

    it("should compute norm", () => {
        expect(new Vector2(1, 1).euclideanNorm).to.eq(Math.sqrt(2));
        expect(new Vector2(3, -2).euclideanNorm).to.eq(Math.sqrt(13));
        expect(new Vector2(0, 0).euclideanNorm).to.eq(0);
    });

    it("should replace partial", () => {
        vectorEquals(
            new Vector2(-2, 3).replacePartial(new Vector2(5, undefined)),
            new Vector2(5, 3),
        );
        vectorEquals(
            new Vector2(-2, 3).replacePartial(undefined, -5),
            new Vector2(-2, -5),
        );
        vectorEquals(
            new Vector2(-2, 3).replacePartial(4, undefined),
            new Vector2(4, 3),
        );
        vectorEquals(
            new Vector2(-2, 3).replacePartial(3, 2),
            new Vector2(3, 2),
        );
        vectorEquals(
            new Vector2(-2, 3).replacePartial(undefined, undefined),
            new Vector2(-2, 3),
        );
    });
});

function vectorEquals(actual: Vector2, expected: Vector2, message = ""): void {
    const closeToMessage = `${message}: expected ${actual.toString()} to be close to ${expected.toString()}`;

    expect(actual.x).to.be.closeTo(expected.x, 10e-5, closeToMessage);
    expect(actual.y).to.be.closeTo(expected.y, 10e-5, closeToMessage);
}
