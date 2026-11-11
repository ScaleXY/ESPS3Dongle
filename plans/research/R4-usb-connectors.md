# R4: USB connectors and spec rules for the dual-plug (USB-A male + USB-C male) ESP32-S3 dongle

Research date: 2026-11-09. All stock and price figures were read on 2026-11-09 from the LCSC product JSON
(`https://wmsc.lcsc.com/ftps/wm/product/detail?productCode=<C#>`, the API that the LCSC product page uses) and
from the JLCPCB parts API (`https://jlcpcb.com/api/overseas-pcb-order/v1/shoppingCart/smtGood/selectSmtComponentList`).
Prices are USD unit prices at the LCSC price breaks.
Labels: **[V]** = verified in the cited primary source. **[D]** = derived by me from verified numbers (the
arithmetic is shown). **UNVERIFIED** = not confirmed in a primary source.

## 0. Sources and versions

| ID | Document | Version / date | Where |
|----|----------|----------------|-------|
| S1 | USB Type-C Cable and Connector Specification | **Release 2.5, March 2026**. The usb.org library page shows release date 04/08/2026. The ZIP is "USB Type-C 2.5 Release 202603.zip" (28.38 MB) and holds "USB Type-C Spec R2.5 - March 2026.pdf" (442 pp) plus 9 R2.4 ECNs that were folded into R2.5. | https://www.usb.org/document-library/usb-type-cr-cable-and-connector-specification-release-25 ; ZIP: https://www.usb.org/sites/default/files/USB%20Type-C%202.5%20Release%20202603.zip |
| S2 | Universal Serial Bus Specification Revision 2.0 | Original dated April 27, 2000. Taken from the usb.org bundle `usb_20_20250603.zip`, whose library page shows release date 06/03/2025 and which contains the spec plus ECNs. The PDF is `usb_20.pdf` (650 pp). In this file, printed page = PDF page − 28. | https://www.usb.org/document-library/usb-20-specification ; ZIP: https://usb.org/sites/default/files/usb_20_20250603.zip |
| S3 | USB 2.0 ECN "5V Short Circuit Withstand Requirement Change" | listed by usb.org "as of December 22, 2008" | inside the S2 ZIP |
| S4 | USB 2.0 ECN "Device Capacitance" | Dec 22, 2008 | inside the S2 ZIP |
| S5 | USB 2.0 ECN "Suspend Current Limit Changes" | Apr 9, 2008 | inside the S2 ZIP |
| S6 | USB 2.0 ECN "Material Change" | Dec 22, 2008 | inside the S2 ZIP |
| J1 | JLCPCB "PCB Capabilities" | page carries no version; accessed 2026-11-09 | https://jlcpcb.com/capabilities/pcb-capabilities |
| J2 | JLCPCB Help "JLCPCB Gold Fingers" | "Last updated on Sep 18, 2026" | https://jlcpcb.com/help/article/jlcpcb-gold-fingers |
| J3 | JLCPCB blog "Hard Gold PCB Finish ..." | "Published Feb 28, 2026, updated Aug 08, 2026" | https://jlcpcb.com/blog/hard-gold-pcb-finish |
| DS-x | Manufacturer drawings hosted by LCSC (one per part, listed in sections 1 and 3) | revision and date as printed on each drawing | `https://datasheet.lcsc.com/datasheet/pdf/<hash>.pdf?productCode=<C#>` |

No newer Type-C release than R2.5 appears in the usb.org library. IEC 62680-1-3:2026 is based on R2.4.

---

## 1. Q1: USB Type-A MALE plug connectors for a PCB of 14 mm or less

General fact from the drawings: the USB-A plug shell is 12.00 mm wide (S2 Fig. 6-9: "12.00 ± 0.10"). Every
candidate below therefore needs about 12.4–12.8 mm of board width. They all fit a 14 mm board, leaving about
0.6–0.8 mm per side.

LCSC titles every one of these parts "CONN RCPT ..." (receptacle), while its "Gender" attribute says **Male**. I
checked each drawing and they all show plugs. The LCSC title is a naming quirk, so do not filter LCSC searches on it.

None of these parts is a JLCPCB **Basic** part. All are **Extended**.

### 1a. XUNPU USB-212-BCW, LCSC **C720521**. Best stock. SMD, sits in the board edge.
- **[V] DS (XUNPU product sheet, 2 pp, no revision printed):** "W18.80xD12.00xH4.50". Shell width "12.00±0.03", height "4.50±0.03", length 18.80. Width over the shell legs 12.52. Front-to-step distance 14.70.
- **[V]** "Socket category: 公头/Male head", "Operation mode: 卧式/Horizontal", "Welding mode: 前插后贴/SMT" (front legs inserted, rear pads SMT), "Operation life: 5,000 Cycles Min", "DC 30V 1.5A", "≤50mΩ". Page 2 gives a reflow profile with a 260 °C max for 3 s max.
- **[V] Footprint ("P.C.B LAYOUT (copper-side view)"):**
  - 4 SMT pads, 1.00 wide. Pitch 2.00 between the centre pads and 7.00 across the outer pads.
  - 2 peg holes Ø1.20 on 4.50 centres.
  - 2 shell-leg slots, 0.90 wide × 2.50 long, on 11.70 centres. **[D]** Overall footprint width = 11.70 + 0.90 = 12.60 mm.
- **[V] Pin definition:** 1 VBUS, 2 D−, 3 D+, 4 GND.
- **[D] Mounting style:** the side view shows the 4.50 shell straddling the lead plane. The front view gives 3.35 mm from the leg-bend plane to the shell face, so roughly 1.15 mm of shell sits below the PCB top. The shell therefore has to overhang the board edge, with the edge about 14.7 mm behind the plug nose. No cut-out is needed if the plug overhangs the edge. The exact sub-surface depth is **UNVERIFIED**; check it in the 3D model.
- **[V] LCSC:** stock **61,000**. Prices $0.1115 @5, $0.0909 @50, $0.0726 @200, $0.0648 @500, $0.0586 @2500.
- **[V] JLCPCB:** Extended, stock 61,004. "SMT Assembly[Fixture Required]", PCBA "Standard Only", difficulty "High".

### 1b. SHOU HAN AM 180, LCSC **C2681564**. SMD, sits in the board edge.
- **[V] DS (drawing rev A/0, 2019-07-24):**
  - Size: width 12.00±0.10, height 4.50±0.10, length 18.75±0.15.
  - The shell sits **3.20 above and 1.30 below** the lead plane, so it hangs over the board edge. Front to step 14.65.
  - Lead tip 1.80±0.20. Coplanarity 0.08.
- **[V] Footprint:**
  - 4 pads 1.00×2.00 at 2.00/7.00.
  - 2 shell pads 1.00×2.20 on **11.70** centres. **[D]** Outer edges are 12.70 apart.
  - 2 holes Ø1.00 on 4.50 centres.
- **[V] Ratings:** 1.5 A/contact, 30 V DC, 30 mΩ, mate force 3.57 kgf max, unmate 1.02 kgf min. The life test is 5,000 cycles.
- **[V] Materials:** housing "PBT/LCP" (the spec text says "PBT White"). Contacts are gold in the mating area.
- **CONFLICT:** the drawing note in red reads "备注：该产品只能手工焊接" ("Note: this product can only be hand-soldered"). JLCPCB nevertheless lists it as "SMT Assembly[Fixture Required]", difficulty High.
- **[V] LCSC:** stock **14,890**. Prices $0.072 @10, $0.0579 @100, $0.0455 @1000. MOQ 10.
- **[V] JLCPCB:** Extended, stock 14,894.

### 1c. SOFNG USB-07, LCSC **C183610**
- **[V] DS:** "沉板卧式 USB 焊板公头" (sink-mount horizontal board-solder male), "L18.75×W12.0×H4.5mm", "SMT+DIP". Width over the tabs 12.80. Front to step 14.65.
- **[V] Durability:** A grade 6,000 cycles and B grade 5,000 cycles with no load; 5,000 and 4,000 at rated load.
- **[V] Footprint:** 4 pads 1.00 wide at 2.00/7.00. Ø1.50 holes on 4.50. Slots 0.90 wide on **11.75** centres (**[D]** about 12.65 overall).
- **[V] Materials:** contacts C5191 with "镀金 1u″" (1 µin gold). Shell SPCC with 50 µin Ni.
- **ODD:** the sheet gives the "Contact Rating" as "25mA, 24V DC".
- **[V] LCSC:** stock 1,901, $0.0744 @1.
- **UNVERIFIED:** the part number did not come back from the JLCPCB parts API, so it may not be available for JLCPCB assembly.

### 1d. Korean Hroparts U-G-O4DD-W-1, LCSC **C98125**. THT, sits in the board edge.
- **[V] DS (2014/9/29, rev A):** 12.00±0.1 × 4.50±0.1 × 18.75 (20.00 including pins). Width over legs 12.50. Front to step 14.75±0.1.
- **[V] Footprint:** 6 holes Ø1.00 (4 signal at 2.00/7.00, 2 pegs on 4.50). 2 slots 0.80×2.20 on **11.60** centres (**[D]** 12.40 overall).
- **[V] Ratings:** "DC 30V 1.0A". Contacts are "Ag Plated" (silver, not gold) and the housing is nylon. No cycle rating is given.
- **[V] LCSC:** stock 1,385, $0.1151 @5.
- **[V] JLCPCB:** Extended, "Type-A 公 沉板".

### 1e. LAILAN LAIL-TYPE-A-4P-02-WC, LCSC **C55094580**. THT right-angle.
- **[V] DS (rev A):** title "TYPE-A连接器4PIN弯插L18.8（直口）". Shell 12.00±0.2 × 4.50±0.1 × 18.80±0.2. Width over legs 12.52±0.3. Front to step 14.75.
- **[V] Footprint:** signal holes Ø0.90 at 2.00/7.00, peg holes Ø1.00 on 4.50, slots 0.86×2.20 on **11.71** centres (**[D]** about 12.57).
- **[V] Ratings:** 1.5 A, 30 V DC, 30 mΩ, mate 3.5 kgf max, unmate 1 kgf min. LCSC lists "5 thousand cycles".
- **[V] LCSC:** stock 430, $0.2562 @5. JLCPCB: Extended.

### 1f. Hanbo USB-U206-BNS, LCSC **C2962379**. SMT with "harpoon" legs.
- **[V] DS (rev A4):** 12.00 × 4.50. Length 20.15 including tails (18.70 body). Pads 4 × 1.0×2.2 at 2/7. 2 slots 0.5×2.5. Contacts have 1 µin gold on the contact area.
- **[V] LCSC:** stock 160, $0.0501 @10.
- **[V] JLCPCB:** "【沉板焊接】【手工焊接】Type-A 公" (sink-board, hand-soldered).

### Rejected: Ckmtw U-USBAR04P-M001, LCSC C386753
- The datasheet attached to C386753 carries the part number **U-USBAR04P-M002**, which conflicts with the LCSC listing.
- Its shell-leg holes are Ø2.30 on 12.00 centres. **[D]** That spans 14.30 mm, which is more than 14 mm.
- It is rated for only 1,500 cycles and 0–50 °C. Its pin table also lists pin 4 as "ID", which is a datasheet error.

### Not found
I found no USB-A male part at LCSC that is SMT top-mount with its whole shell above the board. All the parts above
are sink-type (沉板) and the board must end under the plug.

Board thickness is not stated on any USB-A drawing. **UNVERIFIED**: whether the leg/slot length suits a 0.8 mm
board. The legs are about 2.5 mm long, which suggests they target a 1.6 mm board.

---

## 2. Q2: PCB-edge ("gold-finger") USB-A plug

### 2a. Spec geometry, S2 Fig. 6-9 "USB Series "A" Plug Interface Drawing" (p. 99, drawing rev C, 2/98)
- **[V] Shell:** outer width **12.00 ± 0.10**, height 4.50 ± 0.10, wall 0.315 ± 0.03 typ, corner R 0.64 ± 0.13 typ. Shell length from datum A (front) to the overmold is **11.75 MIN**. Overmold is 16.0 MAX wide and 8.0 MAX high.
- **[V] Contact surface:** the gap from the inside of the shell top to the plug contact surface is **1.95 ± 0.05**. The receptacle tongue (1.84 ± 0.05) goes into this gap.
- **[V] Contacts:** width **1.00 ± 0.05** (×4). Centres at **±1.0 ± 0.05** (pins 2, 3) and **±3.5 ± 0.05** (pins 1, 4) from centre line B (Section A-A). So the pitch is 2.5 between pins 1–2 and 3–4, and 2.0 between pins 2–3.
- **[V] Contact lengths (Section A-A, from the housing reference face):**
  - the insert extends 8.65 ± 0.19
  - long contacts (pins 1 VBUS, 4 GND) extend 7.41 ± 0.31
  - short contacts (2 D−, 3 D+) extend 6.41 ± 0.31
  - "4.2 MIN GOLD PLATE AREA" measured back from the contact tip
- **[D] Positions from the plug front edge:**
  - VBUS/GND contacts start at 8.65 − 7.41 = **1.24 mm** (worst-case stack ±0.50).
  - D+/D− start at 8.65 − 6.41 = **2.24 mm** (±0.50).
  - Gold extends to at least 1.24 + 4.2 = 5.44 mm from the front.
- **[V] First-mate rule, S2 §7.2.4.1 (p. 177):** "Signal pins are protected from excessive currents during dynamic attach by being recessed in the connector such that the power pins make contact first." Keep the 1.0 mm stagger on the fingers.
- **[V] Shell windows:** two latch windows in the shell top, 2.00 ± 0.13 × 2.50 ± 0.13, start 5.16 ± 0.10 from the front. A PCB plug has no windows, so the receptacle latch springs only add friction.
- **[V] Pin assignment, S2 Table 6-1 (p. 94):** 1 VBUS, 2 D−, 3 D+, 4 GND, Shell = Shield.
- **[D] Pin order on the board:** looking at the contact side with the mating edge pointing away, pin 1 (VBUS) is on the LEFT and pin 4 (GND) on the RIGHT. I derived this from the front views in Fig. 6-7 and Fig. 6-9; check it against a real port.

### 2b. Receptacle, S2 Fig. 6-7 (p. 95, rev C, 2/98)
- **[V] Opening and tongue:** opening 12.50 ± 0.10 × **5.12 ± 0.10**. Tongue width 11.10 ± 0.10 and thickness **1.84 ± 0.05**.
- **[V] Contacts:** on the underside of the tongue, 1.00 ± 0.05 wide, centres at ±1.00 and ±3.50.
- **[V] Retention springs:** they protrude "0.64 ± 0.13 (8)" into the opening.
- **[V] Depths:** depth from the face (datum A) to the internal stop is **8.88 ± 0.20**. The tongue tip is 8.38 ± 0.08 from the stop. The **contact point is 4.98 ± 0.25 from the stop**, which is the plug's front edge when fully mated.
- **[V] Note 1:** "Allow a minimum spacing of 2.67mm between the face of the receptacle and the plug overmold boot."
- **[D] Space under the tongue:** both views put the tongue's underside on the "Center Line of 5.12". The space under the tongue is therefore 5.12/2 = **2.56 mm** nominal. This position is shown on the drawing but not dimensioned, so it is my reading.

### 2c. Required tongue thickness [D]
- A standard plug presents, from the shell's outer bottom to the contact surface: 4.50 − 0.315 − 1.95 = **2.235 mm** nominal. The worst-case stack (±0.10 ±0.03 ±0.05) gives **2.06–2.41 mm**.
- A PCB-edge plug must replace this whole thickness (board plus anything under it) to get the same contact deflection. The cavity limit is about 2.56 mm.
- The spec says nothing about PCB-edge plugs. The free projection of the receptacle spring contacts is **not dimensioned (UNVERIFIED)**, so the minimum workable thickness cannot be proven from the spec.
- **[D] Options:**

  | Build | Finished thickness | Fit |
  |---|---|---|
  | 2.0 mm board alone (JLCPCB tolerance ±10%) | 1.80–2.20 mm | thinner than a standard plug; relies on the bottom latch springs to lift the board |
  | 2.0 mm board + 0.2–0.3 mm shim (sticker or case rib) on the back | about 2.0–2.5 mm | centred on the plug's 2.06–2.41 range |
  | 1.6 mm board + about 0.6 mm shim | about 2.04–2.36 mm | centred on the plug's range |

- 2.4 mm is **not available** at JLCPCB for normal layer counts (see 2d).
- **Secondary corroboration (not a primary source):** the KiCad library at https://github.com/MarcioBulla/PCB-Edge-USB-connector-KiCad-library states "Use 2.0mm PCB thickness for USB type A (regular USB) connector" and "The best option is to use ENIG surface finish."

### 2d. JLCPCB capability
- **[V] J1 board thickness:**
  - "Thickness for FR4 are: 0.4/0.6/0.8/1.0/1.2/1.6/2.0 mm (2.5 mm and above are for 12+ layer PCBs only)".
  - Tolerance "(Thickness≥1.0mm) ± 10%" and "(Thickness<1.0mm) ± 0.1mm".
  - **CONFLICT:** the FAQ on the same page says "JLCPCB offers standard thicknesses from 0.4 mm to 3.2 mm."
- **[V] J1 outline:** CNC routing tolerance "±0.1mm(Precision) and ±0.2mm(Regular)".
- **[V] J2 gold fingers, verbatim:**
  - "only when ENIG is chosen, the fingers for your PCB will be with gold".
  - "Chamfers are not available on boards smaller than 5x5cm."
  - "If there is fingers in your file and it is panel with v-cut, then the fingers can not be made with chamfer since the fingers will be in the middle of the PCB."
  - "The available bevel angles are 30° and 45° ... we recommend prioritizing a 30° bevel."
  - "this area [beveled] can not have copper".
  - "The length and width of a single board or panel with gold fingers shall not be less than 50mm."
  - "The gold finger area must have the solder mask fully opened".
- **UNVERIFIED:** the bevel depth and remaining-thickness table is only an image on J2. A remaining thickness of 0.5 mm appears only in third-party summaries. If it holds, **[D]** a 30° bevel on a 2.0 mm board is (1.0 − 0.25)/tan 30° = 1.30 mm deep. That is longer than the spec's 1.24 mm start of the VBUS/GND contacts, so start the fingers at 1.4 mm or more.
- **[V] J3 hard gold:**
  - JLCPCB "does not offer electroplated hard gold finish". It "applies our precision Electroless Nickel Immersion Gold (ENIG) finish to the gold fingers ... for moderate mating cycles".
  - The same article says ENIG gold is "0.05 - 0.1 micrometer", that it would "wear away in only a couple of dozen insertion cycles", and that "For designs with minimal insertion requirements (fewer than 20 cycles), ENIG or even OSP may suffice."
  - Internal tension: "moderate mating cycles" versus "couple of dozen".

### 2e. Reliability caveats
- **[V] S2 §6.5.4.3 Plug (Male) Contact Materials (p. 101):** the mating area must be one of:
  - Option I: ≥0.05 µm Au over ≥0.70 µm Pd.
  - Option II: ≥0.05 µm Au over ≥0.75 µm PdNi.
  - Option III: **≥0.75 µm (30 µin) Au**.
  - All three over ≥1.25 µm Ni.
  - **[D]** JLCPCB ENIG (0.05–0.1 µm Au, no Pd) meets none of the three options.
- **[V] S2 Table 6-7 (p. 108):** Durability "1,500 insertion/extraction cycles". **[D]** A JLCPCB ENIG finger cannot be expected to reach this (see the J3 statements).
- **[D] Other caveats:**
  - there is no shield or shell, so no early ground-shell contact and no shielding
  - retention is by friction only
  - the fit depends on board-thickness tolerance (±0.2 mm on 2.0 mm)
  - the exposed fingers are live whenever the other end is powered
  - the bevel can only be made on a panel at least 50 × 50 mm with the finger edge on the panel's outer edge

---

## 3. Q3: USB Type-C MALE plugs for board mounting, buyable at LCSC

Spec facts that apply to all of these:
- **[V]** S1 §3.8.1.3 (p. 136): "The durability rating shall be 10,000 cycles minimum for the USB Type-C connector family."
- **[V]** S1 §3.8.1.7 (p. 139) covers "PCB-mount USB Type-C plugs" with these tests:
  - a moment of 0–0.75 Nm "(e.g., 50 N at 15 mm ...)" applied in four directions
  - the plug must disengage or fail at 2.0 Nm (up/down) and 3.5 Nm (left/right)
- **[V]** S1 Fig. 3-3 and Fig. 3-12 (pp. 53, 65): "6.51 MIN. EXPOSED SHELL / GND", so the case must stay at least 6.51 mm back from the plug nose.

All parts below are JLCPCB **Extended**.

### A. Straddle / clamp-plate (夹板). These need a **0.80 mm** board tongue.

**A1. SHOU HAN TYPE-C 24P-GTJB 040, LCSC C3151751**
- **[V] DS (DWG 1024-MAXXXX, rev C 07/20'19):** shell 8.25±0.03 × 2.40±0.03, length 12.20±0.25. Contact-row gap "0.70±0.10 (Contact)" and "0.90±0.10 (Latch)".
- **[V] Layout note:** "Cable Side PCB Layout (Tol: ±0.05, **T=0.80±0.05mm**)". The tongue is 7.90 wide with a nose of 6.10/5.50 by 0.90. There are 2 × 12 pads, 0.30 wide at 0.50 pitch (lengths 1.20/1.50).
- **[V] Contacts:** the pin table shows **B6/B7 absent**; B5 "VCONN" is present.
- **[V] Ratings:** "Durability: 5000 Cycles". **This is below the 10,000 minimum in S1 §3.8.1.3.** 3 A, 20 V, 40 mΩ, −30…+80 °C. Wetting at 265 °C.
- **[V] LCSC:** stock **41,000**. Prices $0.1394 @5, $0.1121 @50, $0.0956 @120, $0.0771 @2400.
- **[V] JLCPCB:** stock 41,248. "SMT Assembly", difficulty High.

**A2. SHOU HAN TYPE-C 24P GTJB, LCSC C49287224**
- **[V] DS sheet 1/3:** 8.25±0.03 × 2.40±0.03 × 12.20±0.25. Same 0.70/0.90 gaps as A1.
- **[V] Ratings:** "Durability:10000 Cycles", 5 A VBUS, 20 V, −40…+85 °C.
- **UNVERIFIED:** board thickness. The PCB-layout sheet is not in the LCSC PDF; the same gaps as A1 suggest 0.8 mm.
- **[V] LCSC:** stock 3,675, $0.2332 @7, $0.1849 @70. JLCPCB stock 3,783.

**A3. Korean Hroparts TYPE-C-31-G-02, LCSC C530606**
- **[V] DS (2021.7.24, rev A):** 8.25±0.03 × 2.40±0.05, overall width 8.50±0.2, length 10.70±0.20 plus 1.60 tails. Contact gap "0.80 +0/−0.1".
- **[V] Layout:** board "0.80" thick, 7.70 wide (6.20 at the nose), 12 pads per side, 0.30×2.00 at 0.50.
- **[V] Contacts:** the pin table lists **B6 D+ and B7 D− as present**.
- **[V] Ratings:** 3.0 A on VBUS/GND, 0.25 A on others. LCP + 30% GF. −55…+85 °C. No cycle rating printed.
- **[V] LCSC:** stock 144, $0.497 @1, $0.2873 @100.

### B. Sink / mid-mount at the board edge (沉板). The shell hangs past the board edge.

**B1. Korean Hroparts TYPE-C-31-G-07, LCSC C530607**
- **[V] DS (2018.08.01, rev A):** 8.25±0.03 × 2.40±0.03, length 13.75, legs 8.50±0.15.
- **[V] Layout:** 2 staggered rows of 12 pads at 0.50 pitch and 2 slots 0.50×1.80 on 8.50 centres.
- **[V] Ratings:** 3.0 A, "Durability: 10,000 cycles Min", 40 mΩ.
- **[V] Contacts:** 24 positions, B6/B7 listed.
- **CONFLICT:** LCSC titles it "CONN RCPT Type-C 24POS SMD"; the JLCPCB description says "Laminated board Male".
- **[V] LCSC:** stock 1,265. Prices $1.0632 @1, $0.6752 @100, $0.6043 @1000.
- **[V] JLCPCB:** "SMT Assembly [Fixture Required]", "Assembly Difficulty High".

**B2. XUNPU TYPE-C-978-WFRP24, LCSC C52741990**
- **[V] DS (rev A):** "TYPE-C 24PIN 沉板公头 双排贴片". 8.25±0.25 × 2.40, length 13.75, footprint 8.70 wide.
- **[V] Ratings:** "Durability: 10000 cycles min", 5 A on VBUS/GND, 0.9 A on others, −55…+85 °C.
- **[V] LCSC:** stock 998, $0.9355 @1.

**B3. hanxia HX TYPE C-M 24P RA-ST, LCSC C55200595**
- **[V] LCSC:** stock 854, $0.4023 @1. LCSC attribute: 10,000 cycles.
- **UNVERIFIED:** dimensions. I did not read the drawing.

### C. 12-contact plugs (fewer contacts than 24P; their USB 2.0 subset does not match Table 3-5, see the note below)

**C1. Korean Hroparts TYPE-C-31-G-10, LCSC C5370430**
- **[V] DS (2021.7.24, rev A), contacts:** A1 GND, A4 VBUS, A5 CC, A6 D+, A7 D−, A10/A11 RX2, B2/B3 TX2, **B5 VCONN**, B9 VBUS, B12 GND, plus 2 latch pins.
- **[V] Mounting:** top-mount SMT, 2.55 above the PCB. Shell 8.25±0.03 × 2.40±0.03, length 13.18, width over legs 10.00.
- **[V] Layout:** 12 pads 0.40×1.80 at 0.50 and 8 pads 1.20 square (9.10 centres, **[D]** about 10.6 overall). "(T=1.4±0.15)" is printed under the layout without explanation (**UNVERIFIED** meaning).
- **[V] Ratings:** "DURABILITY: 10000 CYCLES", "CURRENT RATING: 3A MIN", "CONTACT AREA Au PLATED 30u"Min."
- **[V] LCSC:** stock **2,525**. Prices $1.0135 @1, $0.6316 @100, $0.5456 @1000.
- **[V] JLCPCB:** "SMT Assembly[Fixture Required]".

**C2. Korean Hroparts TYPE-C-31-G-03, LCSC C840338**
- **[V] DS (2017/12/26, rev A), contacts:** A1, A2, A3, A4 VBUS, A5 CC1, A6 Dp1, A7 Dn1, A12 GND, B9 VBUS, B10, B11, B12 GND. **No B5 and no B6/B7.**
- **[V] Mounting:** the shell sits 1.43 below the leg plane (mid-mount). The layout draws the board outline edge immediately above the pad row and the board 11.30 wide. There is a 0.20 dimension at that edge; my reading that it is the pad-to-edge distance is **UNVERIFIED**.
- **[V] Layout:** 12 pads 0.30×1.00 at 0.50, plus GND pads 0.50 and 1.30×2.10 on 9.40 centres.
- **[V] Contacts available for a USB 2.0 device:** VBUS only on A4/B9; GND on A1/A12/B12. Durability not printed.
- **[V] LCSC:** stock 1,725. Prices $0.9309 @1, $0.5523 @100, $0.4671 @1000. JLCPCB: "【沉板焊接】Type-C 公 卧贴".
- **Note:** S1 Table 3-5 lists A4/A9/B4/B9 VBUS and A1/A12/B1/B12 GND among the USB 2.0 signals. S1 §3.2.1 (p. 64) lets a USB 2.0 plug leave positions unpopulated, saying "Only the contacts necessary to support USB PD and USB 2.0 are required in the plug". **UNVERIFIED** whether a plug may omit A9/B4 VBUS or B1 GND. Both 12P parts omit some of them.

---

## 4. Q4: Spec rules (S1 R2.5 unless noted)

### Plug pins for a USB 2.0 direct-connect device
- **[V] Device type.** S1 §1.5 Terms and Abbreviations (p. 31): "Direct connect device: A device with either a captive cable or just a USB Type-C plug (e.g., thumb drive)."
- **[V] Thumb drive.** §3.4.4 (p. 85): "A thumb drive assembly is an assembly that incorporates a USB Type-C plug as its primary USB interface." A thumb drive must answer SOP' cable-identity only when it sinks more than 3 A or supports USB4.
- **[V] CC/VCONN pins.** §4.5.2 (p. 171): "The plug on a direct connect device or a device with a captive cable shall behave as a plug on a cable that is attached at its other end in normal orientation to a receptacle. These devices shall apply and sense CC voltage levels on pin A5 only and pin B5 shall have an impedance above zOPEN, unless it is a VCONN-Powered Accessory, in which case B5 shall have an impedance Ra."
  - Table 4-30 (p. 246): zOPEN is 126 kΩ minimum to GND.
  - **[D]** So put **Rd on A5** and leave **B5 unconnected** (no pull-down, no VCONN load).
- **[V] Rd value.** Table 4-28 (p. 245): Rd = 5.1 kΩ to GND.
  - ±20% gives "Can detect power capability? No".
  - ±10% gives "Yes".
  - Note 2: "total equivalent resistance into the Sink CC pin including all internal resistances".
- **[V] D+/D− pins.**
  - Table 3-4 and Table 3-5 note: "Contacts B6 and B7 should not be present in the USB Type-C plug." D+/D− are A6 (Dp1) and A7 (Dn1).
  - Table 3-5 note 1: "Unused contact locations shall be electrically isolated from power, ground or signaling (i.e., not connected)".
  - Note 3: "Contacts A8 and B8 (SBU1 and SBU2) shall not be connected unless required for a specified purpose."
- **[V] VBUS/GND pins.** §3.2.1 key-features notes 12–13 (p. 47): "All VBUS pins shall be connected together in the USB Type-C plug." "All Ground return pins shall be connected together in the USB Type-C plug."
- **[V] USB 2.0 plug simplification** (p. 64): "Only the contacts necessary to support USB PD and USB 2.0 are required in the plug. All other pin locations may be unpopulated."

### Current
- **[V] Type-C default current.** §4.6.2.1 (p. 226): "Default is the as-configured for high-power operation current value as defined by the USB Specification (500 mA for USB 2.0 ports ...)". The Sink "connects as a USB 2.0 ... device, after which the Sink shall follow the appropriate USB specification."
- **[V] USB 2.0 unit loads.** S2 §7.2.1 (p. 171): "A unit load is defined to be 100 mA." "High-power bus-powered functions ... must draw no more than one unit load upon power-up and may draw up to five unit loads after being configured." "Devices must also ensure that the maximum operating current drawn by a device is one unit load, until configured."
- **[V] Suspend current.** The ECN S5 sets suspend current at 2.5 mA for all devices except ICUSB.
- **[V] Shared rule.** §4.6 (p. 225): "All USB Type-C ports shall tolerate being connected to USB power source supplying default USB power, e.g., a host being connected to a legacy USB charger that always supplies VBUS."

### Shell and shield
- **[V] Type-C cables.**
  - Table 3-11 note 6: "Shield and GND grounds shall be connected within the USB Type-C plug on both ends of the cable assembly."
  - §3.2.1 note 3 (p. 46): "Side latches shall be connected to ground inside the plug."
  - Note 4: EMC springs "shall be connected to the plug shell."
- **UNVERIFIED:** no explicit shell-to-GND rule found for a thumb-drive or direct-connect device itself.
- **[V] USB 2.0.** S2 §6.8 (p. 114): "The shield must be terminated to the connector plug for completed assemblies. The shield and chassis are bonded together."

### Products with an A plug and a C plug; VBUS of two plugs
- **None found:** S1 has no rule that addresses a single product carrying both a Type-A plug and a Type-C plug.
- **[V] Defined legacy cables only.** §3.5 (p. 85): "Only the cables defined within this specification are allowed." The defined USB Type-C to USB 2.0 Standard-A cable (§3.5.2, Table 3-13, p. 87) ties both plugs' VBUS together but puts **Rp 56 kΩ ±5% to VBUS** on A5. As a result a Type-C host never sources VBUS into it (the host sees Rp, not Rd).
- **[V] Adapters.** §2.2 (p. 38): "USB Type-C receptacle to USB legacy adapters are explicitly not defined or allowed. Such adapters would allow many invalid, and potentially unsafe, cable connections to be constructed by users."
- **[V] Sources must see vSafe0V before enabling VBUS.** §4.5.2.2.8 (pp. 185–186):
  - "The port shall not drive VBUS or VCONN."
  - "The port shall apply a load to VBUS to ensure it reaches vSafe0V within tVsafe0V."
  - "The port shall transition to Attached.SRC when VBUS is at vSafe0V and the SRC.Rd state is detected ..."
  - **[D]** A compliant Type-C host will therefore not switch on VBUS if the dongle's C-plug VBUS is already powered from the A-side host. It will, however, load that VBUS (tVsafe0V max 650 ms, Table 4-32).
- **[V] No sourcing on an upstream port.** S2 §7.2.1 (p. 171): "**No device shall supply (source) current on VBUS at its upstream facing port at any time.**"
  - **[D]** The two plugs' VBUS must be isolated, for example by diode-OR or ideal-diode/load switches. Otherwise one host powers the other through the dongle.
- **[V] VBUS capacitance per connector.** ECN S4 changes §7.2.4.2 and Table 7-7: "A USB device is required to expose a capacitance on the VBUS pin of its connector of CRPB ... regardless of whether the USB device is powered or unpowered." CRPB = **1.0–10.0 µF**.
  - **[D]** Put at least 1 µF on each plug's VBUS ahead of any isolation element, and keep each plug at 10 µF or less.
- **[V] Sink VBUS capacitance.** S1 Table 4-3 (p. 153): Sink "VBUS Capacitance ... 10 μF max ... when not in Attached.SNK".
- **[V] Topology prohibition.** S2 §6.4.4 Prohibited Cable Assemblies (p. 92): "A cable assembly with both ends terminated in either Series "A" plugs or Series "B" receptacles. This allows two downstream ports to be directly connected. Note: This prohibition does not prevent using a USB device to provide a bridge between two USB buses."
  - **[D]** With D+/D− and VBUS wired passively in parallel, the dongle plugged into two hosts behaves like that prohibited A-to-A path.

### USB 2.0 electrical items
- **[V] Short-circuit withstand, S2 §7.1.1 (p. 124), original text:** "A USB transceiver is required to withstand a continuous short circuit of D+ and/or D- to VBUS, GND, other data line, or the cable shield at the connector, for a minimum of 24 hours without degradation ... This requirement must be met for max value of VBUS (5.25 V)."
- **[V] Amended by the 2008 ECN (S3):** "VBUS," is struck from the required list. The 5.25 V sentence is deleted and replaced with: "**A USB transceiver is recommended, but not required, to withstand a continuous short of D+ and/or D- to VBUS for a minimum of 24 hours without degradation.**"
  - Shorts to GND, the other data line, and the shield remain **required**.
  - The ECN adds: "OEMs that require short circuit withstand to VBUS can implement the requirement with an external hub or other external protection circuitry."
- **[V] Input capacitance, S2 §7.1.6.1 (p. 142) and Table 7-7 (p. 179):**
  - "The maximum capacitance on an upstream facing port of a full-speed device with a detachable cable (CINUB) is **100 pF** on D+ or D-. This is comprised of up to **75 pF** of lumped capacitance to ground on each line at the transceiver and in the connector and an additional **25 pF** capacitance on each conductor in the transmission line between the receptacle and the transceiver. The difference in capacitance between D+ and D- must be less than **10%**."
  - CEDGE plus transceiver plus trace must be 75 pF or less.
  - "Use of ferrite beads on the D+ or D- lines of full-speed devices is discouraged."
  - Downstream (host) ports may have CIND up to 150 pF.
- **[V] FS driver edges.** S2 Table 7-9 (p. 181): FS rise and fall time 4–20 ns.
- **Stubs:** S2 has no explicit stub-length rule.
  - **[V]** S1 Table 3-4/3-5 notes (receptacle side): "Dp1 and Dp2 may be shorted ... as close to the receptacle as possible to minimize stub length ... The maximum shorting trace length should not exceed 3.5 mm."
  - **[V]** S1 Appendix E.2.2 (p. 395) mentions stubs in direct-connect designs that repurpose the second D+/D− pair: "placing the Alternate Mode switch close to the plug, by adding inductors ..., by AC-terminating the long stubs ..."
  - **[D]** For two plugs in parallel, the second connector's trace and connector capacitance count against the 100 pF / 25 pF budget and the <10% balance. At 12 Mb/s, with edges of at least 4 ns, a few-cm stub is electrically short. That is an engineering estimate, not a spec statement.
- **[V] Pull-up power.** S2 §7.2.1: devices "may not provide power to the pull-up resistor on D+/D- unless VBUS is present". "When VBUS is removed, the device must remove power from the D+/D- pull-up resistor within 10 seconds."

---

## 5. Q5: Existing dual-plug (A male + C male) designs

- **DZ392/pcb-project, "Butterfly USB Hub Dongle"**, https://github.com/DZ392/pcb-project. Hobby KiCad design, no licence shown.
  - **[V]** README: "The board has a male USB-C connector and a male USB-A connector for the laptop side ... **Only one should be connected at a time.**" and "The PCB is 1.2 mm thick to work with the edge-mount USB connectors."
  - **[V]** The schematic has no diode symbols. It uses 9 "+5V" power symbols, and the labels DP/DN each appear 4 times.
  - **[D]** Upstream D+/D− and VBUS look paralleled with no isolation. I inferred this; I did not trace pin by pin.
  - **CONFLICT:** its BOM lists the upstream "USB-C connector" as G-Switch GT-USB-7010ASV, LCSC C2988369. LCSC shows that part as **Female** 16P. Its USB-A male is Hroparts U-G-O4DD-W-1 (C98125). The repo is not a reliable reference.
- **OnlyKey DUO** (commercial, USB-C and USB-A). The vendor calls it "open source", but I found **no published schematic**.
  - Forum (onlykey.discourse.group, user t11, 2023-01-11): "the DUO USB-C part is not a standard adapter". Its USB-C end appears to be a separate shell.
  - **UNVERIFIED:** how VBUS and D+/D− are handled.
- **Commercial dual flash drives** (SanDisk Dual Drive and similar): no teardown with routing details found. **UNVERIFIED.**
- **Conclusion:** I found no open-source dual-plug design that documents VBUS isolation or a D+/D− switch.

---

## 6. UNVERIFIED / conflicts (summary)

1. **Receptacle cavity under the tongue.** The 2.56 mm figure and therefore the PCB-edge thickness target are inferred from the "Center Line of 5.12" on S2 Fig. 6-7. The spring free height is not dimensioned.
2. **JLCPCB bevel depth / remaining thickness.** The table is only an image on J2.
3. **JLCPCB maximum thickness conflict.** The capabilities table gives 0.4–2.0 mm, with 2.5 mm and up only for 12+ layers. The FAQ on the same page says "0.4 mm to 3.2 mm".
4. **JLCPCB ENIG wear conflict.** J3 says ENIG suits "moderate mating cycles" and also that it wears through in "a couple of dozen".
5. **SHOU HAN AM 180 (C2681564)** datasheet says "can only be hand-soldered", yet JLCPCB lists it for SMT assembly.
6. **SHOU HAN TYPE-C 24P-GTJB 040 (C3151751)** is rated 5,000 cycles, below the 10,000 required by S1 §3.8.1.3.
7. **12P Type-C plugs omit some VBUS/GND contacts.** Whether that is spec-compliant is unclear (Table 3-5 vs §3.2.1, p. 64, "may be unpopulated").
8. **LCSC titles** male plugs "CONN RCPT".
9. **C386753 datasheet part number mismatch** (M002 vs M001).
10. **C49287224 board thickness** not given in the LCSC PDF.
11. **SOFNG USB-07** has an odd "25mA, 24V DC" contact rating and was not found in the JLCPCB parts API.
12. **Hroparts C5370430 "(T=1.4±0.15)"** meaning is not stated.
13. **Pin order on a PCB-edge plug** is derived from the front views; check it physically.
14. **Shell-to-GND rule** for a direct-connect device is not stated in S1.

## 7. Recommendations (engineering judgement, for the planner)

- **USB-A end: use a soldered plug, not PCB fingers, if JLCPCB is the fab.**
  - JLCPCB offers ENIG only, no hard gold, no 2.4 mm, and no chamfer on boards under 50×50 mm unless panelised with the finger edge on the outside.
  - Best stocked: **XUNPU USB-212-BCW C720521** (61k, 5k cycles, reflow profile published, footprint about 12.6 mm wide, needs a JLCPCB assembly fixture).
  - Alternative: SHOU HAN AM 180 C2681564 (cheapest, but check the hand-solder-only note with JLCPCB).
  - Board edge sits about 14.7 mm behind the plug nose. Keep the case 11.75 mm or more back from the nose.
- **If you must use PCB fingers:**
  - 2.0 mm board plus about 0.2–0.3 mm back shim (or 1.6 mm plus about 0.6 mm), total about 2.2–2.3 mm.
  - Width 12.0 mm. Pads 1.0 mm wide at ±1.0 and ±3.5 mm.
  - VBUS/GND pads start at 1.4 mm or more from the edge (clear of the bevel); D+/D− pads start about 1.0 mm further back.
  - All pads run to 6.5 mm or more from the edge (contact point is 4.98 ± 0.25).
  - Accept ENIG wear-out (tens of cycles per JLCPCB's own statement).
- **USB-C end: two buyable routes.**
  - (a) A 0.8 mm board (JLCPCB standard) with a straddle plug. **Prefer SHOU HAN C49287224** (10k cycles, but confirm 0.8 mm in its full drawing) or Hroparts C530606 (0.8 mm confirmed, low stock) over C3151751 (5k cycles).
  - (b) Any thickness with a sink or top-mount plug: Hroparts **C5370430** (12P, 10k cycles, 2.5k stock, top-mount SMT, about 10.6 mm wide) or **C530607** (24P, 10k cycles).
  - Note: a 0.8 mm board conflicts with a PCB-finger USB-A (2.0 mm or more) but not with soldered USB-A plugs.
- **C-plug wiring:**
  - A5 to **5.1 kΩ (1%) to GND**.
  - B5 left open (no trace). On C840338 the contact does not exist.
  - A6/A7 are D+/D−. Leave B6/B7 unconnected if present.
  - Join all VBUS pads, and all GND pads.
  - SBU and SS pads unconnected.
- **Two-host survival:**
  - Isolate each plug's VBUS (ideal-diode or Schottky OR), with at least 1 µF on each plug's VBUS ahead of the isolator.
  - Do not wire D+/D− passively in parallel if "both plugged into two hosts" must be handled. Use a USB 2.0 analog switch or mux, selected by which VBUS arrived first. This avoids host-to-host D+/D− contention (S2 §6.4.4 intent) and keeps the unused plug's contacts dead.
  - If you parallel D+/D− anyway, keep both branches short and symmetric. CINUB is 100 pF total and D+/D− must match within 10%.
