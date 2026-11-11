# R5 — Support parts for the ESP32-S3 dual-plug USB dongle (research notes)

Research only, nothing ordered or built. Compiled 2026-11-09 (local time UTC+05:30).

**Stock and price snapshot.** Taken from the LCSC JSON endpoint `wmsc.lcsc.com/ftps/wm/product/detail?productCode=<C>` and the JLCPCB parts-search endpoint `jlcpcb.com/api/overseas-pcb-order/v1/shoppingCart/smtGood/selectSmtComponentList`, between 2026-11-08 21:15 and 21:37 UTC (2026-11-09 02:45–03:07 local). The raw JSON for each query is saved under `scratchpad/r5/lcsc-<C>/` and `scratchpad/r5/jlc-*/`. In these notes, "Basic/Extended" means the JLCPCB `componentLibraryType` field (`base` = Basic, `expand` = Extended). "Preferred Extended" means `preferredComponentFlag=true`.

**JLCPCB fees.** Source: JLCPCB PCB Assembly FAQ, https://jlcpcb.com/help/article/pcb-assembly-faqs (page says "Last updated Sep 09, 2026"). It states that extended parts cost "$3 per extended component". It describes Preferred Extended parts as "previously classified as Basic parts", adding that "they are exempt from the Feeders Loading fee for Economic PCB assembly."

**How datasheets were read.** Each PDF was downloaded into its own directory under `scratchpad/r5/<name>/`. Text was extracted with macOS PDFKit (`scratchpad/r5scripts/pdf2txt.js`). Ambiguous tables were rendered to PNG (`scratchpad/r5img/`) and checked by eye. Text extraction mangled µ into m in at least one table (ESD5Z), so every key number below was checked on the rendered page wherever the extraction was ambiguous.

**Sites that blocked automated download.** These manufacturer sites refused automated access: Torex (403), Nexperia (403), ST (HTTP/2 reset), onsemi (blocked), analog.com (timeout), and Richtek (JS-only, so no PDF link). For those parts I used the manufacturer PDF as re-hosted by LCSC, which is the copy linked from the LCSC/JLCPCB product page. **Whether the LCSC copy is the latest manufacturer revision is UNVERIFIED in each such case**, and each one is marked below.

---

## 0. Espressif requirements (primary)

### E1. ESP32-S3 Hardware Design Guidelines (HDG)
- Source: https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32s3/esp-hardware-design-guidelines-en-master-esp32s3.pdf
- Version: "Release master", built "Nov 05, 2026". The latest revision-history entry is "2025-07-03 v1.8" (Table 14, PDF p.41).
- HTML equivalent: https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32s3/schematic-checklist.html (no version shown on the page; GitHub commit 05b77be).

Facts from the HDG:
- **Supply current (§1.3.2 Power Supply, PDF p.8, printed p.5):** "When using a single power supply, the recommended power supply voltage is 3.3 V and the output current is no less than 500 mA." **So ≥ 500 mA is confirmed.**
- Same section: "It is suggested to add an ESD protection diode and at least 10 μF capacitor at the main power entrance."
- Digital supply: VDD3P3_CPU / VDD3P3_RTC "operating voltage range of 3.0 V ~ 3.6 V". Analog supply: VDD3P3 / VDDA "working at 3.0 V ~ 3.6 V" (PDF p.10).
- VDD3P3 rail (PDF p.11): "it is highly recommended to add a 10 μF capacitor to the power rail". Also: "Add an LC circuit to the VDD3P3 power rail … The inductor's rated current is preferably 500 mA and above."
- VDD_SPI at 3.3 V "is driven directly by VDD3P3_RTC through a 14 Ω resistor". Keep "VDD3P3_RTC … above 3.0 V" when it feeds 3.3 V flash/PSRAM (PDF p.10).
- **Crystal (§1.3.5, PDF p.13, printed p.10):** "The ESP32-S3 firmware only supports 40 MHz crystal." and "the accuracy of the selected crystal should be within ±10 ppm."
  - "Please add a series component on the XTAL_P clock trace. Initially, it is suggested to use an inductor of 24 nH".
  - Load capacitors: CL = C1·C4/(C1+C4) + Cstray, with "CL (load capacitance) … found in the crystal's datasheet".
  - Tuning: "Adjust the frequency offset to be within ±10 ppm (recommended)".
  - Amplitude (PDF p.14): "It is recommended that the amplitude of the crystal is greater than 500 mV."
  - Failure note (PDF p.14): "Defects in the manufacturing of crystal (for example, large frequency deviation of more than ±10 ppm, unstable performance within the operating temperature range…)".
- **40 MHz crystal ESR and CL limits:** NOT specified anywhere in the HDG or datasheet v2.2. The only ESR limit in the HDG, "ESR ≤ 70 kΩ", is for the 32.768 kHz RTC crystal. **The ESR requirement for the 40 MHz crystal is UNVERIFIED / not published.** Some forum posts suggest values, but they are not primary sources and are not used here.
- **USB (§1.3.13):** "GPIO19 and GPIO20 can be used as D- and D+ … reserve series resistors (initial value can be 22/33 Ω)". Also: "upon power-up, the USB_D+ signal will fluctuate between high and low states." The USB section says nothing about ESD/TVS for D+/D−.

### E2. ESP32-S3 Series Datasheet v2.2 (2026-03-05)
- Source: https://documentation.espressif.com/esp32-s3_datasheet_en.pdf (redirected from espressif.com).
- Table 5-2 (PDF p.64): "IVDD Cumulative input current 0.5 — — A". Note 4: "If you use a single power supply, the recommended output current is 500 mA or more."
- Table 5-7 (PDF p.66), TX peak current at 3.3 V and 25 °C, "TX current consumption is rated at a 100% duty cycle":
  - 802.11b 1 Mbps @21 dBm: **340 mA**
  - 802.11g 54 Mbps @19 dBm: 291 mA
  - HT20 MCS7: 283 mA
  - HT40 MCS7: 286 mA
  - RX: 88 mA (HT20) and 91 mA (HT40)
- Table 5-8 (PDF p.67): BLE TX peak @21 dBm 335 mA; RX 93 mA.
- Interpretation (not an Espressif statement): the user's assumption of "~500 mA peak" carries margin over the specified 340 mA RF peak. The HDG's 500 mA is a supply-capability requirement, not a consumption figure.

---

## 1. 3.3 V regulator

Conditions: VIN is VBUS (4.75–5.25 V per the brief) minus the OR-ing drop. The LCSC/JLCPCB library type for every candidate is **Extended**. In the whole JLCPCB Basic "LDO Regulators" category only 6 parts exist (queried 2026-11-09), and the only ≥ 500 mA 3.3 V one is AMS1117-3.3.

| Part (LCSC#) | Max Iout | Dropout near 500 mA | Iq | Package / θJA | Cout | VIN range | LCSC stock / price | Source |
|---|---|---|---|---|---|---|---|---|
| **TLV75733PDYDR** (C22399950) | 1 A (Rec. Op.) | 1 A, DYD: 300 typ / 450 max mV (−40..85 °C), 500 max (−40..125). TI: "VDO scales linearly with the output current", so ≈150 typ / ≈225 max at 0.5 A (**derived**) | IGND 25 typ / 31 max µA (25 °C) | SOT-23-5 with thermal pad (DYD, 2.9 × 1.6 mm). RθJA 92.5 °C/W JEDEC, 60.3 EVM | 1–200 µF | 1.45–5.5 V (abs 6.0) | 13,660; $0.2974 @5+ | TI SBVS322C (Rev C, Mar 2024), §5.3–5.5, §7.1.2 — https://www.ti.com/lit/ds/symlink/tlv757p.pdf |
| TLV75533PDBVR (C404027) | 500 mA (Rec. Op.); ICL 560 min / 720 / 865 mA | 500 mA, 3.3 ≤ VOUT < 5: **150 typ / 215 max mV** (−40..85), 238 max (−40..125) | IGND 25 typ, 31 max (25 °C), 33 max (−40..85) | SOT-23-5 (DBV). RθJA **231.1** JEDEC, 100.8 EVM | 1–200 µF; "effective capacitance at the pin is greater than 0.47µF" | 1.45–5.5 V (abs 6.0) | 92,275; $0.1227 @5+ | TI SBVS320D (Rev D, Sep 2024), §5.3–5.5 — https://www.ti.com/lit/ds/symlink/tlv755p.pdf |
| AP2112K-3.3TRG1 (C51118) | **600 mA min** ("Maximum Output Current … 600 — — mA") | 300 mA: 125/200 mV; 600 mA: **250/400 mV** (typ/max). 500 mA not specified; ≈208/333 interpolated (**derived**) | 55 typ / 80 max µA | SOT25. θJA **184 °C/W** ("No Heatsink") | 1 µF ceramic ("Stable with 1.0µF") | 2.5–6.0 V (abs 6.5) | 8,565 (JLC 12,891); $0.1848 @5+ | Diodes DS39724 Rev. 2-2 (June 2017), pp.3 & 8 — https://www.diodes.com/assets/Datasheets/AP2112.pdf |
| ME6211C33M5G-N (C82942) | 500 mA **typical**, not min (V30 p.11: value sits in the 典型值 column) | Only 100 mA (120 mV typ) and 200 mA (260 mV typ) specified; no max; nothing at 500 mA | 30 typ / 60 max µA (V30). V14 front page says "40uA (TYP.)" — **conflict** | SOT23-5. θJA **210 °C/W**, Pd 0.60 W (V30). V14 gives only "SOT23 300 mW" — **conflict** | CIN = CL = 1 µF (test condition) | V30: 1.2–6.0 V; V14: 2–6.0 V; abs 6.5 V | 339,600; $0.063 @10+ | Microne V30 (CN), LCSC-hosted, upload 2025-05-30, pp.6, 11 — https://atta.szlcsc.com/upload/public/pdf/source/20250530/60CE153C45E33CC3B9EA78DF6714D2EA.pdf ; V14 (LCSC pdfUrl for C82942) |
| RT9013-33GB (C47773) | 500 mA; ILIM **0.5 min** / 0.6 / 0.85 A (RLOAD = 0, 2.7–5.5 V) | 500 mA: **250 typ / 400 max mV** | 25 / 50 µA | SOT-23-5. θJA **250 °C/W** (JEDEC 51-3 low-K) | 1 µF ("Output Only 1μF Capacitor Required") | 2.2–5.5 V (abs 6 V) | 337,645; $0.1387 @5+ | Richtek DS9013-10 (April 2011), LCSC copy p.3. **Whether a newer revision exists is UNVERIFIED** (richtek.com page is JS-only) |
| XC6220B331MR-G (C86534) | 1000 min / 1200 typ mA | 300 mA: 60/95 mV; 1 A: 655 max mV (Voltage Chart 2, 3.30 V row) | HS mode 50 / 108 µA; PS mode 8 / 18 µA | SOT-25. Pd 600 mW PCB-mounted, θJA **166.67 °C/W** (40 × 40 mm board, Tj max 125 °C) | For 3.0–3.5 V: CL 4.7 µF with CIN ≥ 10 µF (CL 47 µF if CIN = 4.7 µF) | 1.6–6.0 V (abs 6.5) | 17,955; $0.4803 @1+ | Torex ETR0341-013, LCSC copy pp.4, 8, 26, 27. **Latest revision UNVERIFIED** (torexsemi.com 403) |
| RT9080-33GJ5 (C841192) | 600 mA | 600 mA, VOUT ≥ 3 V: 0.31 / 0.53 V | 2 / 4 µA | TSOT-23-5. θJA 230.6 °C/W (JEDEC 51-7) | "minimum … 1μF effective" | 1.2–5.5 V (abs 6.5) | 20,790; $0.1208 @5+ | Richtek DS9080-05 (June 2017), LCSC copy p.4. Latest revision UNVERIFIED |
| AP7361C-33 (C151007 DFN; C460397 SOT89-5) | 1 A | 300 mA: 90/140 mV; 1 A: 340 typ mV | 60 / 80 µA | U-DFN3030-8 θJA 70; SOT89-5 150; SOT223 110 °C/W | "Stable with … ≥ 2.2µF" | 2.2–6.0 V (abs 6.5) | DFN 1,289 ($0.80); SOT89-5 **7**; SOT-223 C500795 **0** | Diodes DS37274 Rev. 5-2 (Oct 2020), pp.4–6 — https://www.diodes.com/assets/Datasheets/AP7361C.pdf (page carries an "ADVANCE INFORMATION NEW PRODUCT" banner) |
| AMS1117-3.3 (C6186) — **only Basic ≥ 500 mA option** | 1 A | 1.1 typ / **1.3 max V** at 0.8 A | 5 / 11 **mA** | SOT-223. θJA 90 °C/W (46–90 depending on copper) | 22 µF tantalum recommended; minimum load 5/10 mA | abs 15 V | 1,099,635; JLC $0.206 | AMS datasheet (no revision; PDF created 2009), LCSC copy p.2 |

### Dissipation (Pd = (VIN − 3.3 V) × I; Iq contribution < 1 mW for all except AMS1117)

- **5.0 V in:** 120 mA gives **0.204 W**; 500 mA gives **0.850 W**.
- **4.5 V in** (e.g. after a Schottky): 0.144 W and 0.600 W.

ΔTj = Pd × θJA:

| Part / package / θJA | 5.0 V, 120 mA | 5.0 V, 500 mA | 4.5 V, 120 mA | 4.5 V, 500 mA |
|---|---|---|---|---|
| ME6211 SOT-23-5, 210 | 42.8 °C | 178.5 °C | 30.2 °C | 126.0 °C |
| AP2112K SOT25, 184 | 37.5 | 156.4 | 26.5 | 110.4 |
| RT9013 SOT-23-5, 250 | 51.0 | 212.5 | 36.0 | 150.0 |
| TLV755P DBV, 231.1 (JEDEC) | 47.1 | 196.4 | 33.3 | 138.7 |
| TLV757P DYD, 92.5 (JEDEC) / 60.3 (EVM) | 18.9 / 12.3 | 78.6 / 51.3 | 13.3 / 8.7 | 55.5 / 36.2 |
| XC6220 SOT-25, 166.7 | 34.0 | 141.7 | 24.0 | 100.0 |
| RT9080 TSOT-23-5, 230.6 | 47.0 | 196.0 | 33.2 | 138.4 |
| AP7361C U-DFN3030, 70 | 14.3 | 59.5 | 10.1 | 42.0 |

**Judgement (engineering interpretation, not a datasheet statement):**
- At ~120 mA average, every SOT-23 LDO is fine at 25 °C ambient. In a closed plastic case at an assumed 50 °C internal ambient (assumption, UNVERIFIED), the plain SOT-23-5 parts reach Tj ≈ 90–100 °C. That works but leaves little margin.
- A *sustained* 500 mA is not survivable in plain SOT-23-5 (ΔT 156–213 °C at 5 V). It is acceptable only because 500 mA is a short TX burst, and short bursts heat less than sustained current (thermal time constant not quantified, UNVERIFIED).
- The thermally enhanced TLV75733PDYDR, or a buck, removes the concern.
- **Board caveat:** every θJA above was measured on JEDEC or EVM boards much larger than a 14 mm-wide dongle, so real θJA will be higher (magnitude UNVERIFIED).
- **Dropout check at the worst case:**
  - VBUS 4.75 V − PMEG4010CEH VF 0.49 V max (0.5 A) = 4.26 V. That leaves ≥ 0.96 V headroom, enough for every LDO above except AMS1117.
  - AMS1117 needs up to 1.3 V, which gives ≈ 2.96 V out. That is below the ESP32-S3 3.0 V minimum, so it is **not recommended**.
  - Cable and connector drop before VBUS reaches the dongle was not assessed (UNVERIFIED).
- **VIN ceiling:** TLV755P/TLV757P/RT9013/RT9080 are rated 5.5 V operating (6.0–6.5 V abs). AP2112/ME6211/XC6220 operate to 6.0 V. The USB Type-C vSafe5V upper limit (believed 5.5 V) is **UNVERIFIED here (spec not read)**.

### Buck alternative

**TLV62569DBVR (C141836)** — TI SLVSDG1C (Rev C, Oct 2017), https://www.ti.com/lit/ds/symlink/tlv62569.pdf
- VIN 2.5–5.5 V (abs 6 V); IOUT 2 A; fSW "1.5 MHz" (VOUT = 2.5 V); IQ 35 µA.
- RθJA DBV 188.2 °C/W.
- Standard LC from Table 4: L = 2.2 µH with COUT = 10 µF.
- Efficiency from Fig. 9 (3.3 V output, VIN = 5 V): ≈ 94–95 % from ~30 mA to 1 A. **These are values read off the graph, so they are approximate.**
- Losses: ≈ 0.021 W at 120 mA, ≈ 0.096 W at 500 mA (ΔT ≈ 4 °C and ≈ 18 °C if all of it were in the IC).
- Stock 263,455; $0.0691 @5+; Extended.

**TPS62A01DRLR (C5157937)** — smaller alternative. TI SLUSEG9E (Rev E, Jun 2024)
- SOT-563 (1.6 × 1.6 mm); 1 A; "2400 kHz" FPWM (VIN 5 V, VOUT 1.8 V); IQ 20 µA.
- L 1.0 µH effective; COUT ≥ 10 µF for VOUT ≥ 1.8 V; RθJA 157.3 °C/W; VIN 2.5–5.5 V (abs 6.5 V).
- The datasheet has **no 3.3 V-out efficiency curve**.
- Stock 26,140; $0.0752 @5+.

Buck caveats (interpretation):
- adds an inductor and switching noise next to a 2.4 GHz radio;
- the HDG already asks for an LC filter on VDD3P3;
- TI's examples use 2.2 µH / 1 µH inductors at roughly 2.5 × 2.0 mm (DFE252012F in the TPS62A01 example; part availability not checked).

---

## 2. VBUS OR-ing

### 2a. Schottky diodes ≥ 1 A (all Extended unless noted)

| Part (LCSC#) | Package | VF @ 0.5 A | IR @ ~5 V | Thermal | LCSC stock / price | Source |
|---|---|---|---|---|---|---|
| PMEG4010CEH,115 (C193342) | SOD-123F | **420 typ / 490 max mV** | **0.8 µA typ @5 V** (no max); 6 typ / 50 max µA @40 V | Rth(j-a) 330 K/W standard footprint; 150 K/W with 1 cm² cathode pad | 7,545; $0.1324 @5+ | NXP/Nexperia "Rev. 02 — 22 March 2007", LCSC copy, Tables 7–8. Latest revision UNVERIFIED (nexperia.com 403) |
| PMEG2010AEH-QX (C20235827) | SOD-123F | 0.5 A not tabled. 100 mA: 265/290 mV; 1 A: 380/430 mV | **15 typ / 50 max µA @5 V** | 330 / 150 K/W | 2,985; $0.1473 @5+ | Nexperia data sheet "13 June 2023", LCSC copy, Tables 6–7 (20 V part) |
| CUS10S30,H3F (C146335) | USC / SOD-323 | **0.31 V typ** (no max). 1 A: 0.37 / 0.45 V | 0.2 / 0.5 mA @30 V. Fig. 8.2 curve: ≈0.07 mA @5 V/25 °C, ≈0.4 mA @50 °C, ≈2 mA @75 °C (**curve readings**) | IO 1 A on FR4 25.4 × 25.4 mm with 645 mm² Cu; Tj max 125 °C; VR(DC) 20 V | 397,560; $0.0478 @10+ | Toshiba Rev.2.0 2014-04-07, LCSC copy pp.1–3 |
| 1N5819WS (Hottech) (C191023) — **JLC Basic** | SOD-323 | Table gives only ≤ 0.60 V @1 A | ≤ 0.5 mA @40 V (25 °C), 10 mA @100 °C. Family curve ≈ 8 µA @5 V/25 °C | Table says "Typical Thermal Resistance 80 °C/W", but the derating curve shows Pd 250 mW @25 °C falling to 0 @125 °C (≈ 400 °C/W). **Internal conflict** | 3,212,100; $0.0125 @50+ | Hottech datasheet (no revision/date), LCSC copy pp.1–2 |
| B5819W SL (CJ) (C8598) — **JLC Basic** | SOD-123 | ≤ 0.6 V @1 A (0.5 A not tabled) | ≤ 1 mA @40 V | Pd 500 mW; RθJA 200 °C/W; Tj 125 °C | 363,100; $0.0265 @20+ | JCET "D, Mar, 2015", LCSC copy p.1 |
| B5819WS (hongjiacheng) (C7420331) — **Preferred Extended** | SOD-323 | LCSC param 600 mV @1 A | 1 mA @40 V (LCSC param) | — | 4,251,450 | Datasheet not examined in detail |
| RB160M-30TR (C183502) | SOD-123 | 0.39 / 0.46 V | 3 / 20 µA @15 V | — | 2,740 | ROHM "2015.09 – Rev.D" is watermarked **"Not Recommended for New Designs"**. Excluded |

Dual common-cathode Schottky, ≥ 0.5 A per diode:

- **PMEG4005CT,215 (C552889)**, SOT-23, Nexperia "24 September 2019", LCSC copy:
  - common cathode (pin 3 "K1, K2 common cathode");
  - per diode IF(AV) 0.5 A, rated as a "square-wave pulse; δ = 0.5; f = 20 kHz; Tamb ≤ 85 °C" on a **ceramic PCB** (Note 1);
  - VF @0.5 A: 410/470 mV; IR @10 V: 7/20 µA; IR @40 V: 27/100 µA;
  - Ptot (FR4, standard footprint) 330 mW; Rth(j-a) 375 K/W (FR4 standard) / 310 (1 cm²) / 270 (ceramic);
  - stock 81,630; $0.0954 @5+.
  - **Caveat:** the 0.5 A rating is not a DC rating on FR4. At 0.5 A DC: 0.235 W × 375 K/W ≈ 88 °C rise (computed).
- **PMEG2005CT,215 (C282562)**, 20 V, Nexperia "26 June 2023":
  - VF @0.5 A: 360/390 mV; IR @10 V: 11/40 µA; same thermal ratings;
  - stock 2,755; $0.19.

Back-feed behaviour of a Schottky OR (interpretation): with both hosts live, the diode on the higher VBUS conducts. The reverse-biased diode passes only its leakage (µA at 25 °C for PMEG4010CEH; up to mA at 75 °C for CUS10S30 per its curve). That leakage also charges the VBUS pin of an *unplugged* plug. A bleed resistor or the VBUS TVS leakage keeps that pin low (suggestion, not verified).

### 2b. Ideal-diode / power-mux ICs (all Extended)

**TPS2116DRLR (C3235557)** — TI SLVSFG1A (Jan 2021, rev May 2021), https://www.ti.com/lit/ds/symlink/tps2116.pdf
- 1.6–5.5 V (abs 6 V); "Maximum continuous current: 2.5 A"; pulsed 4 A (1 ms, 2 %).
- RON 37 typ / 46 max mΩ (5 V, 25 °C), 55 max (−40..85 °C).
- SOT (8), 2.1 × 1.6 mm; RθJA 111.5 °C/W.
- Truth table (§7.3.1): Priority mode uses VIN1 when VPR1 > VREF, otherwise VIN2. Manual mode toggles PR1 by GPIO. With MODE = low and PR1 = low, "the higher voltage supply between VIN1 and VIN2 is passed to the output".
- Switchover is "break-before-make", tSW 8 µs typ at 5 V (RL 10 Ω, CL 10 µF).
- RCB: "Once the output voltage is higher than the input voltage by 42mV (VRCB,R), the device will shut off" (VRCB,R 42 typ / 70 max mV).
- Unselected input: standby current only, e.g. ISTBY,VIN2 1.2 µA typ / 2 µA max (−40..85 °C) when VIN1 powers VOUT.
- ST pin (open drain): high when VIN1 is used, low when VIN2 is used.
- Soft start 1.7 ms at 5 V. Collapse rule: if the active supply falls faster than 1 V/10 µs, "the other supply must be at 2.5 V or higher".
- Stock 53,204; $0.3915 @1+.

**LM66200DRLR (C3235556)** — TI SLVSG04 (Nov 2021)
- Dual ideal diode; 1.6–5.5 V; 2.5 A per channel; RON 37/46 mΩ (5 V, 25 °C).
- SOT-583 2.1 × 1.6 mm; RθJA 111.5 °C/W.
- "When both inputs are applied to the device, the highest voltage is used to power the output." The lower supply sees "50 nA (typical)" standby.
- tSW 8 µs; RCB 42/70 mV.
- **No hysteresis specified for the input comparison**, so behaviour when two hosts sit at almost the same 5 V (possible toggling with an 8 µs dropout each time) is **UNVERIFIED**.
- Stock 21,531; $0.4213 @1+.

**TPS2121RUXR (C485916)** — TI SLVSEA3F (Aug 2020)
- 2.8–22 V (abs 24 V); RON 56 typ / 70 max mΩ (≥ 5 V, 25 °C).
- Current limit adjustable 1–4.5 A; Iq 200 µA.
- VQFN-HR-12, 2.0 × 2.5 mm; RθJA 72.2 °C/W. In §7.4 this value sits in the TPS2121 column, which is labelled "RNW (PKG FAM)".
- Priority (PR1) or highest-voltage operation. "Each channel has the always on reverse current blocking." Fast RCB threshold IRCB 0.2/1/2 A, response 10 µs.
- Stock 25,028; $0.9249 @1+.
- Over-voltage tolerant. Larger and pricier than TPS2116.

**LM66100DCKR (C2869734)** — TI SLVSEZ8A (Jun 2019)
- 1.5–5.5 V; 1.5 A; RON 79 typ / 95 max mΩ (5 V); SC-70-6; RθJA 192 °C/W.
- For two-source ORing the datasheet ties each CE to the opposite source. **Datasheet warns (§9.2.2.1):** "when both input voltages are the same for a long period of time, then both devices will completely turn off, powering down the output load". That is exactly the two-hosts-at-5 V case. The datasheet's fix uses the ST pin and a pull-up.
- Stock 5,760; $0.2089 @5+.

**MAX40200AUK+T (C2649430, SOT-23-5) / MAX40200ANS+T (C3227637, 4-bump WLP ≈ 0.7 × 0.7 mm)** — Maxim 19-8728 Rev 2 (12/19), LCSC copy (analog.com timed out; latest revision UNVERIFIED)
- 1.5–5.5 V; 1 A.
- VFWD @500 mA: SOT 97 typ / 175 max mV; WLP 43 / 89 mV.
- θJA SOT 255.9, WLP 104.41 °C/W.
- "Reverse Turn-Off Threshold VOFF_REV … 20 mV"; reverse quiescent current 0.072 typ / ±1.5 max µA.
- Interpretation: reverse current can flow before the 20 mV reverse threshold is reached; its magnitude is UNVERIFIED.
- Stock 2,560 (SOT) and 6,937 (WLP); ≈ $0.77–0.79.

---

## 3. USB 2.0 2:1 analog switches (full speed only). No Basic or Preferred part exists in either JLC analog-switch category

**TS3USB221ARSER (C128396)** — TI SCDS277C (Nov 2008, rev Oct 2024)
- UQFN-10, 2 × 1.5 mm.
- VCC 2.3–3.6 V (abs 4.6 V). I/O "5.5V tolerant", but "for VI/O > 3.6V, channel RON will be high (up to 100Ω)"; I/O abs max 7 V.
- RON 3 typ / 6 max Ω; Cio(ON) 6 / 7.5 pF; Cio(OFF) 3.5 / 5 pF.
- IOZ ±1–2 µA; **I(OFF) power-off leakage (VCC = 0 V) ±2 µA** (VI/O 0–3.6 V).
- Truth table: OE = H means "Disconnect"; S = L gives D = 1D; S = H gives D = 2D. Low-power mode with OE high: 1 µA.
- "TI recommends that the digital control pins S and OE be pulled up to VCC or down to GND to avoid undesired switch positions that can result from the floating pin." No internal pulls are specified.
- ESD: I/O to GND HBM ±12 kV.
- Stock 72,310; $0.24 @5+.

**FSUSB42UMX (C11145) / FSUSB42MUX (C11355, MSOP-10)** — Fairchild FSUSB42 Rev. 1.25, dated "July 2015" on the first datasheet page, behind an onsemi cover. LCSC copy (onsemi blocked)
- UMLP-10, 1.4 × 1.8 mm. VCC 2.4–4.4 V.
- RON 3.9 typ / 6.5 max Ω at VCC 3.0 V; CON 3.7 pF typ.
- IOFF (VCC = 0, VSW 0–4.3 V) ±2 µA. "special circuitry … where the VCC supply is powered-off (VCC=0 V), which allows the device to withstand an over-voltage condition."
- Note 5: "The control input must be held HIGH or LOW and it must not float."
- Stock 19,918 (UMX) and 34,468 (MUX, JLC); $0.48 (UMX).

**PI3USB102EZLEX (C154899)** — Diodes DS44731 Rev 2-2 (Aug 2022), https://www.diodes.com/assets/Datasheets/PI3USB102E.pdf
- TQFN-10, 1.3 × 1.6 × 0.75 mm. VDD 3.0–5.5 V.
- RON 4.0 / 5.0 Ω; CON 6.0 / 7.0 pF; COFF (M/D) 3.0 / 4.0 pF.
- **IOFF power-off leakage 5 µA max** (VDD = 0, Vin 0–3.3 V). SEL/OE input current ±100 nA (no pulls stated).
- Truth table: OE = H gives Hi-Z. OVP on the common port above VDD + 0.2 V.
- Stock 5,357; $0.2836.

**WAS7227Q-10/TR (C213170)** — Will Semi Rev. 1.3 (May 2019), LCSC copy
- WQFN-10, 1.4 × 1.8 mm. VCC 2.5–5.5 V.
- RON 5.0 / 7.5 Ω (VCC 3.0 V); CON 3.8 pF; COFF 2.5 pF; IOFF ±1 µA (test conditions per its Fig. 2, not checked).
- "withstand a VBUS short to D+ or D- when the USB devices are either powered off or on". "Control input must be held high or Low, it must not float."
- Stock 9,930; $0.2188 @5+.

**CH442E (C150097)** — WCH CH440/442/… manual "版本：3E" (version 3E), LCSC copy
- MSOP-10, 3 × 3 mm body. At VCC 3.3 V: VCC range 2.1–3.9 V.
- RON 5/8 Ω at 0 V, but **17/30 Ω at 2.0 V** signal.
- CONQ 4 / 10 pF; COFFQ 3 / 8 pF.
- **Abs max VIO = VCC + 0.4 V**, so I/O are not tolerant above VCC and there is no power-off isolation spec.
- EN# = 1 means all off.
- Stock 11,035; $0.2188. **Not recommended.**

**WAS4729QB (C506157)** — Will Semi Rev. 1.1 (Jan 2018)
- An **audio** dual SPDT. CON **80 pF**, COFF 50 pF, BW 80 MHz.
- **Not recommended** for USB.

**TS3USB30ERSWR (C73880)** — TI SCDS255G (rev Oct 2024)
- VCC 3–4.3 V; RON 6 / 10 Ω; Cio(ON) 7.5 pF; IOFF ±2 µA.
- Stock 11,849; $0.53. No advantage over the TS3USB221A here.

Design observations (interpretation, not datasheet text):
- None of the switches defines its control-pin state by itself, so S/OE need resistors.
- If the default is "disconnected" (OE pulled high), the ROM USB-Serial/JTAG download would not reach a host until firmware drives OE. A hardware default — OE pulled low, and S driven by the power-mux ST pin or VBUS-detect logic — keeps ROM download working. That last point is unverified.
- The switch RON (3–6 Ω) adds to the HDG's 22/33 Ω series resistors.
- The USB 2.0 FS driver-impedance and capacitance limits were **not checked against the USB 2.0 spec (UNVERIFIED)**.

---

## 4. ESD for D+/D− and VBUS. JLC Basic TVS = only PSM712, P6SMB6.8CA, SMBJ6.5CA (none suitable for USB data)

**USBLC6-2SC6 (C7519) / USBLC6-2P6 (C15999)** — ST Doc ID 11265 Rev 5 (Oct 2011), LCSC copy (st.com blocked; newer revision UNVERIFIED)
- IRM 10 / 150 nA @VRM 5.25 V.
- VBR (VBUS-GND) ≥ 6 V. VCL 12 V @1 A and 17 V @5 A (8/20 µs).
- **Ci/o-GND 2.5 typ / 3.5 max pF @1.65 V**; Ci/o-i/o 1.2 / 1.7 pF.
- Front page: "IEC 61000-4-2 level 4: 15 kV (air discharge), 8 kV (contact discharge)". Table 1 lists VPP 15 kV for both air and contact.
- Packages: SOT23-6L (2.9 × 2.8 mm) and SOT-666 (1.6 × 1.6 mm). Covers 2 data lines plus a VBUS rail clamp.
- Stock: SC6 34,375 ($0.164 @5+); P6 20,210 ($0.356 @5+).

**TPD2E2U06DRLR (C1972959)** — TI SLLSEG9C (rev Dec 2019)
- 2 channels; DRL 1.60 × 1.20 mm.
- **CL 1.5 typ / 1.9 max pF**; VRWM 5.5 V; VBR ≥ 6.5 V; leakage ≤ 10 nA.
- IEC ±25 kV contact / ±30 kV air; 5.5 A 8/20 µs.
- Stock 7,140; $0.3275 @5+.

**TPD4E05U06DQAR (C138714)** — TI SLVSBO7O (rev Aug 2024)
- 4 channels; USON-10, 2.5 × 1.0 mm.
- **CL 0.5 pF typ**; VRWM 5.5 V; VBR 6.5–8.5 V; leakage 0.01 / 10 nA.
- IEC ±12 kV contact / ±15 kV air.
- Stock 4,370 (JLC 17,096); $0.0843 @5+.

**TPD1E05U06DPYR (C436349)** — same datasheet
- 1 channel; 1.0 × 0.6 mm; **0.42 pF**.
- Stock 56,970; $0.0491 @10+.

**SRV05-4.TCT (C13612)** — Semtech, "Revision 08/11/04"
- 4 lines plus a power rail; "3pF typical"; IEC ±15 kV air / ±8 kV contact.
- Stock 64,850.
- **Preferred Extended** clone SRV05-4 (hongjiacheng C7420376): stock 261,150; its datasheet was not examined.

**USBLC6-4SC6 (C111212)** — ST DocID11068 Rev 7 (Nov 2015)
- 4 lines plus VBUS; 3 pF typ. Stock 14,500.

**PRTR5V0U2X,215 (C12333)** — Nexperia "1 April 2023"
- SOT-143B; C(I/O-GND) 1 pF; VRWM 5.5 V; IEC 8 kV contact.
- Stock 77,695; $0.27.

**ESD5V3U2U-03LRH (C535205)** — JLC stock **0**, no LCSC record. Not available.

**PESD5V0X1BL (Nexperia C26385746)** — Nexperia "2 May 2024": Cd 0.9 / 1.3 pF (0 V), 0.8 / 1.2 pF (5 V); VRWM 5 V; IRM 1 / 100 nA. LCSC stock **0**. Not available (clones only).

VBUS TVS:

- **TPD1E10B06DPYR (C48260)** — TI SLLSEB1G (rev Aug 2024)
  - bidirectional; VRWM 5.5 V; ILEAK ≤ 100 nA @5 V;
  - VClamp 10 V @1 A and 14 V @5 A; CIO 12 pF; VBR ≥ 6 V;
  - IEC ±30 kV contact/air; 1.0 × 0.6 mm;
  - stock 299,140; $0.045.
- **ESD5Z5.0T1G (C82044)** — onsemi Rev. 13 (Dec 2014), LCSC copy
  - VRWM 5.0 V; IR ≤ 0.05 µA (unit confirmed as µA on the rendered table); VBR ≥ 6.2 V;
  - VC 11.6 V @5 A, 18.6 V max @9.4 A; Ppk 174 W; C 80 pF; SOD-523;
  - stock 289,120; $0.035.
  - **Caveat:** VRWM 5.0 V is below the 5.25 V VBUS maximum.

Placement note (interpretation): the two plugs sit at opposite ends of the dongle, so a single 4-channel array cannot sit close to both connectors. Per-connector parts are preferable. Rail-clamp arrays (USBLC6, SRV05-4) tie their VBUS pin to one rail. Connect it to that connector's own VBUS, or use rail-less TPD parts.

---

## 5. 40 MHz crystal

The Espressif requirement is **±10 ppm** (HDG §1.3.5). Whether that figure includes temperature drift is not stated, though the HDG lists "unstable performance within the operating temperature range" among defects. Safest choice: tolerance ±10 ppm **and** stability ±10 ppm. ESR and CL: no Espressif limit (see E1). **No 40 MHz crystal is in the JLC Basic library** (the 6 Basic crystals are 8/12/16/25 MHz and 32.768 kHz) and no 40 MHz part is Preferred.

| Part (LCSC#) | Size | CL | ESR max | Tolerance / stability | Operating T | Other | Stock / price | Source |
|---|---|---|---|---|---|---|---|---|
| **Murata XRCGB40M000F1S1BR0** (C1870451) | 2.0 × 1.6 | 8.0 pF | 50 Ω | ±10 ppm / ±10 ppm (−30..+85 °C) | −30..+85 °C | Drive 300 µW max; aging ±2 ppm/yr | 2,855; $0.2697 @5+ | Murata spec JGC49-4244, Issue Date Nov 21, 2019, LCSC copy pp.1–2 |
| **Hosonic E1SB40E00000CE** (C2757580) | 2016 | 10 pF | 60 Ω | ±10 / ±10 ppm | −20..+85 °C | DL 50 typ / 100 max µW; C0 ≤ 2 pF; aging ±2 ppm | 2,405; $0.1326 @5+ | Hosonic spec (version 10C0, issued 2021-03-05), LCSC copy p.3 |
| TXC 8Z40000055 (C706805) | 2.5 × 2.0 | 10 pF | 40 Ω | ±10 / ±10 ppm | **−25..+70 °C** | DL 100 µW; C0 0.8 pF | 5,455; $0.1614 @5+ | TXC spec Rev A5 (4-Aug-2014), LCSC copy p.4 |
| YXC X252040MMB4SI (C2885592) | 2.50 × 2.05 | 10 pF (LCSC param) | 60 Ω (family table, 31–48 MHz) | ±10 ppm (LCSC) / **±20 ppm** (LCSC, matches the family "±20ppm") | −40..+85 °C | DL 10–200 µW; C0 ≤ 3 pF | **21,575**; $0.1412 @5+ | YXC YSX221SL family sheet (no revision/date). **Part-number decoding is not in the sheet**, so CL/tolerance come from the LCSC page |
| Epson Q22FA12800332 (C255899) | FA-128 2.0 × 1.6 | 12 pF (LCSC) | 60 Ω (26–54 MHz) | ±10 ppm (RF-reference grade); f_tem ±10 ppm over −20..+75 °C | −40..+85 °C | DL 100 µW max | 870; $0.2464 | Epson FA-128 family sheet (©2020). Q-number decoding absent |
| TXC 8Y40000001 (C409319) | 2016 | ? | 80 Ω (family) | ? | ? | — | 2,935 | **Specs for this part number UNVERIFIED** (catalog page only; LCSC params blank) |

---

## 6. Optional UI parts (no Basic or Preferred addressable LEDs; no Basic ≤ 3 × 2 mm tact switches)

### RGB LEDs

**XL-1615RGBC-2812B-S (C41413180)**
- 1.6 × 1.5 × 0.6 mm; VDD 3.5–5.5 V.
- **VIH 0.55 × VDD min**, VIL 0.3 × VDD; IDD 0.35 mA.
- Stock 102,320 (JLC 138,702); $0.0351 @20+.
- Source: XINGLIGHT datasheet (version not stated), LCSC copy.
- Fit: at VDD = 5.25 V, VIH = 2.89 V, so a 3.3 V GPIO can drive DIN directly. That is my calculation; the ESP32-S3 VOH under µA load was not checked.

**SK6805-EC15 (C2890035)**
- 1.5 × 1.5 × 0.65 mm; VDD 3.7–5.5 V; Topt −40..+80 °C.
- **VIH 0.78 × VDD**, so a level shifter is needed when VDD ≥ 4.3 V. Below 3.7 V the part is out of spec.
- Stock 244,400; $0.0964 @5+.
- Source: OPSCO SK6805-EC15-001 Rev A/1 (2025-08-07).

**WS2812C-2020-V6 (C55109522)**
- 2.0 × 2.0 mm. VDD "+3.3~+5.3 V", listed under maximum ratings.
- VIH 0.55 VDD; VIL 0.7 V max.
- Stock 229,245; $0.1004 @5+.
- **Risk:** USB VBUS can approach the 5.3 V limit. On the 3.3 V rail, LDO tolerance can put VDD below the 3.3 V minimum.

**WS2812B-2020 (C965555)** — stock **0**.

### Tactile switches

**Alps SKSVCAE010 (C115364)** — Alps product drawing dated Jun 17, 2014, plus spec KSV-706 "FOR REFERENCE" (LCSC copy)
- Body 2.8 ± 0.1 × 1.9 ± 0.1 mm; 3.0 mm including terminals; 0.5 mm high.
- Land pattern 3.1 × 1.73 mm. Top push.
- Rating 12 V DC 50 mA; operating −30..85 °C. 1.63 N per the LCSC parameter.
- Stock 19,025; $0.1467 @5+.

**Alps SKSWCEE010 (C202371)** — Alps web sheet printed 2018-03-21
- Body "3±0.05 × 2±0.1" mm, but **terminals 3.5 mm and land 3.8 mm**.
- 1.8 N; travel 0.13 mm; 300,000 cycles; IP67 equivalent; −30..+85 °C.
- Stock 13,390; $0.1026 @5+.

**SHOU HAN TS2306A 200gf 002 (C5363482)**
- JLC lists it as "SMD,3x2mm", but the SHOU HAN drawing (2022.05.18, rev A1) shows 3.5 mm length including terminals and a recommended layout 3.8 mm long.
- 200 ± 50 gf; 100k cycles.
- Stock 349,160; $0.0554 @10+.

**XUNPU TS-1088-AR02016 (C720477)** — **JLC Basic**
- 3.9 × 3.0 mm, so it exceeds the size limit.
- Stock 484,680.

**Side-actuated ≤ 3 × 2 mm:** none verified (not found in the scan). UNVERIFIED.

---

## 7. UNVERIFIED / conflicts (summary)
1. ESR/CL limits for the 40 MHz crystal: no Espressif primary source. Whether "±10 ppm" includes temperature stability is ambiguous.
2. ME6211:
   - 500 mA is a *typical* value, not a guaranteed minimum;
   - no dropout spec above 200 mA;
   - V14 vs V30 conflicts: Iq 40 vs 30 µA typ; accuracy ±2 % vs ±1 %; short-circuit current 150 vs 70 mA; thermal data 300 mW "SOT23" vs 210 °C/W / 0.60 W "SOT23-5"; operating range "−40~+150" vs −40~+85 °C.
3. Hottech 1N5819WS thermal-resistance conflict: 80 °C/W in the table vs ≈ 400 °C/W implied by the derating curve.
4. Values derived rather than quoted: AP2112 dropout at 500 mA (interpolated), TLV757P VDO at 500 mA (linear scaling per TI), and buck efficiency (read from a graph).
5. LCSC-hosted copies whose latest revision is unconfirmed: XC6220, RT9013, RT9080, PMEG4010CEH (2007 NXP copy), USBLC6-2 (2011), SRV05-4 (2004), ESD5Z (2014), MAX40200, FSUSB42.
6. LM66200 and MAX40200 behaviour when both hosts sit at nearly equal VBUS (no hysteresis spec).
7. USB 2.0 / Type-C limits not checked: vSafe5V maximum, VBUS capacitance and inrush limits, FS driver impedance and line capacitance.
8. Real θJA on a 14 mm-wide board; the case-internal ambient temperature.
9. Out of scope but important: a USB-C sink plug normally needs Rd on CC to get VBUS from a Type-C source (not verified here), and plugging two hosts at once ties their grounds together.

## 8. Picks
- **LDO:** TLV75733PDYDR (C22399950). Alternate: AP2112K-3.3TRG1 (C51118). Buck comparison: TLV62569DBVR (C141836), or TPS62A01DRLR (C5157937) if space matters.
- **OR-ing:** TPS2116DRLR (C3235557), priority mode, with ST driving the USB-switch select. Alternate: PMEG4005CT,215 (C552889) dual common-cathode, or 2 × PMEG4010CEH (C193342). Cheapest Basic fallback: 2 × 1N5819WS (C191023), thermally marginal at 0.5 A.
- **USB switch:** TS3USB221ARSER (C128396). Alternate: FSUSB42UMX (C11145), or PI3USB102EZLEX (C154899).
- **ESD:** USBLC6-2P6 (C15999) × 2, one per plug (covers D+, D−, VBUS). Alternate: TPD2E2U06DRLR (C1972959) × 2 plus TPD1E10B06DPYR (C48260) × 2 on VBUS.
- **Crystal:** Murata XRCGB40M000F1S1BR0 (C1870451). Alternate: Hosonic E1SB40E00000CE (C2757580). 2520 high-stock option: YXC X252040MMB4SI (C2885592), but ±20 ppm stability.
- **RGB LED:** XL-1615RGBC-2812B-S (C41413180). Alternate: SK6805-EC15 (C2890035), which needs a level shifter.
- **Tact switch:** Alps SKSVCAE010 (C115364). Alternate: Alps SKSWCEE010 (C202371).
- **JLC Basic among all candidates:** only AMS1117-3.3 (C6186, rejected for dropout), 1N5819WS (C191023), B5819W SL (C8598), and TS-1088-AR02016 (C720477, too big). **None of the primary picks is Basic.** Preferred Extended options seen: B5819WS (C7420331), SRV05-4 (C7420376), and H5VU25U (C7420374; datasheet not examined).
