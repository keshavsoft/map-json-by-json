import test from "node:test";
import assert from "node:assert/strict";
import { mapJson, meta } from "../src/index.js";
import mapV1, { mapJson as namedV1, meta as metaV1 } from "../src/v1/index.js";

test("dynamically loads v1 engine as latest", () => {
    assert.equal(meta.version, "v1.0");
    assert.equal(metaV1.version, "v1.0");
    assert.equal(typeof mapJson, "function");
    assert.equal(typeof mapV1, "function");
    assert.equal(typeof namedV1, "function");
});

test("extracts and maps flat fields based on template", () => {
    const template = {
        voucherNo: "VOUCHERNUMBER",
        type: "VOUCHERTYPENAME",
        date: "DATE"
    };

    const source = {
        VOUCHERNUMBER: 101,
        VOUCHERTYPENAME: "Sales",
        DATE: "20260401",
        EXTRA_IGNORE: "ignoreMe"
    };

    assert.deepEqual(mapJson(template, source), {
        voucherNo: 101,
        type: "Sales",
        date: "20260401"
    });
});

test("reshapes into nested target objects", () => {
    const template = {
        meta: {
            id: "ID",
            created: "DATE"
        },
        info: {
            name: "NAME"
        }
    };

    const source = {
        ID: 55,
        DATE: "2026-09-24",
        NAME: "Widget"
    };

    assert.deepEqual(mapJson(template, source), {
        meta: { id: 55, created: "2026-09-24" },
        info: { name: "Widget" }
    });
});

test("transforms nested arrays using $from", () => {
    const template = {
        invoiceNo: "VOUCHERNUMBER",
        items: {
            $from: "ALLINVENTORYENTRIES.LIST",
            itemName: "STOCKITEMNAME",
            amount: "AMOUNT"
        }
    };

    const source = {
        VOUCHERNUMBER: 1,
        "ALLINVENTORYENTRIES.LIST": [
            { STOCKITEMNAME: "Rope", AMOUNT: 200, EXTRA: "x" },
            { STOCKITEMNAME: "Net", AMOUNT: 500, EXTRA: "y" }
        ]
    };

    const expected = {
        invoiceNo: 1,
        items: [
            { itemName: "Rope", amount: 200 },
            { itemName: "Net", amount: 500 }
        ]
    };

    assert.deepEqual(mapJson(template, source), expected);
});

test("supports multi-level deep $from sub-collections (items -> batches)", () => {
    const template = {
        voucherNo: "VOUCHERNUMBER",
        items: {
            $from: "ALLINVENTORYENTRIES.LIST",
            itemName: "STOCKITEMNAME",
            batches: {
                $from: "BATCHALLOCATIONS.LIST",
                batchName: "BATCHNAME",
                qty: "ACTUALQTY"
            }
        }
    };

    const source = [
        {
            VOUCHERNUMBER: 1,
            "ALLINVENTORYENTRIES.LIST": [
                {
                    STOCKITEMNAME: "Shading Net",
                    "BATCHALLOCATIONS.LIST": [
                        { BATCHNAME: "B1", ACTUALQTY: 10, IGNORE: true },
                        { BATCHNAME: "B2", ACTUALQTY: 20, IGNORE: true }
                    ]
                }
            ]
        }
    ];

    const expected = [
        {
            voucherNo: 1,
            items: [
                {
                    itemName: "Shading Net",
                    batches: [
                        { batchName: "B1", qty: 10 },
                        { batchName: "B2", qty: 20 }
                    ]
                }
            ]
        }
    ];

    assert.deepEqual(mapJson(template, source), expected);
});

test("supports static $value and function transformers", () => {
    const template = {
        app: { $value: "KeshavSoft" },
        fullName: source => `${source.FIRST} ${source.LAST}`
    };

    const source = { FIRST: "John", LAST: "Doe" };
    assert.deepEqual(mapJson(template, source), {
        app: "KeshavSoft",
        fullName: "John Doe"
    });
});

test("supports object parameter convention { inTemplate, inSource }", () => {
    const inTemplate = { title: "NAME" };
    const inSource = { NAME: "Hello" };
    assert.deepEqual(mapJson({ inTemplate, inSource }), { title: "Hello" });
    assert.deepEqual(mapV1({ inTemplate, inSource }), { title: "Hello" });
});

test("safely handles null, undefined, and non-object inputs", () => {
    assert.equal(mapJson(null, { A: 1 }), undefined);
    assert.equal(mapJson({ A: "a" }, null), undefined);
    assert.equal(mapJson(undefined, { A: 1 }), undefined);
    assert.equal(mapJson({ A: "a" }, undefined), undefined);
    assert.deepEqual(mapJson({ A: "a" }, []), []);
});

test("registers on globalThis.ks", () => {
    assert.equal(typeof globalThis.ks, "object");
    assert.equal(typeof globalThis.ks.mapJson, "function");
    assert.equal(typeof globalThis.ks["map-json-by-json"], "object");
    assert.equal(globalThis.ks["map-json-by-json"].meta.version, "v1.0");

    const res = globalThis.ks.mapJson({ out: "in" }, { in: 123 });
    assert.deepEqual(res, { out: 123 });
});
