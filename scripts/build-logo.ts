import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
const SOURCE = process.argv[2] ?? path.join("public", "brand", "logo-source.webp");
const PROJECT = process.cwd();
const PUBLIC_DIR = path.join(PROJECT, "public");
const APP_DIR = path.join(PROJECT, "src", "app");
const DARK_THRESHOLD = 90;
const LIGHT_STROKE = { r: 0xea, g: 0xea, b: 0xef };
async function describe(file: string) {
    const image = sharp(file);
    const meta = await image.metadata();
    const { data, info } = await image
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    const buckets = new Map<string, number>();
    let opaque = 0;
    for (let i = 0; i < data.length; i += info.channels) {
        const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
        if (a < 24)
            continue;
        opaque += 1;
        const key = `${Math.round(r / 48) * 48},${Math.round(g / 48) * 48},${Math.round(b / 48) * 48}`;
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    const total = info.width * info.height;
    console.log(`  ${meta.width}x${meta.height}, alpha: ${meta.hasAlpha}`);
    console.log(`  opaque pixels: ${opaque} of ${total} (${((opaque / total) * 100).toFixed(1)}%)`);
    console.log("  dominant colours:");
    for (const [key, count] of [...buckets.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)) {
        console.log(`    rgb(${key.padEnd(13)})  ${((count / opaque) * 100).toFixed(1)}%`);
    }
    return info;
}
async function makeDarkVariant(file: string, out: string) {
    const { data, info } = await sharp(file)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    let touched = 0;
    for (let i = 0; i < data.length; i += info.channels) {
        if (data[i + 3] < 8)
            continue;
        const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
        const isNeutral = Math.max(r, g, b) - Math.min(r, g, b) < 40;
        if (isNeutral && Math.max(r, g, b) < DARK_THRESHOLD) {
            data[i] = LIGHT_STROKE.r;
            data[i + 1] = LIGHT_STROKE.g;
            data[i + 2] = LIGHT_STROKE.b;
            touched += 1;
        }
    }
    await sharp(data, {
        raw: { width: info.width, height: info.height, channels: info.channels },
    })
        .png({ compressionLevel: 9 })
        .toFile(out);
    console.log(`  recoloured ${touched} stroke pixels`);
}
async function makeIcon(file: string | Buffer, out: string, size: number, background?: string) {
    await sharp(file)
        .resize(size, size, {
        fit: "contain",
        background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    })
        .extend({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    })
        .png({ compressionLevel: 9 })
        .toFile(out);
}
async function main() {
    console.log(`\nSource: ${SOURCE}`);
    await describe(SOURCE);
    await mkdir(PUBLIC_DIR, { recursive: true });
    console.log("\nWriting assets");
    await sharp(SOURCE).png({ compressionLevel: 9 }).toFile(path.join(PUBLIC_DIR, "logo.png"));
    console.log("  public/logo.png");
    await makeDarkVariant(SOURCE, path.join(PUBLIC_DIR, "logo-dark.png"));
    console.log("  public/logo-dark.png");
    const padded = await sharp(SOURCE)
        .extend({
        top: 40,
        bottom: 40,
        left: 20,
        right: 20,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
        .png()
        .toBuffer();
    await makeIcon(padded, path.join(APP_DIR, "icon.png"), 512);
    console.log("  src/app/icon.png");
    await makeIcon(padded, path.join(APP_DIR, "apple-icon.png"), 180, "#ffffff");
    console.log("  src/app/apple-icon.png\n");
}
main().catch((error) => {
    console.error("Logo build failed:", error);
    process.exitCode = 1;
});
