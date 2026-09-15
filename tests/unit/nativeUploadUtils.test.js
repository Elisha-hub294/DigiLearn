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

test("base64ToBlob gracefully falls back to Uint8Array when new Blob throws on native", async () => {
  const { base64ToBlob } =
    await import("../../src/components/library/add-item/utils.ts");

  const originalBlob = globalThis.Blob;
  // Simulate React Native's Blob constructor behavior
  globalThis.Blob = class MockRNBlob {
    constructor(parts) {
      for (const part of parts) {
        if (ArrayBuffer.isView(part) || part instanceof ArrayBuffer) {
          throw new Error(
            "Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported",
          );
        }
      }
    }
  };

  try {
    const pdfBase64 = "JVBERi0xLjQK";
    const result = base64ToBlob(pdfBase64, "application/pdf");

    assert.ok(result instanceof Uint8Array, "should return Uint8Array");
    assert.equal(result.type, "application/pdf");
    assert.ok(result.size > 0, "size property should match byte length");
  } finally {
    globalThis.Blob = originalBlob;
  }
});
