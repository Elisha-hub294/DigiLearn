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

test("uriToBlob converts data URI and respects expectedMimeType", async () => {
  const { uriToBlob } =
    await import("../../src/components/library/add-item/utils.ts");

  const dataUri = "data:application/pdf;base64,JVBERi0xLjQK";
  const blob = await uriToBlob(dataUri, "application/pdf");

  assert.ok(blob instanceof Blob, "should create a Blob instance");
  assert.equal(blob.type, "application/pdf");
  assert.ok(blob.size > 0, "should contain decoded bytes");
});

test("uriToBlob throws if URI is empty", async () => {
  const { uriToBlob } =
    await import("../../src/components/library/add-item/utils.ts");

  await assert.rejects(
    async () => {
      await uriToBlob("");
    },
    { message: "File URI is required" },
  );
});
