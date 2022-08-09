export class Vector2 {
    static readonly origin = new Vector2(0, 0);

    constructor(readonly x?: number, readonly y?: number) {}

    public plus(other: Vector2): Vector2 {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    public minus(other: Vector2): Vector2 {
        return new Vector2(this.x - other.x, this.y - other.y);
    }

    public scale(scalar: number): Vector2 {
        return new Vector2(scalar * this.x, scalar * this.y);
    }

    /**
     * Rotates a 2D vector by `radians` clockwise around `around`.
     * @param radians Clockwise (in system where 0,0 is in top-left corner)
     *      radians for rotation.
     *      In normal coordinate system, this is considered counter-clockwise
     * @param around Origin of rotation
     */
    public rotate(radians: number, around: Vector2 = Vector2.origin): Vector2 {
        if (radians == 0) {
            return this;
        }

        // Move vector to the origin (relative to the rotation point)
        const x = this.x - around.x;
        const y = this.y - around.y;

        // Rotate
        const sin = Math.sin(radians);
        const cos = Math.cos(radians);

        let xNew = x * cos - y * sin;
        let yNew = x * sin + y * cos;

        // Move back where it was before
        xNew += around.x;
        yNew += around.y;

        return new Vector2(xNew, yNew);
    }

    public round(): Vector2 {
        return new Vector2(Math.round(this.x), Math.round(this.y));
    }

    public get euclideanNorm(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    public replacePartial(x?: number | Vector2, y?: number): Vector2 {
        if (x instanceof Vector2) {
            y = x.y;
            x = x.x;
        }

        return new Vector2(
            x === undefined || isNaN(x) ? this.x : x,
            y === undefined || isNaN(y) ? this.y : y,
        );
    }

    public equals(other: Vector2): boolean {
        return this.x === other.x && this.y === other.y;
    }

    public toString(): string {
        return `Vector2(${this.x},${this.y})`;
    }
}

export class BoundingBox {
    constructor(readonly position: Vector2, readonly size: Vector2) {}

    /**
     *
     * @param position Returns a BoundingBox with non-negative size.
     * @param size
     */
    public static normalized(position: Vector2, size: Vector2): BoundingBox {
        return new BoundingBox(
            new Vector2(
                position.x + (size.x < 0 ? size.x : 0),
                position.y + (size.y < 0 ? size.y : 0),
            ),
            new Vector2(Math.abs(size.x), Math.abs(size.y)),
        );
    }

    public round(): BoundingBox {
        return new BoundingBox(this.position.round(), this.size.round());
    }

    /**
     * Stretch (enlarge) a bounding box in all directions.
     * Negative values can be used to make it smaller
     * @param top
     * @param right
     * @param bottom
     * @param left
     */
    public stretch(
        top: number,
        right: number,
        bottom: number,
        left: number,
    ): BoundingBox {
        return new BoundingBox(
            new Vector2(this.position.x - left, this.position.y - top),
            new Vector2(this.size.x + left + right, this.size.y + top + bottom),
        );
    }

    public center(): Vector2 {
        return this.position.plus(this.size.scale(0.5));
    }

    public equals(other: BoundingBox): boolean {
        return (
            other !== undefined &&
            this.position.equals(other.position) &&
            this.size.equals(other.size)
        );
    }
}

export function rayInBoundingBox(
    rayPosition: Vector2,
    boundingBox: BoundingBox,
): boolean {
    const bottomRight = boundingBox.position.plus(boundingBox.size);

    return (
        boundingBox.position.x <= rayPosition.x &&
        boundingBox.position.y <= rayPosition.y &&
        bottomRight.x >= rayPosition.x &&
        bottomRight.y >= rayPosition.y
    );
}

export function doBoundingBoxesOverlap(
    a: BoundingBox,
    b: BoundingBox,
): boolean {
    const aRightBottom = a.position.plus(a.size);
    const bRightBottom = b.position.plus(b.size);

    const leftMax = Math.max(a.position.x, b.position.x);
    const rightMin = Math.min(aRightBottom.x, bRightBottom.x);

    const topMax = Math.max(a.position.y, b.position.y);
    const bottomMin = Math.min(aRightBottom.y, bRightBottom.y);

    return rightMin > leftMax && bottomMin > topMax;
}
