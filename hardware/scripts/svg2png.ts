// bun scripts/svg2png.ts in.svg out.png [widthPx] — rasterise with resvg (shipped with tscircuit)
import { Resvg } from "@resvg/resvg-js"
const [, , inp, out, w] = process.argv
const opts: any = { font: { loadSystemFonts: true }, background: "white" }
if (w) opts.fitTo = { mode: "width", value: Number(w) }
await Bun.write(out, new Resvg(await Bun.file(inp).text(), opts).render().asPng())
