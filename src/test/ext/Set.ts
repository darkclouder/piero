import "@ext/Set";

import { expect } from "chai";

describe("Set", () => {
    it("should have an immutable view", () => {
        const set = new Set([3, 5, 7, 9]);
        const immutable = set.immutable();

        expect(immutable.has(5)).to.be.true;
        expect(immutable.has(6)).to.be.false;

        expect(immutable.size).to.eq(4);

        const items: number[] = [];

        immutable.forEach(val => {
            items.push(val);
        });

        expect(items).to.have.members([...set]);
        expect([...immutable]).to.eql([...set]);
    });
});
