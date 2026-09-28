import test from "node:test";
import assert from "node:assert/strict";
import mapJson from "../../src/v4/index.js";

test("v3 maps a simple template and leaves both inputs unchanged", () => {
    const template = { name: "NAME", age: "AGE" };
    const source = { NAME: "Asha", AGE: 30 };
    const templateBefore = structuredClone(template);
    const sourceBefore = structuredClone(source);

    const k1 = {
        "tagName": "datalist",
        "attributes": {
            "id": "dl1"
        },
        "jsonToSpec": {
            "operation": "loopArray",
            "source": "data",
            "template": {
                "tagName": "option",
                "attributes": {
                    "value": "${}"
                },
                "textContent": "${}"
            }
        },
        "children": []
    };

    const k2 = {
        "datalist": "-------"
    };

    const k3 = [
        {
            "INVOICE_NUMBER": 1001,
            "TRANSACTION_DATE": "2026-09-24",
            "CUSTOMER_NAME": "Alpha Global Industries",
            "ALL_INVENTORY_ENTRIES_LIST": [
                {
                    "STOCK_ITEM_NAME": "Industrial Power Cable",
                    "UNIT_RATE": 120,
                    "TOTAL_AMOUNT": 6000,
                    "BATCH_ALLOCATIONS_LIST": [
                        {
                            "BATCH_ID": "LOT-901",
                            "ALLOCATED_QTY": 50
                        }
                    ]
                },
                {
                    "STOCK_ITEM_NAME": "Reinforced Mesh Roll",
                    "UNIT_RATE": 45.5,
                    "TOTAL_AMOUNT": 910,
                    "BATCH_ALLOCATIONS_LIST": [
                        {
                            "BATCH_ID": "LOT-330",
                            "ALLOCATED_QTY": 20
                        }
                    ]
                }
            ]
        }
    ];

    const k4 = {
        "invoice": "INVOICE_NUMBER",
        "date": "TRANSACTION_DATE",
        "client": "CUSTOMER_NAME",
        "lineItems": {
            "$from": "ALL_INVENTORY_ENTRIES_LIST",
            "product": "STOCK_ITEM_NAME",
            "rate": "UNIT_RATE",
            "total": "TOTAL_AMOUNT",
            "lots": {
                "$from": "BATCH_ALLOCATIONS_LIST",
                "lotId": "BATCH_ID",
                "allocated": "ALLOCATED_QTY"
            }
        }
    };

    const result = mapJson(k3, k4);
    console.log("result : ", result);
});
