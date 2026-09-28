import test from "node:test";
import assert from "node:assert/strict";
import mapV3, { mapJson, meta } from "../../src/v3/index.js";

test("v3 maps a simple template and leaves both inputs unchanged", () => {
    assert.equal(meta.version, "v3.0");
    assert.equal(typeof mapV3, "function");
    assert.equal(typeof mapJson, "function");

    const template = { name: "NAME", age: "AGE" };
    const source = { NAME: "Asha", AGE: 30 };
    const templateBefore = structuredClone(template);
    const sourceBefore = structuredClone(source);

    const result = mapJson(template, source);
    console.log("result : ", result);

    assert.deepEqual(result, { name: "Asha", age: 30 });
    assert.notStrictEqual(result, template);
    assert.deepEqual(template, templateBefore);
    assert.deepEqual(source, sourceBefore);
});
