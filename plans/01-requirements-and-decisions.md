# 01 — Requirements, assumptions and decisions for you

Date: 2026-11-09. Status: **plan only** (no schematic or layout yet).

**Revision 2 (2026-11-09):**
- Both plugs are HID-only; the Type-C COM-port mode is dropped.
- A host tool puts the dongle into programming mode (both paths).
- The tool runs on Windows, macOS, Linux and in a browser/ChromeOS, and end users will use it.
- Changed below: REQ-7, REQ-8, new REQ-13/14, D2 (now decided, with sub-decisions D2a–D2d), D3, D4, D11.

Evidence tags used in all plan files:
- **[V]** verified from a primary source. The tag names the research note (R1–R9, V0) that quotes it.
- **[D]** derived or calculated by me from verified numbers.
- **[E]** an estimate that must be confirmed in layout or bring-up.
- **[U]** unverified or open. A test or quote must close it.

Research notes are in `plans/research/`.

---

## 1. Requirements

### 1.1 What you specified (your words, plus your answers to my four questions)

| ID | Requirement | Source |
|---|---|---|
| REQ-1 | MCU is an ESP32-S3 | you |
| REQ-2 | 16 MB flash | you |
| REQ-3 | 16 MB PSRAM | you |
| REQ-4 | Must be buildable without the PSRAM | you |
| REQ-5 | Dongle form factor, inside a plastic case | you |
| REQ-6 | Male USB-A plug on one end, male USB-C plug on the other; each plugs directly into a host port | you + answer |
| REQ-7 | **Both plugs are HID-only in normal use.** Changed in revision 2; this replaces "Type-A always HID". | you |
| REQ-8 | **A host-side tool can put the dongle into programming mode.** Changed in revision 2; the COM-port mode is dropped. You chose both paths: an HID-only updater for normal updates, plus a serial/esptool path for development and recovery. | you + answer |
| REQ-9 | PCB width ≤ 14 mm | you |
| REQ-10 | One host at a time. If both ends are plugged into two hosts, nothing may be damaged and VBUS must not back-feed. Both ends do **not** have to work at once. | answer |
| REQ-11 | Wi-Fi and/or BLE used, so an on-board 2.4 GHz antenna is needed | answer |
| REQ-12 | Fabrication and assembly at JLCPCB, parts from LCSC | answer |
| REQ-13 | The programming tool runs on Windows, macOS, Linux and in a browser/ChromeOS | answer (rev 2) |
| REQ-14 | End users run updates. This needs a simple GUI or web page, signed firmware and safe rollback. | answer (rev 2) |

### 1.2 Not specified, so I made a placeholder assumption (change any of these)

| ID | Topic | Placeholder used in this plan |
|---|---|---|
| A-1 | Board length | Not constrained. Estimated PCB length ≈ 36–42 mm, plus the plug overhangs [E]. See `03`. |
| A-2 | Operating environment | Indoor consumer use, 0–40 °C room. This matters because ESP32-S3R16V is rated to only 65 °C ambient [V R1]. |
| A-3 | Will it be sold? | Unknown. A chip-down radio needs its own FCC/CE certification [V R7]. See `05` §6. |
| A-4 | Quantity | Unknown. Rev A prototypes assumed at 5–10 boards per build variant. |
| A-5 | HID type | Unknown. The plan supports keyboard, mouse or custom HID, and keeps boot protocol (BIOS/UEFI) possible. |
| A-6 | User controls | None specified. Revision 2 adds a pin-hole recovery button (D11). |
| A-7 | EDA tool | Unknown. See D13. |

---

## 2. Decisions for you

Each decision lists the options, the evidence and my recommendation (**Rec.**). If you are happy with a recommendation, you don't need to do anything for it.

The first four decisions shape the schematic. The others are part choices or resistor options.

### D1 — How to get 16 MB PSRAM *and* a "no PSRAM" build (REQ-3, REQ-4)

Facts:
- A discrete 16 MB PSRAM that ESP-IDF supports and LCSC stocks does not exist today [V R3].
  - 16 MB **quad** PSRAM: ESP-IDF v6.1's quad driver only recognises 2, 4 and 8 MB [V R3, source `esp_psram_impl_ap_quad.c`].
  - The 16 MB **octal** part (AP Memory APS12808L, 6 × 8 mm BGA-24) has 0 stock at LCSC, and ESP-IDF doesn't list it as supported [V R3].
- Espressif sells the same QFN56 die with 16 MB octal PSRAM inside: **ESP32-S3R16V** [V R1].
  - Status: Mass Production [V R1, R2].
  - VDD_SPI is 1.8 V, so the flash must be a 1.8 V part [V R1, R2, R3].
  - Rated −40 to 65 °C ambient. It reaches 85 °C only with PSRAM ECC on, which costs 1/16 of the PSRAM [V R1].
- All ESP32-S3 chip variants share one land pattern, except the S3FH4R2 [V R1, quoting the datasheet §7].

| Option | What it is | For | Against |
|---|---|---|---|
| **D1-A (Rec.)** | One PCB, swap the SoC. **ESP32-S3R16V** in the PSRAM build, plain **ESP32-S3** in the no-PSRAM build. Both use the same 1.8 V 16 MB quad flash and the same GPIO45 pull-up. | Matches Espressif's ESP32-S3-WROOM-1-N16R16VA: 16 MB quad flash plus 16 MB in-package octal PSRAM at VDD_SPI = 1.8 V [V R2]. That its chip is the R16V is inferred from the datasheet footnote and block diagram [D R2]. No extra memory package on the 14 mm board. `CONFIG_SPIRAM_IGNORE_NOTFOUND` lets one image keep booting without PSRAM [V R3]; full-speed operation of that image on a plain S3 is untested [U R3]. | **R16V is not orderable at LCSC/JLCPCB (0 stock).** DigiKey lists it as non-stock with an 8-week lead time and a 2,000-unit price break; Mouser stock is unverified [V V0.1]. You would buy it elsewhere and consign it to JLCPCB. R16V is limited to 65 °C ambient. GPIO33–37 and GPIO47/48 can't be used on either build. |
| D1-B (fallback) | Same PCB with **ESP32-S3R8** (8 MB octal PSRAM, 3.3 V), a 3.3 V flash, and the GPIO45 pull-up left off | Fully stocked (12,738 at JLCPCB) [V V0.2] | Only **8 MB** PSRAM. Also limited to 65 °C ambient [V R1]. |
| D1-C | Plain ESP32-S3 plus a discrete 8 MB QSPI PSRAM (APS6404L-3SQR) that can be left unpopulated | Literally "populate without PSRAM"; stocked [V R3] | Only 8 MB. ESP-IDF docs say only "Espressif branded PSRAM chips" are supported [V R3]. Adds a package to a 14 mm board. |
| D1-D | Discrete 16 MB octal PSRAM (APS12808L, BGA-24) | 16 MB | 0 stock, BGA, 11 extra signals, not supported by ESP-IDF [V R3]. **Rejected.** |

Also rejected:
- Espressif modules don't fit the width. WROOM-1 is 18.0 mm wide and MINI-1 is 15.4 mm [V R7].
- ESP32-S3-PICO-1 SiP tops out at 8 MB flash [V R1, R7].

> **Your call:** Is a "no-PSRAM build" that swaps the chip (rather than leaving a PSRAM chip off) acceptable? If yes, D1-A, with D1-B as the fallback if R16V can't be bought.

### D2 — Programming architecture (decided in revision 2; details in `06`)

**Decided:**
- **UPDATE** goes over a vendor HID interface: signed image, A/B slots, automatic rollback [V R8].
- **SERVICE** (serial/esptool) is kept for development and the lab [V R6, R9].
- A **RECOVERY** app sits behind a pin-hole button [V V0.11].
- Neither host ever sees a COM port unless SERVICE is requested (D3/D4).

| Sub-decision | Options | Rec. |
|---|---|---|
| **D2a** Host tools | Web updater (WebHID + Web Serial) · Python CLI · Rust CLI · native app (Electron or Tauri) | **Web updater for end users + Python CLI for engineers/CI.** Add a native app only if Firefox/Safari or offline users matter. WebHID runs only in Chromium 89+ on Windows/macOS/Linux/ChromeOS, not Android/Firefox/Safari [V R9]. |
| **D2b** End-user recovery | (a) Recovery app in a "test" partition + pin-hole button; costs eFuse anti-rollback [V V0.11, R8] · (b) No recovery app, keep eFuse anti-rollback (max 16 increments); recovery = rollback + SERVICE/lab only [V R8] | **(a)**. A downgrade check in the updater replaces eFuse anti-rollback (`06` §5). |
| **D2c** Production security | (a) Secure Boot V2 + secure download mode + JTAG off; flash encryption optional · (b) Signed apps without hardware Secure Boot (no boot-time check on S3, no key rotation) [V R8] | **(a)**, provisioned on sacrificial units first. Flash encryption only if firmware confidentiality matters, because it complicates ROM recovery [V R8]. |
| **D2d** SERVICE on production units | (a) Enabled when Secure Boot V2 is on, the user holds SW1 when the command arrives, and the pad-hold test passes · (b) Lab-only (a jig grounds TP_OE, or OE pull-down units) | **(a) with the physical-presence gate if the DevKit test passes, else (b).** Without the gate, any local program could use secure download mode's flash writes to downgrade or wipe the unit [V R8; D]. |

### D3 — Routing D+/D− from two plugs to the one PHY

| Option | For | Against |
|---|---|---|
| **D3-A (Rec.)** TI **TS3USB221A** 2:1 analog switch (UQFN-10, 2 × 1.5 mm, $0.24, 73k in stock) [V R5, V0.2]. Revision 2: the select line follows the plug that powers the board (TPS2116 ST), and OE keeps both plugs disconnected until firmware is ready (`02` §4.3). | No host sees the USB-Serial/JTAG device unless SERVICE mode is requested, which meets REQ-7 on both plugs. With two hosts plugged in, their data lines are never tied together. | One IC and two resistors. The data-line ESD parts must be GND-referenced (rail-less): with a rail-clamp part, the USJ D+ pull-up would back-feed the unpowered plug's VBUS through the ESD diode [D]. See `02` §2.1. |
| D3-B Both plugs wired in parallel to GPIO19/20 | Fewer parts | At every power-up the USB-Serial/JTAG device (VID 0x303A, PID 0x1001) is exposed to the Type-A host, because USJ owns the PHY at reset [V R6]. Whether a host fully enumerates it in that short window is unmeasured [U], but it breaks REQ-7 strictly. With two hosts, both D+/D− pairs are tied together, which USB 2.0 §6.4.4's ban on port-to-port connections exists to prevent [V R4]. A rail-referenced ESD part on the unplugged side can back-feed through its VBUS pin [D]. |

### D4 — What the plugs do at power-up (switch OE resistor option)

| Option | For | Against |
|---|---|---|
| **D4-B (Rec. in revision 2)** OE pulled **high**: nothing is connected until firmware enables it | Neither host ever sees USB-Serial/JTAG (REQ-7 on both plugs). No D+ pull-up is ever powered on an unpowered plug. | ROM USB download needs firmware help (SERVICE mode with pad hold [U]). End-user recovery uses the recovery app instead (D2b). |
| D4-A OE pulled **low**: the powering plug is connected from power-up | ROM download over USB with no firmware involvement. Handy on **development units**. | The host sees USB-Serial/JTAG for the first few hundred ms of every power-up, then a re-enumeration [U: duration] |

Both footprints go on every board. **Rec.:** fit the pull-up (D4-B) on production units and the pull-down (D4-A) on development units.

### D5 — Combining the two VBUS inputs (REQ-10)

| Option | For | Against |
|---|---|---|
| **D5-A (Rec.)** TI **TPS2116** power mux in priority mode, VIN1 = VBUS_A [V V0.5] | 37/46 mΩ. Reverse-current blocking. Reverse leakage out of an input pin is 0.001 µA typ at 25 °C (IREV), and the unselected input draws ≤ 2 µA of standby current [V V0.5]. The **ST** pin tells firmware whether Type-A is powering the board. $0.39, 53k in stock [V V0.2]. | Abs max 6 V and recommended maximum 5.5 V [V V0.5]. Fine for USB 5 V, but no over-voltage protection. |
| D5-B Dual common-cathode Schottky PMEG4005CT (SOT-23) | $0.09, simplest | 0.41–0.47 V drop [V R5]. Leakage rises with temperature. No status signal. |

USB 2.0 §7.2.1 says "No device shall supply (source) current on VBUS at its upstream facing port at any time" [V R4], so some OR-ing is mandatory.

### D6 — 3.3 V regulator (ties into the R16V's 65 °C limit)

| Option | Loss, 5.0 → 3.3 V | For | Against |
|---|---|---|---|
| **D6-A (Rec. for Rev A)** LDO **TLV75733PDYDR** (1 A, thermal-pad SOT-23-5) | 0.20 W at 120 mA, 0.85 W at a 500 mA burst [D R5] | Simple and quiet, 2 parts | About 34 % of input power becomes heat inside the case [D] |
| D6-B Buck **TLV62569DBVR** (1.5 MHz, 2.2 µH) | About 0.02 W at 120 mA (≈94–95 % efficiency, read from TI's graph) [V/D R5] | Much less heat, which helps the R16V | Inductor and switching noise next to a 2.4 GHz radio; about 5 more parts |

> **Your call:** How hard will Wi-Fi be used (continuous traffic vs occasional)? Continuous use with R16V points to D6-B. Either way, the thermal test in `05` decides it for Rev B.

### D7 — USB-C plug part (all are JLCPCB Extended parts)

| Option | Part | Facts |
|---|---|---|
| **D7-A (Rec.)** | Hroparts TYPE-C-31-G-07, **C530607** | 24-pin sink-mount male plug, "Durability: 10,000 cycles Min". As a sink-mount part it shouldn't constrain board thickness, and its drawing gives none [D R4, U: confirm]. 1,265 in stock, $1.05 [V R4, V0.2]. JLCPCB marks it "Fixture Required" [V R4]. |
| D7-B | XUNPU TYPE-C-978-WFRP24, **C52741990** | 24-pin sink-mount, 10,000 cycles. 998 in stock, $0.93 [V R4, V0.2]. |
| D7-C | SHOU HAN TYPE-C 24P GTJB, **C49287224** | Straddle mount, 10,000 cycles, $0.23 [V R4]. Needs a 0.8 mm board; its ±0.05 mm thickness spec is UNVERIFIED for this exact part. JLCPCB's thickness tolerance for boards under 1.0 mm is ±0.1 mm [V R4], twice the ±0.05 mm a straddle plug expects. **Fit risk.** |

Rejected:
- C3151751: 5,000 cycles, below the Type-C minimum of 10,000 [V R4].
- 12-contact plugs C5370430 and C840338: they omit some VBUS/GND contacts, and spec compliance is unclear [U R4].

### D8 — USB-A plug

- **D8-A (Rec.):** XUNPU **USB-212-BCW, C720521**. Metal shell, 12.00 × 4.50 × 18.80 mm, about 12.6 mm footprint width, 5,000 cycles, 61k in stock, $0.11 [V R4, V0.2].
- D8-B: gold-finger PCB-edge plug, like a YubiKey. **Rejected for JLCPCB:**
  - ENIG only, no hard gold, and ENIG "can wear through" in "a couple of dozen insertion cycles", while USB 2.0 asks for 1,500 [V R4].
  - Chamfers aren't available on boards under 50 × 50 mm.
  - It needs about 2.2–2.3 mm total tongue thickness [D R4].

### D9 — Board thickness (4-layer)

- **D9-A (Rec.):** **1.6 mm, JLC04161H-7628.** Stiffer, which matters for a stick that gets levered while plugged in [E]. Works with the D7-A/B sink plugs.
- D9-B: 0.8 mm, JLC04081H-7628. Only needed for the straddle plug D7-C.

Every JLCPCB 7628 4-layer option has the same 0.2104 mm (Dk 4.4) L1–L2 dielectric, so the 50 Ω line and 90 Ω pair on L1 keep the same geometry [V V0.3]. The chip-side RF stub references L3, and the L1–L3 distance does change with thickness (≈ 1.29 mm at 1.6 mm, ≈ 0.48 mm at 0.8 mm), so its width must be recomputed [D].

### D10 — 2.4 GHz antenna

| Option | Part | Facts |
|---|---|---|
| **D10-A (Rec.)** | Johanson **2450AT18D0100002E**, C17410360 (AEC-Q200 twin of 2450AT18D0100001E) | 3.2 × 1.6 mm. Datasheet lists "Center-edge mount … or thin edge"; the thin-edge reference clearance is 8 mm along the edge × 3.4 mm deep, with an L/C tuning part. 72 % efficiency and 1.5 dBi peak on a 40 × 20 mm evaluation board [V R7]. 903 in stock at JLCPCB [V V0.2]. **Check that the -002E datasheet matches -001E before ordering [U].** |
| D10-B | Pulse **ANT2012LL13R2400A**, C19192917 | 2.0 × 1.25 mm, 3 × 5 mm keep-out, 76.6 % on a 90 × 50 mm board [V R7]. 3,910 in stock. |
| D10-C | Pulse **W3008C**, C581403 | 3.2 × 1.6 mm, 4 × 4.25 mm keep-out, 66 % on 80 × 37 mm (figures from the W3008 datasheet; the W3008C datasheet wasn't read [U]). 9,151 in stock. |

Rejected:
- PCB trace antennas. TI's smallest 2.4 GHz options need 15.2 × 5.7 mm (AN043) or 25.7 × 7.5 mm, and none fits a ≤ 13.5 mm width [V R7].
- Corner- or end-mount chip antennas, because both board ends carry metal plugs [V R7].
- u-blox NORA-W10 certified module. Its ground-plane rules ("no less than 24x30 mm") can't be met at 14 mm [V R7].

Every option will be detuned by the narrow ground plane, the case and the host. **Antenna matching must be tuned with a VNA on the assembled board, in its case** [V R7].

### D11 — User indicator and controls (revised)

| Option | Description |
|---|---|
| **D11-A (Rec.)** | One 0402 single-colour status LED on GPIO9, for blink codes (normal / updating / recovery / error). A **pin-hole recovery button** (Alps SKSVCAE010, C115364, 2.8 × 1.9 mm [V R5]) on **GPIO8**, read by the bootloader (`02` §4.6, `04` §9). A **BOOT pad** (GPIO0) on the bottom, for the jig only. |
| D11-B | As D11-A with an addressable RGB LED (XL-1615RGBC-2812B-S). Its data input needs 0.55 × VDD (about 2.9 V at 5.25 V) [V R5], above the ESP32-S3's guaranteed 2.64 V VOH [V V0.7], so it is **out of spec** without a level shifter [D]. |
| D11-C | No recovery button. End-user recovery then relies on rollback only, and a unit with a bad but "valid" app goes back to the lab. |

### D12 — Policy when both plugs are connected

- **Rec.:** Type-A wins power (TPS2116 priority) and data (firmware). That matches REQ-7.
- If Type-A has VBUS but no host enumerates within a timeout (for example, a phone charger on A) and Type-C has VBUS, firmware falls back to Type-C. See `04`.

### D13 — EDA tool

- **Rec.:** KiCad (free; JLCPCB fab/BOM/CPL export plugins exist).
- Alternatives: EasyEDA Pro (native LCSC/JLCPCB library) or Altium.
- No preference is assumed; tell me yours.

---

## 3. What "done" looks like for this plan

1. You answer D1–D13 and D2a–D2d, or accept the recommendations.
2. **Procurement gate:** confirm a real source for ESP32-S3R16V, or take D1-B. See `05` §1.
3. Then schematic capture starts, from `02` and the pin map in `02` §6.
