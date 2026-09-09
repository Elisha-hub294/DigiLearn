const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const source = path.join(projectRoot, "googlef57853ec11bc9c03.html");
const hostingDirectory = path.join(projectRoot, "dist");
const destination = path.join(hostingDirectory, path.basename(source));

if (!fs.existsSync(source)) {
  throw new Error(`Google verification file is missing: ${source}`);
}

if (!fs.existsSync(hostingDirectory)) {
  throw new Error(
    "The dist directory is missing. Run `npx expo export --platform web` first.",
  );
}

fs.copyFileSync(source, destination);
console.log(`Copied ${path.basename(source)} to dist for Firebase Hosting.`);
