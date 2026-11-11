# 03 — PCB, mechanical and RF layout plan

Tags: [V] verified (note ID) · [D] derived · [E] estimate · [U] open. Notes are in `plans/research/`.

---

## 1. Outline

- **Width: 13.6 mm nominal** [D].
  - JLCPCB's routed-edge tolerance is ±0.2 mm (regular). ±0.1 mm "Precision" routing needs a 50 × 50 mm minimum and tooling holes [V V0.4].
  - 13.6 + 0.2 = 13.8 mm, which leaves 0.2 mm for panel-tab nubs before the 14.0 mm limit [D].
- **Length: about 36–42 mm of PCB** [E], set by the placement below.
- **Plug overhang:** J1 overhangs **14.70 mm**, its nose-to-step distance [V R4]. J2 overhangs about 8–9 mm [E; read it from the C530607 drawing at layout time].
- **Overall stick length** before the case: about 60–65 mm [E].
- **Copper keep-back:** ≥ 0.2 mm from routed edges [V V0.4]. J1's slot edges sit about 0.5 mm from each long edge at 13.6 mm width [D: 12.6 mm footprint]. Their plated rings sit closer; check them against the 0.2 mm rule [U].

## 2. Stack-up (D9-A)

**JLC04161H-7628, 1.6 mm, 4 layers** [V V0.3]:
- L1 1 oz.
- PP 7628, 0.2104 mm, Dk 4.4.
- L2 (inner copper 0.5 oz).
- Core 1.065 mm, Dk 4.38.
- L3.
- PP 7628, 0.2104 mm.
- L4 1 oz.

With the straddle C plug (D7-C), use JLC04081H-7628 (0.8 mm) instead. It has the same L1–L2 dielectric [V V0.3].

| Layer | Use |
|---|---|
| L1 | All components (single-sided assembly). RF line, USB pairs, short signals. GND pour with stitching. |
| L2 | **Solid GND. No splits** under U1, the RF line, the USB pairs or Y1 [V R2]. Clear only under the chip-side stub (§4.2) and in the antenna keep-out. |
| L3 | **GND plane under the RF section and crystal** (HDG: "L3 power, with a GND plane under the RF and crystal") [V R2]. Elsewhere: 3V3/VSYS pours and the flash QSPI routing with GND guard ("Route SPI on an inner layer such as L3") [V R2]. |
| L4 | GND pour, test pads, minimal routing. No components; Espressif's module guidance keeps L4 component-free [V R7]. |

Espressif recommends 4 layers [V R2]. Its modules are 4-layer 0.8 mm boards [V R2]. Compute impedance-controlled widths in JLCPCB's calculator for the chosen stack-up:
- **50 Ω coplanar line** on L1 over L2. Sanity check: Espressif's 12.6 mil line with 12.2 mil gaps on 8.22 mil, Dk 4.6 [V R2].
- **90 Ω ±10 % differential pair** for USB [V R2].

## 3. Placement plan [E]

Top view. The Type-A end is on the left. y = 0 is the "USB/power edge" and y = 13.6 is the "antenna edge".

```
 x(mm) 0        6            13                    24          31        38
       ┌────────┬────────────┬─────────────────────┬───────────┬─────────┐ y=13.6
       │        │            │ ░░ ANT1 keep-out ░░ │           │         │  ← antenna edge
  J1 ══│ J1 pads│ U4 LDO     │ ░ 8 × 3.4 (all lyr) │  U2 flash │ ESD ×3  │══ J2
 USB-A │ ESD ×3 │ U3 mux     │  π   U1 ESP32-S3    │  0Ω links │ Rd 5.1k │ USB-C
 (14.7 │ 1µF    │ VSYS caps  │  CLC  (7×7)   Y1    │  0.1µF    │ 1µF     │ (≈8–9
  over-│ PR1 div│            │                     │           │ div     │  over-
  hang)│        │            │   U5 switch ─ USB pairs run along y≈0–3 ─  │  hang)
       └────────┴────────────┴─────────────────────┴───────────┴─────────┘ y=0
                       bottom (L4): test pads TP_TX TP_RX TP_BOOT TP_EN TP_3V3 TP_VSYS TP_GND TP_IO10/11 TP_OE TP_SEL TP_RCV
```

Rules behind the sketch:

1. **ANT1 sits mid-length on one long edge**, as far as possible from both metal plug shells. Johanson lists "Center-edge mount … or thin edge" [V R7].
   - Distance from the host chassis is similar for both plug-in directions:
     - Via A: the receptacle stop is 8.88 mm deep [V R4], so about 5.8 mm of J1 stays outside the port, plus about 13 mm of board to the antenna.
     - Via C: about 2 mm of J2 shell beyond the 6.51 mm minimum exposure, plus about 7–14 mm of board.
   - These distances are [D/E]. Final tuning is done in both orientations (`05`).
2. **USB pairs, regulators, the mux and the switch run along the opposite long edge** (y ≈ 0–3 mm). Espressif: "the USB port … must be as far away from the antenna as possible" [V R2].
3. **U1 orientation:** turn U1 so **pin 1 (LNA_IN) faces the antenna feed** [V R1: pin 1 = LNA_IN].
   - VDD3P3 (pins 2, 3), VDDA (55, 56) and XTAL (53, 54) cluster near pin 1, so their decoupling and Y1 compete for the antenna side. Resolve this in layout.
   - USB (25, 26) and SPI (28–35) face away from the antenna, toward U5/U2.
4. **Y1** is ≥ 2.0 mm from the chip ("The gap should be at least 2.0 mm").
   - No vias on the clock traces, no traces under the crystal, series 24 nH close to the chip, load caps on both sides of the crystal [V R2].
   - Keep Y1 away from the regulator's heat; a crystal's frequency drifts with temperature [D].
5. **U2** is close to SPI pins 28–35. The 0 Ω parts sit near U1 [V R2].
6. **U4** (LDO) gets thermal vias into the L2/L4 GND pours. Keep it away from Y1 and, if it fits, from U1 [D].
7. **ESD parts** (2 × TPD1E05U06 + 1 × TPD1E10B06 per plug) go within a few mm of their plug [V R5].
8. **EPAD:** ≥ 9 GND vias [V R2]. Use Espressif's land pattern `ESP32-S3_Footprint.asc`, which R1 decoded as 0.22 × 0.65 mm pads and a 3 × 3 grid of 1 mm EPAD squares [V R1].
9. **Single-sided assembly.** JLCPCB Economic PCBA is single-sided only [V V0.4]; double-sided adds cost. Only test pads go on L4.
10. **SW1 (recovery button)** goes on the top side, outside the antenna keep-out, under a pin-hole in the case top. Put it near the Type-C end, so a finger on the stick doesn't press it [E]. Keep its trace to GPIO8 short and away from the RF line [D].

## 4. RF layout

### 4.1 Antenna (D10-A: Johanson 2450AT18D0100002E)

- **Keep-out:** the maker's "thin edge" reference clearance is **8 mm along the edge × 3.4 mm deep**, with an L/C tuning part at the far end [V R7]. "No GND on all layers" [V R7] means no copper on any layer in that area.
- **Evaluation board:** the datasheet's numbers come from a 40 × 20 mm evaluation board [V R7]. Ours is far narrower, so expect lower efficiency and a shifted resonance [V R7].
- **Via fence:** place GND stitching vias along the keep-out boundary [D].
- **Antenna-side π** goes right at the feed (§5 of `02`). Footprint it even if it ends up as 0 Ω / DNP / DNP.
- **Before ordering the -002E**, check that its datasheet and land pattern match the -001E [U].
- **If D10-B** (Pulse ANT2012LL13R2400A): 3 × 5 mm keep-out at the long-edge centre. **If D10-C** (W3008C): 4 × 4.25 mm [V R7].

### 4.2 Chip-side match and RF line [V R2]

- C–L–C network in **0201**, placed "close to the pin in a zigzag".
- **Stub:** 15 mil long, 100 Ω ±10 %, on the ground pad of the first shunt capacitor. L3 is the stub's reference, so clear L2 under it.
  - Its width depends on the L1–L3 distance: about 1.29 mm on the 1.6 mm stack-up, about 0.48 mm on 0.8 mm [D, V0.3].
  - Espressif's starting values assume its own layout and stack-up [V R7].
- **RF line:** 50 Ω coplanar on L1. No vias, no branches, 135° bends or arcs, as short as possible. Dense GND vias along both sides.
- **Measurement break:** a 0201 0 Ω between the chip-side and antenna-side networks, for VNA measurements [D].

### 4.3 What the antenna will see (plan for tuning)

- A plastic case shifts resonance lower; a host plugged in narrows bandwidth and can cost about 2 dB. TI AN043, a USB-dongle antenna note, measured this [V R7].
- Espressif's module guidance asks for **≥ 15 mm clearance in all directions** inside a housing [V R2/R7]. That is impossible in a 16 mm-wide stick.
  - **Accept reduced performance and tune in the final case** [D].

## 5. USB and high-speed routing

- **USB pairs** [V R2]:
  - 90 Ω ±10 % differential, equal lengths, continuous GND reference.
  - Minimise vias. At any layer change "add a pair of ground return vias at each transition point".
  - Run both branches (J1 → U5 2D and J2 → U5 1D) along the y ≈ 0–3 mm edge. Keep the U5 → U1 segment short.
  - Full speed (12 Mb/s, 4–20 ns edges [V R4]) tolerates the lengths involved (≤ about 25 mm per branch [E]).
- **Flash QSPI** on L3 with GND guarding. Clock and data are guarded separately [V R2].
- **UART TX** series resistor near the chip, away from the crystal [V R2].

## 6. Panelisation and assembly at JLCPCB

- **Assembly class:**
  - JLCPCB's part pages mark J1 (C720521) "Fixture Required" and PCBA "Standard Only" [V R4]. J2 (C530607) is "Fixture Required" [V R4].
  - **Standard PCBA needs at least 70 × 70 mm (panel) with edge rails** [V V0.4].
  - Economic PCBA would allow 10 × 10 mm single boards, single-sided, 0.8–1.6 mm, 2–50 pcs [V V0.4], but probably isn't available with these connectors.
  - **Confirm at quote time** [U].
- **Panel design** [D]:
  - The plugs overhang the board ends (14.7 mm and about 8–9 mm), so the panel needs **open windows at both ends of every board**. No frame material may sit where a plug hangs.
  - Join boards along the **long edges with mouse-bite tabs**, not V-score. V-score tolerance is ±0.4 mm [V V0.4], which would break the 14 mm limit, and V-score can't run past overhanging connectors.
  - **Sand tab nubs flush.** The 13.6 mm nominal width leaves 0.2 mm for this.
  - Example: 2 rows × 4 boards, each with about 14.7 mm and 8–9 mm plug windows, plus 5 mm rails, gives about 70 × 135 mm [E].
- **Stencil and X-ray:** the QFN56 EPAD and the WSON EP need windowed paste. Espressif's land pattern shows the EPAD split into nine 1 mm squares [V R1].
  - Ask JLCPCB for X-ray inspection of U1 and U2 on the first article [U: availability and cost].

## 7. Mechanical and case

- **USB-A end, USB 2.0 Standard-A plug rules** [V R4]:
  - Shell length from the nose to the "overmold" (our case front) is **≥ 11.75 mm**.
  - The overmold must be **≤ 16.0 mm wide and ≤ 8.0 mm high**, so the stick fits next to neighbouring ports.
  - "Allow a minimum spacing of 2.67 mm between the face of the receptacle and the plug overmold boot."
  - XUNPU J1 has a 14.70 mm nose-to-step [V R4], so the case front can sit 11.75–14.70 mm behind the nose [D].
- **Height check** [D]:
  - J1's shell sits about 3.35 mm above and 1.15 mm below the board top surface (XUNPU drawing [V R4], sub-surface depth [U]).
  - A 1.6 mm board's bottom is 1.6 mm below its top.
  - Total stack: board bottom to shell top ≈ 4.95 mm, plus about 1 mm wall top and bottom, gives about 7 mm. That is ≤ 8.0 mm ✓ [E].
  - Width: the 16.0 mm limit leaves about 1.0 mm per wall once the 13.8 mm worst-case board and some clearance are counted. Tight [D].
  - If the case needs thicker walls, narrow the J1 section to about 13.4 mm (12.6 mm footprint + plated rings + 0.2 mm edge clearance) [D/E].
- **USB-C end:** keep at least **6.51 mm of plug shell exposed** ("6.51 MIN. EXPOSED SHELL") [V R4].
  - The Type-C overmold maximum dimensions were not checked [U].
- **Wrenching:** a PCB-mount Type-C plug must survive a 0.75 N·m wrenching moment [V R4]. The case should hold both plug shells so the load goes into the case, not into the solder joints [D].
  - The 1.6 mm board helps with stiffness [E].
- **Plug axes** won't be coaxial. J1's shell centre sits about 1 mm above the board top [D]; J2's offset must be read from its drawing [U]. Design the case around both.
- **Case access:** a pin-hole (about 1 mm) over SW1, the recovery button, so it can be pressed with a SIM tool or paperclip [E]. The pin must reach the switch's 2.8 × 1.9 mm top [V R5]. Use a light-pipe or thin translucent wall over the status LED.
