import { ZBuffer } from "@canvas/render/ZBuffer";
import { expect } from "chai";

describe("ZBuffer", () => {
    const n = 100;

    it("should have objects in insertion order", () => {
        const buffer = new ZBuffer<number>();
        const expected = [];

        for (let i = 0; i < n; ++i) {
            expected.push(i);
            buffer.add(i);
        }

        expect(buffer.sorted().map(object => buffer.getIndex(object))).is.eql(
            expected,
        );
        expect(buffer.sorted()).is.eql(expected);
    });

    it("should have objects in forced zindex order", () => {
        const buffer = new ZBuffer<number>();
        const expected = new Array(n);

        for (let i = 0; i < n; ++i) {
            expected[i] = n - i - 1;
            buffer.add(n - i - 1, i);
        }

        expect(buffer.sorted()).is.eql(expected);
    });

    it("should allow insertion in between", () => {
        const buffer = new ZBuffer<number>();
        const expected = [3, 0, 2, 1];

        buffer.add(0, 0);
        buffer.add(1, 1);
        buffer.add(2, 1);
        buffer.add(3, 0);

        expect(buffer.getIndex(3)).is.eq(0);
        expect(buffer.sorted()).is.eql(expected);
    });

    it("should have many insertions in the correct place", () => {
        const buffer = new ZBuffer<number>();

        // Buffer from 0 to 100
        for (let i = 0; i < n; ++i) {
            buffer.add(i);
        }

        // Now add 101, 102, 103 at 50
        buffer.addMany([101, 102, 103], 50);

        // Add empty
        buffer.addMany([]);

        expect(
            [101, 102, 103, 49, 50, 51].map(object => buffer.getIndex(object)),
        ).is.eql([50, 51, 52, 49, 53, 54]);
    });

    it("should keep order of remaining elements after remove", () => {
        const buffer = new ZBuffer<number>();

        buffer.add(0);
        buffer.add(1);
        buffer.add(2);
        buffer.add(3);
        buffer.add(4);

        buffer.removeMany([]);
        buffer.removeMany([1, 3]);
        buffer.add(5);

        expect(buffer.sorted()).is.eql([0, 2, 4, 5]);
        expect(buffer.sorted().map(object => buffer.getIndex(object))).is.eql([
            0,
            1,
            2,
            3,
        ]);
    });

    it("should move objects correctly", () => {
        const buffer = new ZBuffer<number>();

        for (let i = 0; i < 10; ++i) {
            buffer.add(i);
        }

        buffer.moveTo(8, 0);
        expect(buffer.sorted(), "Moved 0").is.eql([
            8,
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            9,
        ]);

        buffer.moveManyTo([7, 5, 6, 2], 2);

        expect(buffer.sorted(), "Moved 7, 5, 6, 2").is.eql([
            8,
            0,
            2,
            5,
            6,
            7,
            1,
            3,
            4,
            9,
        ]);
    });

    it("should throw when adding existing elements", () => {
        const buffer = new ZBuffer<number>();

        buffer.add(0);
        buffer.add(1);
        buffer.add(2);

        expect(buffer.add.bind(buffer, 0)).to.throw();
        expect(buffer.add.bind(buffer, 1)).to.throw();
        expect(buffer.add.bind(buffer, 2)).to.throw();
        expect(buffer.sorted()).is.eql([0, 1, 2]);
    });

    it("should throw when deleting non-existing elements", () => {
        const buffer = new ZBuffer<number>();

        buffer.add(0);
        buffer.add(1);
        buffer.add(2);

        expect(buffer.remove.bind(buffer, 3), "remove 3").to.throw();
        buffer.remove(2);
        expect(buffer.remove.bind(buffer, 2), "remove 2").to.throw();
    });
});
