const test = require("node:test");
const assert = require("node:assert/strict");

test("base64ToBlob preserves PDF content and MIME type", async () => {
  const { base64ToBlob } =
    await import("../../src/components/library/add-item/utils.ts");

  const pdfBase64 = "JVBERi0xLjQK";
  const blob = base64ToBlob(pdfBase64, "application/pdf");

  assert.ok(blob instanceof Blob, "should create a Blob instance");
  assert.equal(blob.type, "application/pdf");
  assert.ok(blob.size > 0, "should contain the decoded PDF bytes");
});
