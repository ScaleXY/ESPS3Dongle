# ESP32-S3 dual-plug dongle — Rev A PCB (placed, not routed)

Implements `plans/02` (schematic and pin map) and `plans/03` (outline, stack-up, placement, RF) as a 4-layer board.

## Layout

| Path | What |
|---|---|
| `index.circuit.tsx` | **Source of truth** for the netlist and placement (tscircuit) |
| `lib/geometry.ts` | Outline, J1/J2 datums, antenna keep-out, U1 position |
| `imports/*.tsx` | Exact JLCPCB/EasyEDA land patterns (`tsci import <C#>`) |
| `scripts/build_kicad.sh` | tscircuit → KiCad → post-processing → DRC and renders |
| `scripts/kicad_post.py` | Stack-up, rules, net classes, planes, keep-outs, paste, DNP |
| `scripts/gen_schematic.py` | KiCad schematic generated from the board and tscircuit pin names, linked footprint ↔ symbol |
| `kicad/esp32s3_dongle.kicad_pcb` | **The KiCad board to route** (plus `.kicad_pro`, `.kicad_dru`) |
| `kicad/esp32s3_dongle.kicad_sch` | Schematic: one sheet, functional blocks, net labels. ERC clean, PCB parity clean |
| `kicad/netlist.txt` | Readable netlist from tscircuit |
| `kicad/out/` | `drc.rpt`, `erc.rpt`, `schematic.pdf`, `top.png`, `iso.png`, `bottom.png`, per-layer SVGs |

To rebuild, run `./scripts/build_kicad.sh`. It needs bun (`~/.bun/bin`), the global `tsci`, and KiCad 10 in `/Applications`.

**Once routing starts in KiCad, the KiCad board becomes the master.** After that, back-port any netlist changes by hand, or re-run the build and re-place the routing.

## Board

- **Size:** 43.65 × 13.6 mm. 13.6 mm + 0.2 mm routing tolerance stays ≤ 14.0 mm.
- **Stack-up:** 4 layers, JLC04161H-7628, 1.6 mm, ENIG.
  - L1 top: signals and RF.
  - L2: solid GND.
  - L3: GND under the RF chain, crystal and the top half of U1. The rest of L3 is reserved for 3V3/VSYS pours and QSPI.
  - L4: bottom GND and 12 pogo test pads (Ø1 mm, 2 mm grid). Nothing is assembled on L4.
- **Overall stick:** about 66 mm.
  - J1 USB-A overhangs 14.70 mm (board edge at the plug step).
  - J2 USB-C overhangs 7.5 mm.
- **J2 (C530607, sink mount):** sits in a 3.33 × 8.66 mm open notch. Figures are from the Hroparts TYPE-C-31-G-07 drawing.
  - The plug is 13.75 mm long; its shell is 10.70 mm long and 8.25 mm wide.
  - The solder tails sit 0.95 mm below the shell top, so the shell drops 0.95 mm into the board and stands 1.45 mm above it.
  - The notch starts 0.14 mm behind the shell's rear end (fp +4.08) and has 0.2 mm per side over the shell width, for JLC's ±0.2 mm routing tolerance.
  - The B-row pads and EH tabs keep 0.2 mm copper-to-edge. The EH1/EH2 tabs are 0.1 mm shorter than the vendor land for this.
  - USB-C needs ≥ 6.51 mm of exposed shell. The board edge is 0.75 mm behind the footprint origin, which leaves about a 1 mm case wall.
- **Antenna:** ANT1 (2450AT18D) follows Johanson's "thin edge" layout (datasheet Rev 5.0 p.5).
  - The clearance is 8 × 3.4 mm at x = 9–17 mm.
  - ANT1 sits at the feed end (x = 13–17), against the RF-side ground plane, and its top lands are 0.2 mm from the edge.
  - Pins follow the swapped option on p.2: pin 4 (lower right) is the feed, and pin 1 is GND.
  - The far-end lands (pins 2 and 3) go to GND through R13, the "L/C**" tuning part (0 Ω = direct GND). R13 sits in a 0.6 mm ground strip along the edge.
  - L2–L4: no copper in the clearance.
  - L1: only the feed trace, ANT1, R13 and the edge strip. No vias and no pour.
- **U1:** pin 1 (LNA_IN) at the corner nearest the antenna.
  - EPAD: 9 × 0.3 mm GND vias in a "+" pattern, tented on L4, with four 1.4 mm quadrant paste windows that miss the vias.
  - This doesn't need via-in-pad fill-and-cap. JLC lists that as standard only on 6+ layers; on 4-layer it's an extra-cost option.
  - U2's exposed pad goes to GND with 2 vias at the pad ends and 2×2 paste windows.
  - The RF chain is in 0201: C19–L3–C20 on the chip side, then R11 (0 Ω measurement break), then C21–R12–C22 (antenna-side π) and D4 (ESD, DNP).
  - L2 is cleared under C19's stub pad.
- **Y1:** 2.1 mm body-to-body from U1, on the antenna edge, with no traces underneath.

### Net classes and rules

| Class | Nets | Width / gap | Notes |
|---|---|---|---|
| RF_50R | `RF_*` | 0.33 / 0.30 to GND | CPWG on L1 over L2; no vias. [D] Confirm in the JLC calculator |
| USB_90R | `USB*_D_P/N` | 0.25 / 0.15 | Pairs; skew ≤ 0.5 mm. [D] Confirm in the JLC calculator |
| RF_SUPPLY | VDD3P3 | ≥ 0.5 | HDG: ≥ 20 mil |
| POWER | VBUS_A/C, VSYS, V3V3, GND | ≥ 0.4 (0.5 default) | 0.6/0.3 vias |
| XTAL | XTAL_P/N, XIN | 0.15 | No vias |
| Default | everything else | 0.15 / 0.1 | 0.45/0.2 vias |

Board minimums (JLCPCB capabilities page, checked 2026-11-12):
- Clearance and track: 0.1 mm.
- Via: 0.45 mm diameter, 0.2 mm drill; smaller vias cost extra.
- Copper to edge: 0.2 mm.
- PTH to copper: 0.28 mm. NPTH to copper: 0.2 mm.
- Hole to hole: 0.25 mm.

### Check status

`kicad/out/drc.rpt` (DRC with zone refill and schematic parity):
- **0 violations** and **0 schematic parity issues.**
- **184 unconnected items**, which is expected because the board is unrouted.

`kicad/out/erc.rpt`: **0 violations.**

In the schematic every pin is "passive", so ERC checks connectivity but not drive strength.

## Deviations from `plans/03` (please review)

1. **The board is 43.65 mm long, not 36–42 mm.** The USB-C plug is a sink-mount part. Its pad field and notch use about 8.2 mm of board length, and the 13.6 mm width doesn't leave enough room to place more parts side by side.
2. **The antenna clearance is at x = 9–17 mm, toward the Type-A end, not mid-length.**
   - This keeps the U1 pin 1/VDDA/XTAL corner, Espressif-style, next to the antenna feed and the crystal off the antenna's edge.
3. **SW1 (recovery button) sits above the flash at x ≈ 33.6 mm**, which is in the Type-C half. The notch fingers are too short for it.
4. **U6 (optional supervisor, DNP) uses an SC-70-3/SOT-323 footprint** instead of SOT-23, to fit. Pins: 1 GND, 2 RESET̅, 3 VDD. [U] Choose the part.
5. **The USB series resistors R14/R15 are 0201, not 0402.** They are fitted with 0 Ω; the 22 Ω option stays.
6. **There is no separate 1 µF at the LDO input.** The 47 µF VSYS bulk cap C2 sits next to U4 IN, as `02` §2.3 allows.

## Resolved since the first hand-off

| Item | Resolution |
|---|---|
| USB-C plug fit and 3D height | Checked against the Hroparts drawing. The notch is resized (see Board), and the 3D model height matches the drawing (1.45 mm above the board) |
| Antenna pinout and layout | Johanson Rev 5.0: pin 4 is GND or feed, never NC. The board now uses the swapped option (pin 4 feed, pin 1 GND) and the thin-edge clearance, ground strip and L/C position |
| U1 thermal vias | Tented "+" via pattern with quadrant paste windows. No via-in-pad fill-and-cap needed |
| U2 exposed pad | Tied to GND with 2 tented vias; paste windows clear of them |
| Unusable schematic | Replaced by `gen_schematic.py`: linked to the PCB, ERC and parity clean |
| Silkscreen warnings | Plug, antenna and crystal outlines moved to F.Fab; passive outlines removed |
| tscircuit vias exported as empty footprints | Stripped in post-processing |

## Open items

- **Routing to-dos:**
  - L1 GND pour with stitching vias: a via fence along the antenna clearance (Johanson shows ground vias around it), and the 0.6 mm edge strip from R13 to the plane at x ≤ 9.
  - C19 stub: 15 mil long, 100 Ω, referenced to L3.
  - L3 power pours (3V3/VSYS) and QSPI on L3 with a GND guard.
  - Both USB branches run along the y < 0 edge.
- **Antenna tuning:** the antenna and π values have to be tuned with a VNA, with the board in its case (plans/05).
- **Case:** design the case front about 1 mm ahead of the board's USB-C edge, so the plug keeps ≥ 6.51 mm of exposed shell.
- **U6 supervisor:** the part isn't chosen yet. The footprint is SC-70-3 (pins: 1 GND, 2 RESET̅, 3 VDD).
