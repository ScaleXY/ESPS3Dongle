# V0 — Checks re-done by the lead planner (2026-11-09)

These are the decision-critical facts I re-checked myself after the seven research notes (R1–R7) came back.
Each entry gives the source and what it says. Where a check failed or was blocked, it says so.

## V0.1 ESP32-S3R16V availability (blocker for 16 MB PSRAM)

| Source | Result | How checked |
|---|---|---|
| JLCPCB parts API, `C22458657` | `ESP32-S3R16V`, stock **0**, Extended. Its listed price ($0.0398) is a placeholder. | POST `jlcpcb.com/api/overseas-pcb-order/v1/shoppingCart/smtGood/selectSmtComponentList`, 2026-11-09 |
| LCSC | R3 found "Part not found" for C22458657 | R3 note, 2026-11-09 |
| DigiKey India page, `1904-ESP32-S3R16V-ND` | "Part Status: Active". "This product is not kept in stock at DigiKey." "Manufacturer Standard Lead Time 8 Weeks". The only price break shown is **2,000 units**, packaging "Strip". | WebFetch of digikey.in product page 25811274. The digikey.com page returned 403. |
| Mouser `356-ESP32-S3R16V` | Listed as a "New Product". **Stock not verified**: mouser.com pages time out or return a bot page. A search snippet mentioned ~1,174 in stock at Mouser Italy, but that is unconfirmed. | WebSearch + failed WebFetch |
| Octopart / FindChips | Blocked (403 / 500) | — |
| Espressif Product Selector | ESP32-S3R16V = Mass Production | R1, R2 (products.espressif.com JSON, 2026-11-09) |

**Conclusion:** the part is active, but it can't be ordered at LCSC or JLCPCB today. Plan a procurement gate before layout freeze; see `05-bringup-validation-risks.md`.

## V0.2 JLCPCB stock re-check (all shortlisted parts), 2026-11-09

Source: JLCPCB parts API (same endpoint as V0.1). "Extended" = JLCPCB extended library. **None of these is a Basic part.**

| LCSC # | Part | JLC stock | Price @1 (USD) | JLC package text |
|---|---|---|---|---|
| C2913192 | ESP32-S3 (no PSRAM) | 931 | 2.8032 | QFN-56-EP(7x7) |
| C22458657 | ESP32-S3R16V | **0** | (placeholder) | QFN56-7X7-0.4 |
| C2913194 | ESP32-S3R8 | 12,738 | 3.1467 | QFN-56(7x7) |
| C2928889 | GD25LQ128EWIGR (1.8 V) | 2,527 | 1.1612 | WSON-8-EP(5x6) |
| C2689660 | W25Q128JWPIQ (1.8 V) | 4,741 | 5.2875 | WSON-8-EP(5x6) |
| C190862 | W25Q128JVPIQ (3.3 V) | 12,898 | 3.41 | WSON-8-EP(5x6) |
| C2982923 | GD25Q128EWIGR (3.3 V) | 1,931 | 3.3119 | WSON-8-EP(5x6) |
| C3235557 | TPS2116DRLR | 53,187 | 0.3877 | SOT-583 |
| C128396 | TS3USB221ARSER | 73,371 | 0.2374 | UQFN-10(1.5x2) |
| C15999 | USBLC6-2P6 | 20,214 | 0.3518 | SOT-666-6 |
| C1972959 | TPD2E2U06DRLR | 7,394 | 0.3245 | SOT-553-5 |
| C436349 | TPD1E05U06DPYR (D± ESD, added after review) | 58,418 | 0.0486 | X1SON-2(0.6x1) |
| C48260 | TPD1E10B06DPYR (VBUS TVS, added after review) | 302,833 | 0.0447 | X1-SON-2(0.6x1) |
| C191023 | 1N5819WS (checked for a rev-2 idea that was later dropped) | 4,301,788 | 0.0124 | SOD-323, **Basic** |
| C22399950 | TLV75733PDYDR | 13,662 | 0.2956 | SOT-23-5 |
| C51118 | AP2112K-3.3TRG1 | 12,886 | 0.1829 | SOT-25-5 |
| C141836 | TLV62569DBVR (buck) | 270,466 | 0.0684 | SOT-23-5 |
| C1870451 | Murata XRCGB40M000F1S1BR0 | 3,002 | 0.267 | SMD2016-4P |
| C2757580 | Hosonic E1SB40E00000CE | 2,408 | 0.1346 | SMD2016-4P |
| C17410360 | Johanson 2450AT18D0100002E | 903 | 0.9862 | 1206 |
| C7450310 | Johanson 2450AT18D0100001E | 95 | 1.2136 | SMD-4P |
| C19192917 | Pulse ANT2012LL13R2400A | 3,910 | 0.3631 | SMD-3P, 2x1.2mm |
| C581403 | Pulse W3008C | 9,151 | 1.001 | 1206 |
| C720521 | XUNPU USB-212-BCW (USB-A plug) | 61,004 | 0.1103 | SMD |
| C530607 | Hroparts TYPE-C-31-G-07 (C plug, sink) | 1,265 | 1.0533 | SMD |
| C52741990 | XUNPU TYPE-C-978-WFRP24 (C plug, sink) | 998 | 0.9257 | SMD |
| C49287224 | SHOU HAN TYPE-C 24P GTJB (C plug, straddle) | 3,783 | 0.2311 | SMD |
| C530606 | Hroparts TYPE-C-31-G-02 (C plug, straddle) | 148 | 0.4923 | SMD |
| C5370430 | Hroparts TYPE-C-31-G-10 (C plug, 12P top) | 2,525 | 1.0026 | SMD |
| C552889 | PMEG4005CT,215 (dual Schottky) | 81,632 | 0.0947 | SOT-23 |
| C193342 | PMEG4010CEH,115 | 7,970 | 0.1311 | SOD-123F |
| C41413180 | XL-1615RGBC-2812B-S | 138,702 | 0.0344 | 1.6x1.5mm |
| C115364 | Alps SKSVCAE010 | 20,356 | 0.1454 | 2.8x1.9mm |

## V0.3 JLCPCB 4-layer impedance stackups (board thickness options)

Source: JLCPCB's own impedance-template API, the one behind jlcpcb.com/impedance (`POST jlcpcb.com/api/jlcTools/impedance/selectPageImpedanceDefaultTemplate`, body `{"plateLayerNumber":4,"plateThickness":T}`), 2026-11-09.

| Stackup | Total thickness | L1 / L4 Cu | L1–L2 prepreg | Core |
|---|---|---|---|---|
| JLC04081H-7628 (default) | 0.8 mm | 1 oz | 7628, **0.2104 mm, Dk 4.4** | 0.25 mm, Dk 4.23 |
| JLC04081H-3313 | 0.8 mm | 1 oz | 3313, 0.0994 mm, Dk 4.1 | 0.5 mm, Dk 4.48 |
| JLC04081H-2116 | 0.8 mm | 1 oz | 2116 ×2 (0.124 + 0.1164 mm), Dk 4.16 | 0.2 mm, Dk 4.36 |
| JLC04081H-1080 | 0.8 mm | 1 oz | 1080, 0.0764 mm, Dk 3.91 | 0.55 mm, Dk 4.41 |
| JLC04101H-7628 | 1.0 mm | 1 oz | 7628, 0.2104 mm, Dk 4.4 | 0.5 mm, Dk 4.48 |
| JLC04121H-7628 | 1.2 mm | 1 oz | 7628, 0.2104 mm, Dk 4.4 | 0.6 mm, Dk 4.36 |
| JLC04161H-7628 | 1.6 mm | 1 oz | 7628, 0.2104 mm, Dk 4.4 | 1.065 mm, Dk 4.38 |

The "1H" variants have 0.5 oz inner copper, per the API's `innerCopperThickness: 0.5`.

What this means for the design:
- Every 7628 option has the same L1–L2 dielectric (0.2104 mm, Dk 4.4), so the 50 Ω RF line and the 90 Ω USB pair have the same geometry at any board thickness.
- Espressif's reference stack-up is 8.22 mil (0.209 mm) 7628 with Dk 4.6, giving a 50 Ω coplanar line 12.6 mil wide with a 12.2 mil gap (R2/R7). That is close to JLCPCB's 7628. **Still compute the final widths in JLCPCB's impedance calculator.**

## V0.4 JLCPCB fabrication and assembly limits that affect a 14 mm board

- **Fab outline tolerance** (jlcpcb.com/capabilities page saved by R4, `caps.html`): "±0.1mm(Precision) and ±0.2mm(Regular) for CNC routing, and ±0.4mm for V-scoring". The same page also says high-precision routing needs a "Minimum dimension 50*50mm … and at least 3 tooling holes". Routed board edges need "Copper clearance … ≧0.2 mm". FR4 minimum size is 3 × 3 mm.
- **Board thickness tolerance** (same `caps.html`): "Thickness Tolerance (Thickness≥1.0mm) ± 10%". For boards under 1.0 mm, R4 recorded ±0.1 mm (R4 notes).
- **Assembly** (WebFetch of jlcpcb.com/capabilities/pcb-assembly-capabilities, 2026-11-09):

| | Economic | Standard |
|---|---|---|
| Placement | "Single sided placement" | "Single & double sided placement" |
| Board size, single PCB | "10x10mm - 470x500mm" | "70x70mm - 460x500mm" |
| Edge rails | "Not necessary" | "Necessary" |
| Board thickness | "0.8mm - 1.6mm" | "No limit" |
| Quantity | "2 - 50 pcs" | "2 - 80000 pcs" |
| Other | "Standard stack-up only, special stack-up is not supported" | — |

- R4 recorded the JLCPCB part page for the USB-A plug C720521 as "SMT Assembly[Fixture Required]" and PCBA "Standard Only". If that holds, the order is Standard PCBA, which needs a panel of at least 70 × 70 mm with rails. **Confirm at quote time.**

## V0.5 TPS2116 (VBUS power mux) — read directly from TI SLVSFG1A (Jan 2021, rev May 2021)

- **Pins (DRL, SOT-5X3):** 1 GND, 2/7 VOUT, 3 VIN1, 4 PR1, 5 MODE, 6 VIN2, 8 ST.
- **PR1:** "When PR1 is high VIN1 is selected, and when PR1 is low VIN2 is selected."
- **MODE:** "Device is put into Priority mode when MODE is tied to VIN1."
- **ST:** "Open drain status pin. Pulled low when VIN1 is not being used." §7.3.3: ST is also low "when … both channels are disabled" and "During thermal shutdown".
- **Ratings:** VREF 0.92 / 1.00 / 1.08 V. Recommended VINx 1.6–5.5 V; absolute maximum 6 V. Control pins 0–5.5 V (absolute maximum 6 V).
- **Switching and resistance:**
  - RON 37 typ / 46 max mΩ (5 V, 25 °C); 55 max at −40 to 85 °C.
  - tSW 8 µs at 5 V (RL 10 Ω, CL 10 µF). Soft start 1.7 ms at 5 V.
  - Reverse-current blocking at VOUT − VIN of 42 typ / 70 max mV.
- **Leakage when the other input powers VOUT:** ISTBY,VIN2 is 1.2 µA typ at 25 °C and 2 µA max at −40 to 85 °C (when VIN2 > VIN1 + 0.2 V). It is 0.05 µA typ when VIN1 > VIN2 + 0.1 V.
- **Status pin:** tST "Status pin response time" 5 µs typ (ST pulled high to low, RST = 10 kΩ). VOL,ST ≤ 0.1 V at IST = 1 mA; ST pin leakage ≤ 0.03 µA (−40 to 105 °C), from §6.5 of the same datasheet.
- **Reverse leakage out of VINx** (IREV, VOUT = 5.5 V, VINx = 0 V, VINy open): 0.001 µA typ at 25 °C, 0.05 µA at 85 °C, 0.15 µA at 105 °C.
- **Switching into a lower input (§7.6.1):** "If the output voltage is greater than the input supply being switched to, then the device will not turn on the new channel until the output has discharged down to VIN + VRCB to prevent reverse current flow."
- **When reverse-current blocking is expected (§7.3.4):** "it is recommended to clamp the output or use a high output capacitance (about 100µF). This will prevent voltage spikes from damaging the device due to output inductance."
- **Collapse rate (§7.4):** if the active supply falls faster than 1 V / 10 µs, "the other supply must be at 2.5 V or higher".
- **Input capacitance (§9):** "using an input capacitance (CIN) of 1 μF is sufficient".
- **Package:** RθJA 111.5 °C/W. Package addendum dated 31-Oct-2025 shows TPS2116DRLR as "Active".

## V0.6 GD25LQ128E (1.8 V flash) — GigaDevice datasheet Rev 1.3 (copy downloaded by R3)

- **Exposed pad:** "The exposed metal pad area on the bottom of the package is not connected to any internal signal. It is OK to connect it to the system ground (GND) or leave it floating."
- **Absolute maximum:** "VCC -0.6 to 2.5 V". **So 3.3 V on VDD_SPI would exceed the flash absolute maximum.** This is why the GPIO45 strap matters on 1.8 V builds.
- **WSON 6×5 dimensions** (table text): D 6.00, E 5.00, exposed pad 3.40 × 4.00 (nominal).

## V0.7 ESP32-S3 GPIO DC levels — ESP32-S3 Series Datasheet v2.2, Table 5-4 "DC Characteristics (3.3 V, 25 °C)"

Read from the datasheet text R2 extracted (`r2/text/chip_ds.txt`, p.65). VDD is "voltage from a power pin of a respective power domain".

| Symbol | Parameter | Min | Typ | Max |
|---|---|---|---|---|
| VIH | High-level input voltage | 0.75 × VDD | — | VDD + 0.3 V |
| VIL | Low-level input voltage | −0.3 V | — | 0.25 × VDD |
| VOH | High-level output voltage | 0.8 × VDD | — | — |
| VOL | Low-level output voltage | — | — | 0.1 × VDD |
| RPU / RPD | Internal weak pull-up / pull-down | — | 45 kΩ | — |

- Note 2 of the table: VOH and VOL "are measured using high-impedance load".
- RPU/RPD have **no min/max published**. That is why this plan uses a stronger GPIO45 pull-up than Espressif's 10 kΩ; see `02` §3.3.
- **ADC mapping** (DS pin list, same text file): pin 9 = RTC_GPIO4 = ADC1_CH3; pin 10 = RTC_GPIO5 = ADC1_CH4. ADC1 covers GPIO1–GPIO10 (CH0–CH9); GPIO11 is ADC2_CH0.
- Power-up glitches (DS Table 2-2, same text file): GPIO1–GPIO14, XTAL_32K_P/N and GPIO17 show a "Low-level glitch" of 60 µs.

## V0.8 Not re-checked by me (relying on R-notes)

Everything else is cited to R1–R7, with their own primary-source quotes. Items those notes marked UNVERIFIED stay unverified and are listed in `05-bringup-validation-risks.md` §5.

## V0.9 Independent review (2026-11-09): findings and what changed

A separate read-only reviewer checked every plan file against R1–R7 and V0. All findings below were confirmed against the evidence and fixed in the plan files.

| Severity | Finding | Fix |
|---|---|---|
| High | **TPS2116 PR1 threshold too low.** In priority mode VSYS follows VBUS_A down to the threshold before the 8 µs switchover, so with 3.55 V nominal (3.27 V worst case) 3V3 could dip below 3.0 V. | PR1 changed to 287 k / 100 k (3.87 V nominal, 3.56–4.18 V). VSYS raised to 47 µF (22 µF minimum). Reverse-current-blocking case documented (`02` §2.2). |
| Medium | **Back-feed through rail-clamp ESD.** With USBLC6-2 on each plug, the USJ D+ pull-up (on at reset) would feed the unpowered plug's VBUS through the I/O-to-VBUS diode whenever U5 selects that plug. This corrupts VBUS_C sensing and sources VBUS current. | Data-line ESD changed to GND-referenced TPD1E05U06 ×4, VBUS TVS to TPD1E10B06 ×2 (`02` §2.1, BOM). Firmware switches away from Type-C promptly when powered only from Type-A (`04` §4). |
| Medium | **Back-feed bring-up criterion was wrong.** It would fail a good board: the VBUS_C divider alone draws 0.22 mA. ISTBY had also been misread. | `05` step 2 and `02` §2.2 rewritten (IREV vs ISTBY). |
| Medium | **Unconnected-pin list error.** It listed pin 46 (VDD3P3_CPU) as a GPIO, and called GPIO21/38 JTAG. Unused GPIOs were not handled. | `02` §3.5 and §6 corrected; unused GPIOs get firmware pull-downs. |
| Medium | **Firmware boot step contradicted D4-B.** | `04` §4 step 1 now follows the fitted D4 option. |
| Low | **Tags not backed by notes.** TUSB1106 source; USJ product string; USJ enumeration window; reset persistence of PHY routing (inference); N16R16VA chip identity (inference); IGNORE_NOTFOUND full-speed operation; land-pattern match; C530607 thickness; JLCPCB thickness tolerance; §15.247 not fetched; pre-configuration current; antenna ESD capacitance; trace-antenna claim. | Re-tagged [D]/[U] with the correct source, or reworded. |
| Low | **Arithmetic and layout details.** Cost sum; case-width margin; panel size; stub width vs board thickness; L3 must be GND under RF/crystal (HDG); R16V PSRAM powered from VDD_SPI at first power-up (check R_45 before power); crystal temperature range caps the system; RGB LED out of spec rather than "marginal"; extra open items (VDD_SPI 40 mA budget, inrush, tied grounds, BSS/NOINIT config). | All updated in `01`–`05`. |

## V0.10 TS3USB221A — read directly from TI SCDS277C (Nov 2008, revised Oct 2024)

Copy downloaded by R5 (`r5/ts3usb221a/doc.pdf`), read in full on 2026-11-09.

**Pins (RSE, 10-pin µQFN):** 1 1D+, 2 1D−, 3 2D+, 4 2D−, 5 GND, 6 OE̅ ("Bus-switch enable", active low), 7 D−, 8 D+, 9 S ("Select input"), 10 VCC.

**Truth table (§7.4, Table 7-1):**

| S | OE̅ | Function |
|---|---|---|
| X | H | Disconnect |
| L | L | D = 1D |
| H | L | D = 2D |

**Recommended operating conditions (§5.3):**
- VCC 2.3–3.6 V.
- Control inputs at VCC = 2.7–3.6 V: high-level ≥ **0.46 × VCC**; low-level ≤ **0.25 × VCC**.
- Data I/O 0–5.5 V. "for VI/O > 3.6V, channel RON will be high (up to 100Ω)".

**Absolute maximum (§5.1):** control input voltage −0.5 to 7 V; VCC −0.5 to 4.6 V.

**Electrical characteristics (§5.5):**
- IIN (control inputs): ±1 µA.
- I(OFF) with VCC = 0: ±2 µA.
- ICC 30 µA; 1 µA in low-power mode "OE in high state".
- Cio(ON) 6 / 7.5 pF; RON 3 / 6 Ω.

**Switching (§5.8, VCC 3.3 V):** tON max is 30 ns from S and 17 ns from OE̅; tOFF max is 12 ns from S and 10 ns from OE̅.

**§8.2.1:** "TI recommends that the digital control pins S and OE be pulled up to VCC or down to GND to avoid undesired switch positions that can result from the floating pin."

**Package addendum** (8-Nov-2025): TS3USB221ARSER "Active", −40 to 85 °C.

## V0.11 ESP-IDF v6.1 bootloader recovery options

Source: `components/bootloader/Kconfig.projbuild` at tag v6.1, fetched from raw.githubusercontent.com on 2026-11-09; 1,292 lines.

**`BOOTLOADER_FACTORY_RESET` (L151):** "GPIO triggers factory reset".
- What it does: "clear one or more data partitions; boot from \"factory\" partition".
- Pin `BOOTLOADER_NUM_PIN_FACTORY_RESET`: "range 0 48 if IDF_TARGET_ESP32S3", default 4. "The selected GPIO will be configured as an input with internal pull-up enabled."
- `BOOTLOADER_OTA_DATA_ERASE` selects the factory partition.
- `BOOTLOADER_DATA_FACTORY_RESET` defaults to "nvs"; "Partitions of type \"app\" cannot be specified here."

**`BOOTLOADER_APP_TEST` (L217):** "GPIO triggers boot from test app partition".
- Kconfig: "depends on !BOOTLOADER_APP_ANTI_ROLLBACK".
- Pin `BOOTLOADER_NUM_PIN_APP_TEST`: "range 0 48 if IDF_TARGET_ESP32S3"; "configured as an input with internal pull-up enabled".
- "After the GPIO input is deactivated and the device reboots, the old application will boot. (factory or OTA[x])."
- The trigger level is selectable, low or high.

**`BOOTLOADER_HOLD_TIME_GPIO` (L263):** default 5 s. "The GPIO must be held low continuously for this period of time after reset before a factory reset or test partition boot (as applicable) is performed."

## V0.12 ESP-IDF v6.1 bootloader GPIO-hold loop vs the bootloader watchdog

Source: `components/bootloader_support/src/bootloader_common.c` at tag v6.1, fetched on 2026-11-09 (189 lines).
- `bootloader_common_check_long_hold_gpio_level()` (L37–54) selects the pad, enables input and pull-up, then busy-waits `while (delay_sec > ((esp_log_early_timestamp() - tm_start) / 1000L))`. It does not feed any watchdog.

`components/bootloader/Kconfig.projbuild` v6.1:
- `BOOTLOADER_WDT_TIME_MS` has "default 9000", "range 0 120000".
- Its help text: "Pay attention to options such as reset to factory, trigger test partition and encryption on boot - these options can increase the execution time."

So the recovery-button hold time plus the other bootloader work must stay below the RTC watchdog timeout, or the timeout must be raised.

## V0.13 Second independent review (revision 2), 2026-11-09: findings and what changed

Each finding was confirmed against the evidence before being fixed.

| Severity | Finding | Fix |
|---|---|---|
| High | `ENTER_SERVICE` was unauthenticated. Secure download mode still accepts flash writes (R8), so any local program could downgrade the unit, overwrite the recovery app or wipe the bootloader. | Production requires physical presence (SW1 held) plus Secure Boot V2; otherwise compiled out (`04` §8, `06` §4/§10, `01` D2d, `05` R22). |
| Medium | The downgrade check compared against the running app, which the old recovery app bypasses. | A floor from the valid OTA slots and NVS (`04` §7, `06` §5). |
| Medium | Key revocation would break the bootloader or recovery app, which are never field-updated. | Sign both with every provisioned key (`04` §13, `05` U10/R21). |
| Medium | Protocol v1 payload (60 B) couldn't carry `UPDATE_BEGIN` (324 B) or `GET_INFO` replies. | Header moved into `UPDATE_DATA` and buffered; `GET_INFO` paged; `BUSY` during the blocking erase (`06` §4, `04` §7). |
| Medium | Host tools ignored the recovery PID. | Two WebHID filters and two udev lines (`06` §6.1/§7). |
| Medium | No jig access to the switch's OE. | TP_OE and TP_SEL test pads (`02` §4.3/§6, `03`). |
| Low | Timing called "measured" and used 60 B instead of 56 B; Rev A OE resistor option not assigned per board; hold-time vs watchdog ceiling; VOL,ST tag; ChromeOS over-claimed; stale text (force-download wording, hold-bit reset tag, erase stall on both builds, section references, README "COM options", tag range); recovery app missing the A→C fallback. | All corrected. |
