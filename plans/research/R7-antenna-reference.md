# R7 — 2.4 GHz antenna reference for a 14 mm-wide chip-down ESP32-S3 USB dongle

Research date: 2026-11-09. Researcher: R7 subagent (research only; nothing executed from downloads).
Method: primary documents downloaded with curl into one directory per file under
`scratchpad/r7/`, text extracted with macOS PDFKit (JXA script in `scratchpad/r7-scripts/`), drawing pages
rendered to PNG (`scratchpad/r7-render/`) and read by eye. Distributor stock/price came from the LCSC product API
(`wmsc.lcsc.com/ftps/wm/product/detail?productCode=…`) and the JLCPCB parts-search API, both queried 2026-11-09.
Quotes are verbatim. "As printed" means I copied a value that looks odd without correcting it.
Anything I could not confirm from a primary source is marked **UNVERIFIED**. Conflicts are marked **CONFLICT**.

Design context: PCB width ≤ 14 mm. USB-A plug at one end, USB-C plug at the other. Whichever end is in the host,
the other end sticks out. Plastic case, 4-layer board likely, JLCPCB assembly.

---------------------------------------------------------------------------------------------------

## 1. Espressif chip-down RF guidance (ESP32-S3 Hardware Design Guidelines)

Source: *ESP32-S3 Hardware Design Guidelines* (HTML, "latest"). Revision History page: latest entry **v1.8, 2025-07-03**
("Section RF: Updated Figure ESP32-S3 PCB Stack-up Design; added Figure ESP32-S3 IPEX Antenna Connector Layout";
"Section RF Circuit: Updated Figure ESP32-S3 Schematic for RF Matching"). Footer: © 2023–2026; source commit 05b77be.
- Schematic Checklist > RF: https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32s3/schematic-checklist.html
- PCB Layout Design > RF and module placement: https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32s3/pcb-layout-design.html
- Revision history: https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32s3/revision-history.html

### 1.1 RF circuit (Schematic Checklist > RF > RF Circuit)
- "For the RF traces on the PCB board, 50 Ω impedance control is required."
- "For the chip matching circuit, it must be placed close to the chip. A CLC structure is preferred."
- "The CLC structure is mainly used to adjust the impedance point and suppress harmonics."
- "For the antenna and the antenna matching circuit, to ensure radiation performance, the antenna's characteristic
  impedance must be around 50 Ω. Adding a CLC matching circuit near the antenna is recommended to adjust the antenna.
  However, if the available space is limited and the antenna impedance point can be guaranteed to be 50 Ω by
  simulation, then there is no need to add a matching circuit near the antenna."
- "It is recommended to include ESD protection devices for the antenna to mitigate electrostatic interference."
- Figure "ESP32-S3 Schematic for RF Matching" (read from image): ANT1 → [C22 shunt TBD, D2 ESD (NC)] → L5 series TBD →
  C23 shunt TBD = "(matching of antenna)"; then C11 shunt TBD → L2 series TBD → C12 shunt TBD at LNA_IN = "(matching of chip)".
  Notes in the figure: "RF traces: Single-ended 50ohm." "The values of L5, C22, C23, C11, L2 and C12 vary with the
  actual PCB board." "Add a stub to the ground pad." (pointing at C12, the shunt cap nearest the chip).
- Note: "if RF function is enabled, make sure an antenna is connected. Operation without an antenna may result in
  unstable behavior or potential damage to the RF circuit."

### 1.2 RF tuning (Schematic Checklist > RF > RF Tuning)
- "The RF matching parameters vary with the board, so the ones used in Espressif modules could not be applied directly."
- "If S11 is close to the chip conjugate point 35+j0 and S21 is less than -35 dB at 4.8 GHz and 7.2 GHz, the matching
  circuit can satisfy transmission requirements."
- Table "Recommended Value Ranges for Components" (applies only if the PCB "strictly follows" the guide's layout):
  C11 "1.2 ~ 1.8 pF" (GRM0335C1H1RXBA01D); L2 "2.0 ~ 3.0 nH" (LQP03TN2NXB02D); C12 "1.8 ~ 1.2 pF" (as printed — range
  written high-to-low; GRM0335C1H1RXBA01D).
- "Please use 0201 packages for RF matching components and add a stub to the first capacitor in the matching circuit at
  the chip end."

### 1.3 PCB stack-up and RF layout (PCB Layout Design)
- Four-layer recommendation: "Layer 1 (TOP): Signal traces and components." "Layer 2 (GND): No signal traces here to
  ensure a complete GND plane." "Layer 3 (POWER): GND plane should be applied to better isolate the RF and crystal …
  provided that there is a complete GND plane under the RF and crystal." "Layer 4 (BOTTOM): Route a few signal traces
  here. It is not recommended to place any components on this layer."
- "The RF trace should have a 50 Ω characteristic impedance. The reference plane is the layer next to the chip."
- Stack-up figure (read from image): 50 Ω coplanar line "Gap 12.2 mil / Width 12.6 mil / Gap 12.2 mil";
  L1 finished copper 1 oz (base 0.33 oz), L1–L2 prepreg "7628 TG150 RC50%" 8.22 mil, Dk 4.6; core "Adjustable";
  L3–L4 prepreg 8.22 mil; solder mask 0.4 mil, Dk 4. (JLCPCB stack compatibility: not checked here — UNVERIFIED.)
- "A CLC matching circuit is required for chip tuning. Please use 0201 components and place them close to the pin in a
  zigzag. In other words, the two capacitors should not be oriented in the same direction to minimize interference."
- "Add a stub on the ground pad of the grounding capacitor near the chip side … It is preferable to keep the stub length
  15 mil, and determine the stub width according to the PCB stack-up so that the characteristic impedance of the stub is
  100 Ω ± 10%. The reference plane is the third layer, so the area under the trace on the second layer should be
  cleared. … Note that a stub is not required for package types of 0402 and above."
- "For PCB antennas, make sure to validate them through both simulation and real-world testing on a development board.
  It is recommended to include an additional CLC matching circuit for antenna tuning. Place this circuit as close to the
  antenna as possible."
- "The RF trace should have a consistent width and not branch out. It should be as short as possible with dense ground
  vias around for interference shielding."
- "The RF trace should be routed on the outer layer without vias, i.e., should not cross layers. The RF trace should be
  routed at a 135° angle, or with circular arcs if trace bends are required."
- "The ground plane on the adjacent layer needs to be complete. Do not route any traces under the RF trace whenever possible."
- "The RF antenna should be placed away from high-frequency components, such as crystals, DDR SDRAM, high-frequency
  clocks, etc. In addition, the USB port, USB-to-serial chip, UART signal lines (including traces, vias, test points,
  header pins, etc.) must be as far away from the antenna as possible."
- "It is recommended to keep all layers clear under the IPEX antenna connector."
- Troubleshooting section: "Match the antenna's impedance with the π-type circuit on the RF trace …"

### 1.4 Antenna placement / keep-out (module section of PCB Layout Design — the only placement figure Espressif gives)
- "It is suggested to place the module's on-board PCB antenna outside the base board, and the feed point of the antenna
  close to the edge of the base board."
- "If the antenna cannot extend beyond the board edge, the feed point should still be placed as close to the board edge
  as possible. Then cut off the base board on both sides of the antenna and below it … Note that the module should not
  be placed in the center of the board with clearance created by hollowing out on all four sides."
- Figure "Keepout Zone for ESP32-S3 Module's Antenna (Antenna feed point on the right)" (read from image, mm):
  clearance area extends "Min15" beyond the antenna end on the open side, antenna strip height "6", "Max 2" and
  "Max 1" offsets at the feed-side edge.
- "A clearance of at least 15 mm is recommended in all directions." (antenna inside the product housing)
- "Please note that the final end product should be tested for throughput and communication range to ensure RF performance."
- Espressif gives **no chip-antenna-specific keep-out**; the chip-antenna keep-out must come from the antenna maker.

---------------------------------------------------------------------------------------------------

## 2. Espressif module / SiP / chip outlines

| Part | Size (mm) | Source (version/date) | Notes |
|---|---|---|---|
| ESP32-S3 chip | QFN56 7×7 | ESP32-S3 Series Datasheet v2.2, Fig. 7-1 "QFN56 (7×7 mm) Package" (text from a copy downloaded by sibling task R1; URL https://www.espressif.com/sites/default/files/documentation/esp32-s3_datasheet_en.pdf) | |
| ESP32-S3-MINI-1 (-N8, -N4R2) | 15.4 × 20.5 × 2.4 (Table 1-1); Fig 10-1: 15.4±0.2 × 20.5±0.2, thickness 2.4±0.15; PCB-antenna strip 5.05 deep across full 15.4 width | ESP32-S3-MINI-1 & MINI-1U Datasheet **v1.7, 2026-03-02**; https://www.espressif.com/sites/default/files/documentation/esp32-s3-mini-1_mini-1u_datasheet_en.pdf | MINI-1U: 15.4 × 15.4 × 2.4 |
| ESP32-S3-WROOM-1 | 18.0 × 25.5 × 3.1 | ESP32-S3-WROOM-1 & WROOM-1U Datasheet **v1.8, 2026-03-02**, Table 1-1; https://www.espressif.com/sites/default/files/documentation/esp32-s3-wroom-1_wroom-1u_datasheet_en.pdf | WROOM-1U: 18.0 × 19.2 × 3.2 |
| ESP32-S3-PICO-1 | LGA56 7×7: D, E = 6.900/7.000/7.100; A = 0.860/0.960/1.060 (min/nom/max) | ESP32-S3-PICO-1 Series Datasheet **v1.2, 2026-07-09**, Fig. 6-1 "LGA56 (7×7 mm) Package"; https://www.espressif.com/sites/default/files/documentation/esp32-s3-pico-1_datasheet_en.pdf | No antenna in package |

ESP32-S3-PICO-1 variants (Table 1-1, v1.2):
- "ESP32-S3-PICO-1-N8R2 8 MB (Quad SPI) 2 MB (Quad SPI) –40∼ 85 3.3 V"
- "ESP32-S3-PICO-1-N8R8 8 MB (Quad SPI) 8 MB (Octal SPI) –40∼ 65 3.3 V"; note: "if the PSRAM ECC function is enabled,
  the maximum ambient temperature can be improved to 85 °C, while the usable size of PSRAM will be reduced by 1/16."
- Overview: integrates "a crystal oscillator, decoupling capacitors, SPI flash/PSRAM, and RF matching links".
- Pin 1 "LNA_IN … Low Noise Amplifier (RF LNA) input and output signal".
- Peripheral schematic (p.29, read from image): ANT1 → C11 (TBD) → L2 (TBD) → C12 (TBD) → LNA_IN, "50 ohm Impedance
  Control" — i.e. Espressif still shows an external CLC for antenna matching with the SiP.
- Espressif certificates listing (https://www.espressif.com/en/support/documents/certificates, viewed 2026-11-09):
  no ESP32-S3-PICO-1 entry in the visible part of the list (page was partial) — **UNVERIFIED** that none exists.
- JLCPCB stock 2026-11-09: ESP32-S3-PICO-1-N8R2 C7558093 = 1 pc; -N8R8 C7545129 = 0.

Conclusion: no Espressif module with an integrated antenna is ≤ 14 mm wide (MINI-1 is 15.4 mm; its antenna strip alone is 15.4 mm).

---------------------------------------------------------------------------------------------------

## 3. 2.4 GHz chip antennas

### 3.1 Summary table (all numbers from the manufacturer documents named in 3.2)

Mounting style matters most. **Corner** and **board-end** parts need a board end or corner, which this dongle does not have
(both ends carry plugs). **Center-of-long-edge** parts can sit at mid-length.

| Part | Size L×W×T (mm) | Mount style (maker) | Keep-out (maker) | Eval board | Eff. / peak gain (eval) | Eval matching | LCSC / JLCPCB stock 2026-11-09 |
|---|---|---|---|---|---|---|---|
| Johanson 2450AT18D0100001E | 3.20×1.60×1.20, 4 pads | "Center-edge mount, circular PCB, or thin edge" | 4×6 ("No GND on all layers"); thin-edge ref: 8×3.4 | 40×20 | 72 % / 1.5 dBi (avg −1.0 dBi) | none ("N/A", 0 Ω); leave π slots | C7450310: 95 (LCSC & JLC). AEC-Q200 twin 2450AT18D0100002E C17410360: LCSC 858, JLC 903, ≈$0.99 |
| Pulse W3008 | 3.2×1.6×1.1 | mid long edge (eval drawing) | 4×4.25 | 80×37 | 66 % / 1.1 dBi | "No matching component used" | C581402: 2,176 (LCSC $0.766 @1; JLC $0.903 @1). W3008C C581403: 9,151 (datasheet not read) |
| Pulse (Yageo) ANT2012LL13R2400A | 2.00×1.25×1.00 | center of long edge (eval drawing) | 3.00×5.00 | 90×50 | 76.56 % / 2.72 dBi | "Matching Circuit" (values not given) | Pulse-brand C19192917: 3,910 ($0.367 @1). Yageo-brand C141581: 0 |
| Kyocera-AVX 1001312 | 2.00×1.20×0.55 | long edge (demo-board drawing) | bottom-metal cut ≈12.4×2.0 (read from drawing) | 55×25 | 62 % / 1.88 dBi | P1 4.7 nH shunt, S1 0 Ω, R1 0 Ω, others DNI | C5348180: 0 |
| Taoglas WLA.04 | 1.6×0.8×0.4 | "mid-point on the long side" | 3 × 4.7 (all layers) | 90×50 | 60.5 % / 0.50 dBi | C1 0.4 pF, C2 0.5 pF, C3 NF (π) | not found at JLCPCB |
| Ignion NN02-101 (NANO mXTEND) | 3.0×2.0×0.8 | corner or center edge | 5×5 | 80×40×1 | edge >65 % / 2.4 dBi; corner >55 % / 2.4 dBi | values not in text (Z1–Z4 slots) — UNVERIFIED | C5702650: 0 |
| Yageo ANT1608LL14R2400A | 1.6×0.8×0.4 | Sc.1: mid long edge; Sc.2: corner of short end | Sc.2: 6×2.5 | Sc.1 50×20; **Sc.2 10×50** | Sc.1 61.88 % / 2.03 dBi; Sc.2 60.64 % / 3.38 dBi | "Matching Tuning" + "Frequency Tuning" pads | C723550: 0 |
| Johanson 2450AT18A0100001E | 3.20×1.60×1.30 | "Corner mount" | 6.5×6.5 corner | 46×20 | 74 % / 1.5 dBi | tee: 1.0 pF, 3.9 nH series; 2.7 nH shunt | C17430588: JLC 105. Legacy 2450AT18A100E C89334: 0 |
| Johanson 2450AT18B0100001E | 3.20×1.60×1.30 | "Corner mount" | 6.5×6.5 corner | 46×20 | 75 % / 1.5 dBi | tee: 1.2 pF, 3.3 nH series; 2.7 nH shunt | C6055600: 0; legacy 2450AT18B100E C2917717: 0 |
| Johanson 2450AT42B0100001E | 5.00×2.00×(1.1 or 2.0 — CONFLICT) | "Corner mount" | 3.86×8 corner | 40×20 | 55 % / 1.2 dBi | 3.3 nH, 1.5 nH (π slots) | C6163194: 0; legacy 2450AT42B100E C3284144: 2 |
| Abracon PRO-OB-440 | 13.75×5.23×3.53 | "along one side … pin 1 … close as possible to the layout corner"; on-ground | no ground cut-out under antenna; clearance only round NC and feed pads | 100×50 | 65 % / 4.9 dBi | π (C1, C2, C3, 0402) | C5122736: LCSC 2,232 ($0.684 @1) |
| Rainsun AN9520-245 | 9.5×2.1×1.0 | board end | test board: 35×20 no-ground end region | 35×60 | — / 1.5 dBi | — | C99665: LCSC 53,885 / JLC 57,650 |
| Rainsun AN3216-245 | 3.2×1.6×1.3 | board end | test board: 35×10 no-ground strip | 35×50 | — / 0.5 dBi | — | C2916136: 0 |
| Rainsun AN2051-245 | 5.1×2.0×1.2 | not given (one-page sheet) | not given | not given | — / 0.5 dBi | — | C99727: LCSC 41,408 / JLC 42,019 |
| Yageo ANT3216LL00R2400A | 3.20×1.60×1.20 | board end | 10 mm full-width no-ground end | 40×18 | 70.74 % / 5.05 dBi | "Matching Circuit" | C293767: LCSC 13,060 / JLC 34,690, ≈$0.19 |
| Walsin RFANT3216120A5T | 3.2×1.6×1.2 | (drawing not read in detail) | "Empty Area 6x6 mm" | 45×20 | — / 2 dBi | series 6.8 nH (unmatched Fc 2.9 GHz) | C127629: ≈13,630, ≈$0.13 |
| ACX AT3216-A2R4PAAT/LF | 3.2×1.6×1.2 | datasheet not read | — | — | — / 1.5 dBi (LCSC param) | — | C390915: 0 |
| Walsin RFANT5220110A0T | 5.2×2.0×1.15 (JLC param) | datasheet not read — UNVERIFIED | — | — | — / 2 dBi (JLC param) | — | C127611: JLC 25,207, $0.259 |

### 3.2 Per-part sources and verbatim key quotes

**Johanson 2450AT18D0100001E** — Datasheet Doc# 36S0021A, **Revision 5.0** (PDF created 2024-04-02);
https://johansontechnology.com/docs/3791/Antenna-2450AT18D0100001E-Rev5.0.pdf
- p1: "Center-edge mount, circular PCB, or thin edge"; "Return Loss (dB) 6 Min."; "Peak Gain (dBi) 1.5 Typ.";
  "Average Gain (dBi) -1.0 Typ."; "Average Radiated Efficiency (%) 72"; "measured on Johanson's evaluation board P/N 2450AT18D0100001CE1".
- p2: L 3.20±0.20, W 1.60±0.20, T 1.20±0.20 mm; pins 1–4 Feed/GND, "(Can be swapped)".
- p3 (drawing): eval board 40 × 20 mm; antenna at the middle of a long edge; yellow clearance "No GND on all layers"
  1+2+1 = 4 mm along the edge × 0.6+0.7+0.6+4.1 = "6" mm deep; matching shown as "0 Ohm"; "JTI P/N's for Matching Network N/A";
  "leave available slots for a "pi" (or shunt-series-shunt) network".
- p4: return loss markers −13.935 dB @2.400 GHz, −24.894 dB @2.450 GHz, −14.774 dB @2.500 GHz.
- p5: "Other Mounting Configurations – for reference purpose only (no evaluation boards available)"; "Small Clearance or
  "Thin edge" Applications": clearance 8 mm along edge × 3.4 mm deep, with an "L/C**" part at the far end;
  "**Note2: L/C component is added to adjust the initial frequency for antenna tuning."
- AEC-Q200 twin: product page https://www.johansontechnology.com/products/antennas/rf-antennas/2450at18d0100002e/ —
  "2.4GHz small antenna for automotive applications, AEC-Q200 qualified"; "Legacy Part Number: 2450AT18D0100E-AEC";
  "Product Lifecycle Status PROD"; page lists Return Loss 10 (vs 6 min in the 0100001E sheet — different sheet, not a
  direct conflict).

**Johanson 2450AT18A0100001E** (legacy 2450AT18A100) — Doc# 36S0021A **Rev 4.0** (PDF 2024-07-01);
https://www.johansontechnology.com/docs/3827/Antenna-2450AT18A0100001E-Rev4.0.pdf
- p1: "Corner mount"; "Return Loss (dB) 9.5 Min."; "Peak Gain (dBi) 1.5 Typ."; "Average Gain (dBi) 0.0 Typ.";
  "Average Radiated Efficiency (%) 74"; "Recommended mounting locations for this antenna — PCB Corner".
- p2: L 3.20±0.20, W 1.60±0.20, T 1.30 +0.10/−0.20, a 0.50±0.30 mm; pin 1 Feed, pin 2 NC (must be soldered).
- p3 drawing: board 39.5+6.5 = 46 × 13.5+6.5 = 20 mm; corner "Ground Clearance" 6.5 × 6.5 mm; matching 1.0 pF and 3.9 nH
  in series, 2.7 nH shunt (as labelled); "leave available slots for a "tee" (or series-shunt-series) network".
- **CONFLICT**: LCSC C89334 lists "Peak Gain 0.5dBi" for 2450AT18A100E; Johanson Rev 4.0 says 1.5 dBi typ. Use Johanson.

**Johanson 2450AT18B0100001E** (legacy 2450AT18B100) — **Rev 5.0** (PDF 2024-07-09);
https://www.johansontechnology.com/docs/3829/Antenna-2450AT18B0100001E-Rev5.0_uMmswfC.pdf
- "Corner mount"; return loss 9.5 dB min; peak 1.5 dBi; average gain 0.0 dBi; efficiency "75"; same eval layout as 18A
  (46 × 20 mm board, 6.5 × 6.5 mm corner clearance); matching 1.2 pF, 2.7 nH, 3.3 nH (tee). Product page lifecycle "PROD".
- LCSC C2917717 also lists 0.5 dBi (same distributor-vs-maker conflict).

**Johanson 2450AT42B0100001E** (legacy 2450AT42B100) — **Rev 4.0** (PDF 2024-04-17);
https://www.johansontechnology.com/docs/3793/antenna-2450AT42B0100001E-rev4.0.pdf
- p1: "SMD, 5.0x2.0x1.1mm (LxWxT)"; "Corner mount"; return loss 9.5 dB min; peak 1.2 dBi; average −0.6 dBi; efficiency 55 %.
- p2 table: L 5.00±0.20, W 2.00±0.20, **T 2.00 +0.1/−0.2** mm → **CONFLICT** with p1's 1.1 mm (Farnell also lists 5×2×2 mm).
- p3: eval 40 × 20 mm; corner clearance 3.86 × 8 mm with the antenna running along the short edge; 3.3 nH and 1.5 nH; π slots.

**Pulse W3008** — "TECHNICAL DATA SHEET", **Issue: 1823** (PDF 2018–2019; LCSC-hosted copy for C581402:
https://datasheet.lcsc.com/datasheet/pdf/2c439e2bc396fb6144b9d5d07bfbf796.pdf?productCode=C581402).
Pulse's own product finder (productfinder.pulseelectronics.com) refused the connection, so I could not check whether a
newer issue exists — **UNVERIFIED** (secondary sites mention later issues).
- "2.4-2.4835GHz Ceramic SMT antenna, 4x4.25mm keep out area"; "Size: 3.2 x 1.6 x 1.1mm"; "Efficiency: 66 %"; "Gain: 1.1 dBi".
- "(*) All RF parameters measured on 80*37mm PCB with 4*4.25mm clearance in free space. No matching component used."
- "Ground cleared under antenna, clearance area 4 mm x 4.25mm"; drawing shows "Matching Component (optional shunt)".
- p7: "test board outline size 80 x 37mm", antenna on the long edge 40.51 mm from one end (i.e. mid-edge).
- "Return Loss -4dB" (as printed; the chart shows a "Return Loss Spec" line).

**Pulse ANT2012LL13R2400A** — "TECHNICAL DATA SHEET", revision history "Version 2 April. 6, 2021" (LCSC-hosted copy for
C19192917; same LCSC datasheet path pattern).
- "Size : 2.00x1.25x1.00 mm"; "Peak Gain 2.72 dBi (Typ.)"; "The specification is defined on Pulse evaluation board".
- p3 drawing: eval board 90.0 × 50.0 mm, antenna at the middle of a long edge; clearance 3.00 mm along edge × 5.00 mm deep.
- "Max gain = 2.72dBi"; "Efficiency = -1.16dB, 76.56%".

**Kyocera-AVX 1001312** — Datasheet TDS-ANT-0080 **Rev 2**, dated 8/16/2024 (Kyocera-AVX document; copy hosted by Farnell:
https://farnell.com/datasheets/4437481.pdf; https://datasheets.kyocera-avx.com/1001312.pdf returned 404).
- "Size (mm) 2.00 x 1.20 x 0.55"; "Peak Gain 1.88 dBi"; "Average Efficiency 62%"; "VSWR Match 1.8:1 max";
  "Typical performance on 55 x 25 mm PCB".
- Matching (demo board): "P1 4.7nH ±0.1nH, P2 DNI, S1 0Ω, R1 0Ω, R2–R8 DNI"; "*Actual matching values depend on customer
  design"; "*0Ω may be added to shift frequency higher".
- "Additional VIAS : Diam. 0.2mm to be placed around antenna, (no vias on transmission lines)."
- p4 bottom-metal drawing (read from image): cut-out spans x = −6.10 … +6.30 mm and y = 0 … 2.00 mm → ≈12.4 × 2.0 mm.
  p5: demo board A 55.0 × B 25.0 mm, antenna on the long edge at C = 26.0 mm.

**Taoglas WLA.04** — SPE-23-8-135-**D**, changelog "Revision: D (Current Version) Date: 2025-01-29";
https://www.taoglas.com/datasheets/WLA.04.pdf
- "Dimensions: 1.6*0.8*0.4mm"; table: Efficiency 60.5 %, Average Gain −2.18 dB, Peak Gain 0.50 dBi, VSWR ≤2.0;
  "*Tested on a 90x50mm Evaluation Board".
- "It is designed to be utilized on devices with small ground planes".
- "Taoglas recommends using a minimum of 90x50mm ground plane (PCB) to ensure optimal performance. Smaller ground planes
  can be use with a trade off on performance." (as printed)
- "The antenna should be placed mid-point on the long side of the PCB to take advantage of the ground plane on each side
  of the antenna."
- "The copper keep out area applies to all layers on the PCB. The copper clearance area extends to 4.7mm in length and
  3mm in width around the antenna. The PCB edge clearance should be a minimum of 0.1mm, example below is 0.5mm."
  (drawing: 3.00 along edge, 4.70 deep).
- Matching: "C1 Capacitor 0.4pF … GRM1555C1HR40CA01D", "C2 Capacitor 0.5pF … GRM1555C1HR50CA01D", "C3 Not Fitted"; π recommended.

**Ignion NN02-101 NANO mXTEND** — User Manual, "Last Update: December 2025" (PDF created 2025-12-16);
https://ignion.io/files/UM_NN02-101.pdf
- "Smallest clearance: 5mm x 5mm."; "3.0 mm x 2.0 mm x 0.8 mm"; "Can be mounted either on the device corner or on the center edge."
- Corner: "Average Efficiency >55 %", "Peak Gain 2.4 dBi", "VSWR < 2.5:1"; edge: "Average Efficiency >65 %",
  "Peak Gain 2.4 dBi", "VSWR < 3.0:1"; both "on evaluation board (80 mm x 40 mm x 1 mm)".
- "Other ground plane sizes and clearances can be implemented by adapting the matching network."
- Matching values: not in the extracted text (component slots Z1–Z4 on the drawing) — UNVERIFIED.

**Yageo ANT1608LL14R2400A** — Product Specification **V.1, Feb 14 2017** (LCSC-hosted copy for C723550).
- 1.6±0.15 × 0.8±0.15 × 0.4 max mm; "Peak Gain 2.0 dBi(Typ.)"; "VSWR 6.0 dB Max" (as printed).
- Scenario 1: board 50 × 20 mm, antenna at the middle of a long edge: "Max Gain = 2.03dBi", "Efficiency = -2.08dB, 61.88%".
- Scenario 2: board **10 mm × 50 mm**, antenna at a corner of a short end: "Clearance size : 6 * 2.5 mm";
  "Max Gain = 3.38dBi", "Efficiency = -2.17dB, 60.64%".
- This is the only maker data found for a 10 mm-wide ground plane — but the antenna sits at the board end, which this dongle does not have.

**Yageo ANT3216LL00R2400A** — Product Specification **V.0, Mar 27 2013** (LCSC-hosted copy for C293767).
- 3.20 × 1.60 × 1.20 mm; "Peak Gain 5.05 dBi (Typ.)"; "Efficiency = -1.50dB, 70.74%"; "Directivity (dB) = 7.15".
- Eval: 30 mm ground + 10 mm full-width no-ground end region, 18 mm wide (40 × 18 board); antenna 2.0 mm from the ground edge. Board-end only.

**Rainsun AN9520-245** — Ver.2.3, Aug 2009 (LCSC-hosted, C99665): 9.50 × 2.10 × 1.00 mm; peak 1.5 dBi; VSWR 2.0 max;
bandwidth 200 MHz; test board 35 × 60 mm with 35 × 40 mm ground and a 20 mm no-ground end region.
**Rainsun AN3216-245** — Ver1.0, May 2016 (LCSC-hosted, C2916136): 3.2 × 1.6 × 1.3 mm; peak 0.5 dBi; VSWR 2.5 max;
test board 35 × 50 mm, 10 mm no-ground end strip.
**Rainsun AN2051-245** — one-page sheet dated Jun 2006 (LCSC-hosted, C99727): 5.1 × 2.0 × 1.2 mm, 0.5 dBi, 110 MHz,
VSWR 2.0 max; no layout or keep-out given → **UNVERIFIED** keep-out.
(A web-search summary claimed a Rainsun AN3216 "Ver 3.0, 2012" sheet with "minimum clearance of 3mm" in an FCC
filing. I did not open it → **UNVERIFIED**; the version numbering conflicts with the LCSC copy, Ver1.0 2016.)

**Walsin RFANT3216120A5T** — "ASC_RFANT3216120A5T_V05 Apr. 2010" (LCSC-hosted, C127629): 3.20 × 1.60 × 1.20 mm;
"Fc (GHz) 2.9"; "Gain (dBi) 2 (Typical)"; "VSWR 2 max."; "Series 1 6.8nH"; "* This frequency must be adjusted to 2.45GHz
with matching circuit."; "Empty Area 6x6 mm"; eval board 45 × 20 mm.

**Abracon PRO-OB-440** (ex-ProAnt "OnBoard SMD 2400") — "REVISED: 07-19-21" (LCSC-hosted, C5122736).
- "13.75 x 5.23 x 3.53 mm"; "Peak Gain 4.9 dBi"; "Efficiency 65 %"; eval PRO-EB-450 "100 x 50 mm"; "the performance is
  dependent on the ground plane dimensions, tuning components and application environment."
- "mounted on a ground plane … no ground cutout area is required under the antenna … very important that there is a
  ground clearance around the NC pads and the RF feed pad, through all layers of the PCB."
- "The antenna is preferably positioned along one side of the PCB ground plane, where pin 1 shall be as close as possible
  to the layout corner." "recommended to implement a pi-matching network".
- Used on the M5Stack AtomS3U (schematic symbol "PROANT440", see §5).

---------------------------------------------------------------------------------------------------

## 4. PCB trace antennas

| Design | Size | Source | Fits 13–13.5 mm across? |
|---|---|---|---|
| TI IFA (CC2430DB) | "25.7 × 7.5 mm (not including ground plane)"; quick guide "26 x 8" | SWRU120D "2.4-GHz Inverted F Antenna" (Apr 2007, rev. Jan 2019), https://www.ti.com/lit/pdf/swru120 | No |
| TI AN043 meandered IFA (CC2511 USB dongle) | "no more than 15.2 x 5.7 mm" | SWRA117D (2008-04-04), https://www.ti.com/lit/pdf/swra117 | No (15.2 > 13.5) |
| TI DN004 folded dipole | "46 x 9 mm" | SWRA118, https://www.ti.com/lit/pdf/swra118 | No (needs a balanced feed too) |
| TI AN040 folded dipole | quick guide "45 x 2.5" | SWRA093D, https://www.ti.com/lit/pdf/swra093 | Thin, but 45 mm long and balanced feed — not usable as is |
| TI DN024 monopole (868/915 + 2.44 GHz) | quick guide "38 x 25" | SWRA227E, https://www.ti.com/lit/pdf/swra227 | No |
| Espressif MINI-1 module antenna | 15.4 wide × 5.05 deep strip | MINI-1 datasheet v1.7 Fig 10-1 | No |
| u-blox NORA-W106 on-module trace (Abracon IP) | "Size (HxWxL) 1.1 x 3.4 x 10 mm" | NORA-W10 SIM R08 §6.13.2 | Only as part of the module (§6) |

TI quick guide: SWRA351B "Antenna Selection Quick Guide DN035" (https://www.ti.com/lit/pdf/swra351): 2.4 GHz entries:
SWRU120 "80 % (EB) 94 % (SA) 280 MHz 26 x 8"; SWRA117 "68 % (EB) … 101 MHz … 15 x 6"; SWRA118 "46 x 9";
SWRA093 "45 x 2.5"; SWRA227 "38 x 25".

Key TI quotes:
- SWRU120D: "The antenna impedance is tuned to 50 ohm on the reference board. The impedance will however be affected by
  different size and shape of the ground plane, objects in the antenna nearfield such as mechanical assemblies (housing,
  batteries, etc.), PCB thickness, PCB material and so on. It is therefore recommended to add a pi-network close to the
  antenna feedpoint for impedance matching." Built on "1-mm thickness using standard FR-4". Gains: XY 1.1, XZ 3.3,
  YZ 1.6 dBi; "Reflection < –15 dB". "If the antenna is implemented on a PCB that is wider than the antenna, avoid placing
  components or having a ground plane close to the end points of the antenna."
- AN043: "The IFA was designed to match an impedance of 50 ohm at 2.45 GHz. Thus no additional matching components are
  necessary." "strongly recommended to make an exact copy of the reference design"; "To compensate for a thicker/thinner
  PCB the antenna could be made slightly shorter/longer." "plastic encapsulation of the dongle will shift the resonance
  frequency to a lower frequency. This can be compensated by making the antenna slightly shorter." Table 6: gains
  "4.5 dB / 5.3 dB / 5.3 dB / 3.3 dB (XY plane, connected to laptop)" (unit printed as "dB", not "dBi"), "LOS range 240 m".

Can any trace antenna fit 13–13.5 mm usable width? None of the published, measured designs I found fits across the board.
Rotating AN043 to run 15.2 mm along a long edge (5.7 mm into the width) is a different geometry from TI's reference (the
ground plane would be on only one side and only ~8 mm wide). Its performance is **UNVERIFIED** and would need EM
simulation plus measurement. LilyGO's T-Dongle-S3 (§5) seems to use a trace antenna on a ≈14 mm board, but its geometry and
performance are not published (**UNVERIFIED**).

---------------------------------------------------------------------------------------------------

## 5. Narrow-ground-plane effects (sourced statements only)

- TI AN043: "The size of the ground plane affects the performance of the PCB antenna. Connecting the USB dongle to a
  computer increases the size of the ground plane … In free space the antenna has a bandwidth of approximately 250 MHz.
  When the USB dongle is connected to the laptop the bandwidth is reduced to around 100 MHz"; "the output power is reduced
  by approximately 2 dB when the dongle is connected to a laptop."
- TI SWRU120D: impedance "affected by different size and shape of the ground plane … recommended to add a pi-network".
- Ignion NN02-101: "Other ground plane sizes and clearances can be implemented by adapting the matching network."
- Taoglas WLA.04: minimum 90 × 50 mm recommended; smaller "with a trade off on performance".
- Abracon PRO-OB-440: "performance is dependent on the ground plane dimensions, tuning components and application environment."
- u-blox NORA-W106 (module trace antenna): "A 50 x 50 mm ground plane is recommended but its size should be no less than 24x30 mm."
- Yageo ANT1608LL14R2400A: on a 10 × 50 mm board (corner placement) the maker measured 60.64 % / 3.38 dBi vs 61.88 % /
  2.03 dBi on 50 × 20 mm (edge placement). This is the only published data I found for a ≤ 14 mm-wide ground.
- Every eval board above (40×20 to 100×50 mm) is wider than 14 mm, so the published efficiencies are **not** guarantees
  for this board. Expect retuning, and measure.

---------------------------------------------------------------------------------------------------

## 6. Existing ESP32-S3 dongles / tiny boards

| Board | Size (mm) | ESP32-S3 form | Antenna | USB | Source |
|---|---|---|---|---|---|
| LilyGO T-Dongle-S3 | PCB outline ≈ **32.04 × 14.01** (repo DXF `case/T-Dongle-S3.dxf`, KeepOutLayer extents; whole-drawing extents 47.05 × 16.08 incl. plug); not stated in docs → interpretation **UNVERIFIED** | chip-down "ESP32_S3" (U4) + external SPI flash | P1 "ANT" (PCB-trace symbol); L2/C21/C22 marked "NC" | "USB-3.0-TYPE-A-TF" (USB-A plug + TF) | Schematic `schematic/T-Dongle-S3.pdf` (dated 2022/10/8; log "V-1.1 缩短PCB长度") https://github.com/Xinyuan-LilyGO/T-Dongle-S3 ; repo last commit 2026-10-13 |
| M5Stack AtomS3U | 53.0 × 20.0 × 10.3 (product) | chip-down ESP32-S3FN8 | ANT1 "PROANT440" (= Abracon PRO-OB-440, inferred from symbol name) + J1 IPEX; RF π C2 2.2 pF / L1 1.8 nH / C1 2.7 pF | USB Type-A | https://docs.m5stack.com/en/core/AtomS3U ; schematic https://m5stack-doc.oss-cn-shenzhen.aliyuncs.com/477/Sch_AtomS3U_v1.0.pdf |
| Waveshare ESP32-S3-GEEK | PCB not stated; enclosure figure 61.00 / 45.00 / 25.90 / 15.86 / 9.60 / 9.00 (image file "RP2-4-_geek_09.jpg", probably shared with RP2040-GEEK) → **UNVERIFIED** | chip-down (wiki: "ESP32-S3R2"; schematic U2 "ESP32-S3" + W25Q128) | J2 "ANT" (type not stated); L1 0R; C13, C14, L2, C16 NC | USB-A plug ("USB接口 type A 公口 90度 夹板0.8") | https://www.waveshare.com/wiki/ESP32-S3-GEEK ; https://files.waveshare.com/wiki/ESP32-S3-GEEK/ESP32-S3-GEEK-Schematic1.pdf |
| Waveshare ESP32-S3-Zero | 18.00 × 23.50 | chip-down ESP32-S3FH4R2 | "onboard ceramic antenna" (wiki); J1 with series 0.5 pF + shunt 0.75 pF, C2 0R | USB-C receptacle | https://www.waveshare.com/wiki/ESP32-S3-Zero ; https://files.waveshare.com/wiki/ESP32-S3-Zero/ESP32-S3-Zero-2D-size.jpg ; schematic …/ESP32-S3-Zero-Sch.pdf |
| Seeed XIAO ESP32S3 | 21 × 17.8 | ESP32-S3R8 (wiki) | U.FL connector, external antenna supplied | USB-C | https://wiki.seeedstudio.com/xiao_esp32s3_getting_started/ |
| Adafruit QT Py ESP32-S3 (#5426) | 21.7 × 17.8 × 5.7 | ESP32-S3FN8 (per product-page datasheet link) | not stated → **UNVERIFIED** | USB-C | https://www.adafruit.com/product/5426 |
| Unexpected Maker TinyS3 | "35mm x 17.8mm" (matrix) vs "35 x 18mm" (features) — minor CONFLICT | ESP32-S3FN8 + 8 MB PSRAM (as stated) | "3D High Gain Antenna or u.FL" | USB-C | https://esp32s3.com/tinys3.html |
| **Unexpected Maker NanoS3** | **28 × 12.7**, max thickness 2.4 | chip-down ESP32-S3 ("ESP32-S3FN8" in matrix) + external PSRAM (IC1) | "3D High Gain Antenna"; "Onboard or External u.FL"; schematic file name "NanoS3_2450AT18B.kicad_sch" (suggests Johanson 2450AT18B — inference); π AF1–AF3 + L1/C5/C2 all "TBA" | none; "D+/D- pins for external USB connector" | https://esp32s3.com/nanos3.html ; schematic Rev P8 2023-07-27 https://raw.githubusercontent.com/UnexpectedMaker/esp32s3/main/schematics/schematic-nanos3.pdf |
| Espressif ESP32-S3-USB-Bridge | 23.3 × 31.5 | module ESP32-S3-MINI-1-N4R2 | module PCB antenna | USB-C + USB-A | https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s3/esp32-s3-usb-bridge/user_guide.html (schematic V2.1 2023-06-01) |
| u-blox USB-NORA-W106 (EVK, "USB-stick format") | not stated in text → **UNVERIFIED** | NORA-W106 module (ESP32-S3 inside) | module trace antenna | "USB-A board connector" | USB-NORA-W1 User Guide UBX-22019106 R02 (13-Apr-2023); NORA-W10 Product Summary R03 |

≤ 14 mm-wide chip-down ESP32-S3 examples found: **UM NanoS3 (12.7 mm, onboard antenna, no USB plug)** and
**LilyGO T-Dongle-S3 (≈14.0 mm from the DXF outline, USB-A plug, PCB-trace antenna)**. I found no ESP32-S3-PICO-1 example
≤ 14 mm (**UNVERIFIED** absence). Neither publishes antenna performance.
T-Dongle-S3 flash **CONFLICT**: docs say "16MB(Quad-SPI)", schematic V1.x shows W25Q32 (32 Mbit = 4 MB); probably a later revision.
ESP32-S3-GEEK PSRAM **CONFLICT** on the wiki: "2 MB" (Features) vs "8MB of PSRAM and Flash" (Onboard Resources).

---------------------------------------------------------------------------------------------------

## 7. Certified ESP32-S3 module ≤ 14 mm wide — yes: u-blox NORA-W10

Sources: NORA-W10 Data Sheet UBX-21036702 **R05, 16-Apr-2025** (https://content.u-blox.com/sites/default/files/documents/NORA-W10_DataSheet_UBX-21036702.pdf);
Product Summary UBX-22005021 **R03** (2023); System Integration Manual UBX-22005601 **R08, 11-Feb-2026**
(https://content.u-blox.com/sites/default/files/documents/NORA-W1_SIM_UBX-22005601.pdf).
- Product summary: "Chip inside ESP32-S3"; "Dimensions 10.4 x 14.3 x 1.8 mm". Data sheet: "outline of 10.4 (length) x
  14.3 mm (width) x 1.9 mm (height)" → **CONFLICT 1.8 vs 1.9 mm height** (use the data sheet).
- Variants: NORA-W101-00B (antenna pin), NORA-W106-00B (internal PCB antenna, 8 MB flash, no PSRAM), NORA-W106-10B
  (internal antenna, 8 MB PSRAM). Data sheet status: "Initial production".
- Approvals (DS Table 17): Europe RED, UKCA, FCC, IC, MIC, NCC, KCC, ANATEL, ACMA "Approved"; SRRC W106 only; ICASA "Pending".
- NORA-W106 antenna rules: DS: "ideally placed in the middle of the module – along the side edge of the host PCB";
  "keep a minimum clearance of 5 mm between the antenna and the casing"; "A 50 x 50 mm ground plane is recommended but its
  size should be no less than 24x30 mm." SIM R08 §3.2.4.1: "The module shall be placed in the center of an edge of the host
  PCB."; "recommended to have the ground plane extending at least 10 mm on the three non-edge sides of the module";
  "At least 10 mm clearance between the antenna and the casing is recommended." → **CONFLICT** DS 5 mm minimum vs SIM 10 mm recommended.
- Fit check (my arithmetic): 10.4 mm across leaves 3.6 mm in a 14 mm board, so the "≥10 mm ground on three non-edge sides"
  and "≥24×30 mm ground" rules **cannot be met**. Whether that voids the modular grant's assumptions or needs a permissive
  change is **UNVERIFIED** — ask u-blox or a TCB.
- NORA-W101 pre-approved antenna list (SIM §6.13) holds only external antennas via U.FL/SMA (Taoglas GW.26, Linx
  ANT-2.4-CW-RH-RPS, Abracon PRO-EX-348/-296/-333…) plus the W106 internal antenna. **No SMD chip antenna** is listed.
- JLCPCB 2026-11-09: NORA-W106-10B C19711685 = 202 pcs ($6.06 @1); NORA-W106-00B C6344854 = 29 pcs ($8.33 @1).

---------------------------------------------------------------------------------------------------

## 8. Regulatory (brief, sourced)

US — eCFR Title 47, "up to date as of 2026-11-05" (API https://www.ecfr.gov/api/versioner/v1/full/2026-11-05/title-47.xml?part=15&section=…):
- §15.201(b): "Except as otherwise exempted … all intentional radiators operating under the provisions of this part shall be
  certified by the Telecommunication Certification Bodies pursuant to the procedures in subpart J of part 2 of this chapter
  prior to marketing."
- §15.212(a): "All single or split modular transmitters are approved with an antenna." Modular approval needs the module to
  "have their own shielding", "buffered modulation/data inputs", "its own power supply regulation", meet §15.203 antenna
  rules, be "tested in a stand-alone configuration", carry an FCC ID label (host label "Contains FCC ID: …"), and meet RF
  exposure. §15.212(b): "limited modular approval" for modules that do not meet all of these, with grantee control of host products.
- §15.101(a) table: "Other Class B digital devices & peripherals — SDoC or Certification" (unintentional emissions).
- So for a chip-down dongle, the dongle itself is the intentional radiator: it needs its own FCC ID (TCB certification,
  tested with the actual on-board antenna) plus Part 15B for the digital part. A host using a modularly approved module
  inside the grant's conditions relies on the module's FCC ID for the transmitter but still needs Part 15B and the label.
  (Which 15.247 tests apply and the RF-exposure route for a body-near USB stick: **UNVERIFIED** — not fetched.)

EU — Directive 2014/53/EU (RED), EUR-Lex CELEX:32014L0053:
- Art. 3(1)(a) safety, 3(1)(b) EMC, 3(2) "effectively uses and supports the efficient use of radio spectrum".
- Art. 17(1): "The manufacturer shall perform a conformity assessment of the radio equipment with a view to meeting the
  essential requirements set out in Article 3." Art. 17(3): if harmonised standards are applied for 3(2)/3(3), internal
  production control (Annex II) is allowed. Art. 17(4): if not, or only in part, EU-type examination (Annex III) or full
  QA (Annex IV) is needed.
- Delegated Regulation (EU) 2022/30 (CELEX:32022R0030): Art. 3(3)(d) applies to "internet-connected radio equipment";
  3(3)(e) and 3(3)(f) apply under stated conditions. Original text: "It shall apply from 1 August 2024." Amended by
  Delegated Regulation (EU) 2023/2444 (CELEX:32023R2444): "'It shall apply from 1 August 2025.'"
  So a Wi-Fi dongle placed on the EU market now must also meet the RED cybersecurity requirements.
- The RED duty sits with the end-product manufacturer whether or not a module is used. Exact harmonised-standard versions
  (EN 300 328, EN 301 489-1/-17, EN 62368-1, EN 62479/EN 50663, EN 18031-x) and OJ listing: **UNVERIFIED** (the EC
  harmonised-standards page returned 404). How far module test reports can be reused: **UNVERIFIED** (EC RED Guide not fetched).

---------------------------------------------------------------------------------------------------

## 9. UNVERIFIED items and conflicts (collected)

UNVERIFIED:
1. Latest Pulse W3008 issue (only Issue 1823 seen; Pulse site refused the connection).
2. Ignion NN02-101 matching values; Rainsun AN2051 keep-out; Walsin RFANT5220110A0T and ACX AT3216 layouts (sheets not read).
3. T-Dongle-S3 board size (DXF interpretation), antenna geometry and performance; NanoS3 antenna part (filename inference);
   ESP32-S3-GEEK PCB size and antenna type; QT Py ESP32-S3 antenna type; USB-NORA-W106 size.
4. That no ESP32-S3-PICO-1 board ≤ 14 mm exists, and that Espressif holds no PICO-1 certificate.
5. Whether a NORA-W106 used against u-blox's ground-plane rules stays inside its modular approval.
6. EU harmonised-standard versions and OJ listing; FCC RF-exposure route; module test-report reuse under RED.
7. Performance of any trace antenna rotated to run along a long edge of a 14 mm board.
8. HDG stack-up compatibility with JLCPCB's standard 4-layer stacks.

CONFLICTS:
- HDG table C12 "1.8 ~ 1.2 pF" (range written high-to-low, as printed).
- 2450AT42B0100001E thickness: 1.1 mm (p1) vs 2.00 mm (p2 table).
- LCSC "Peak Gain 0.5dBi" for 2450AT18A100E / 2450AT18B100E vs Johanson current sheets: 1.5 dBi.
- NORA-W10 height 1.8 mm (Product Summary R03) vs 1.9 mm (Data Sheet R05); antenna-to-casing 5 mm min (DS) vs 10 mm recommended (SIM R08).
- T-Dongle-S3 flash 16 MB (docs) vs W25Q32 (schematic V1.x).
- TinyS3 width 17.8 mm vs 18 mm (same page).
- ESP32-S3-GEEK PSRAM 2 MB vs "8MB of PSRAM and Flash" (same wiki page).
- AN043 gains printed in "dB", not "dBi".
- LCSC vs JLCPCB stock differ for the same C-number (separate inventories): e.g. C99665 53,885 (LCSC) vs 57,650 (JLC);
  C293767 13,060 vs 34,690.

---------------------------------------------------------------------------------------------------

## 10. Recommended antenna approach for a 14 mm board with plugs at both ends

Facts that drive it: (a) both ends carry metal plug shells, and either end can be in a metal host port, so there is no
free "board end" or "corner". (b) Espressif wants the antenna away from USB and high-speed parts, at a board edge, with a
50 Ω outer-layer feed and π/CLC tuning pads near the antenna. (c) The published PCB trace antennas are ≥ 15.2 mm across.
(d) Several chip antennas are characterised for **center-of-long-edge** mounting with small keep-outs.

Recommendation (an engineering judgement built on the sourced facts above):
1. Use a chip antenna mounted at the **middle of one long edge**, at mid-length between the two plugs, with the maker's
   all-layer keep-out:
   - First choice: **Johanson 2450AT18D0100001E** (or AEC-Q200 twin **2450AT18D0100002E**, JLC C17410360, 903 pcs).
     The maker names "thin edge" use and gives a reference 8 × 3.4 mm clearance (4 × 6 mm on its 40 × 20 mm eval board).
     72 % / 1.5 dBi on eval; no matching needed on eval.
   - Alternatives in stock at JLCPCB: **Pulse ANT2012LL13R2400A** (C19192917, 3,910 pcs; 3 × 5 mm keep-out; 76.6 % on
     90 × 50) and **Pulse W3008 / W3008C** (C581402 / C581403; 4 × 4.25 mm keep-out; 66 % on 80 × 37).
   - Avoid corner-mount (2450AT18A/B, 2450AT42B) and board-end parts (Rainsun AN9520/AN3216, Yageo ANT3216LL00): there is
     no corner or end free of plug metal.
2. A keep-out 3.4–6 mm deep leaves roughly 8–10.6 mm of the 14 mm width in that section (my arithmetic). Put the 7 × 7 mm
   QFN56 just along the board from the keep-out, LNA_IN facing it. Then: 0201 CLC chip match at pin 1 with the 15 mil
   stub; a short 50 Ω CPWG on L1 over solid L2 ground (HDG stack-up); a 3-pad π for antenna tuning next to the keep-out
   on the ground side; ESD footprint optional. Stitch vias along the keep-out edge.
3. Keep the crystal, flash/PSRAM, USB D+/D− and both plug shells as far from the keep-out as the length allows; route USB
   on inner layers; no copper on any layer inside the keep-out.
4. Leave pads for tuning parts (π at the antenna plus the antenna's own L/C tuning pad for the 2450AT18D thin-edge layout).
   Plan VNA tuning on the assembled board **inside the plastic case**, in both use cases (USB-A end inserted and USB-C end
   inserted). Johanson's datasheets link "Antenna Tuning, Optimization, and Validation Services"; Ignion's manual has an
   "ASSESS YOUR OWN DEVICE REQUIREMENTS" section (scope of that service not checked).

Main risks:
- Ground plane far smaller than any eval board (14 mm wide vs 20–50 mm): lower efficiency and detuning are likely, and
  efficiency will not match datasheet figures.
- Host coupling changes the antenna when plugged in (AN043: bandwidth 250 → ~100 MHz, −2 dB on a laptop), and it changes
  differently depending on which plug is inserted.
- The plastic case sits a few millimetres away, closer than Espressif's 15 mm or u-blox's 5–10 mm guidance; expect a
  downward frequency shift (AN043).
- Keep-out eats width and constrains the QFN56, flash and USB routing.
- Regulatory: chip-down means full FCC certification (new FCC ID) and a full RED assessment including the cybersecurity
  requirements in force since 1 Aug 2025. The only certified ESP32-S3 module that fits the width (u-blox NORA-W106,
  10.4 × 14.3 mm) cannot meet its own ground-plane rules on a 14 mm board.
- Supply: several good candidates show 0 stock at LCSC/JLCPCB (AVX 1001312, Ignion NN02-101, Yageo ANT1608, 2450AT18A/B
  legacy). The 2450AT18D0100001E itself has only 95 pcs; its AEC-Q200 twin has ~900.

---------------------------------------------------------------------------------------------------

## 11. Local file index (scratchpad)
- Downloads: `scratchpad/r7/<name>/` (one directory per document). Text: `scratchpad/r7-text/`. Renders: `scratchpad/r7-render/`.
- LCSC JSON: `scratchpad/r7/lcsc-api/`; JLCPCB JSON: `scratchpad/r7/jlc-api/`.
- Scripts (outside download dirs): `scratchpad/r7-scripts/` (html2text.py, pdf2txt.js, pdfpage2png.js, lcsc.py, jlc.py, jlc_any.py, dxf2png.py).
