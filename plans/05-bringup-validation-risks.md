# 05 — Procurement, bring-up, validation, risks, regulatory, roadmap

Tags: [V] verified (note ID) · [D] derived · [E] estimate · [U] open.

---

## 1. Procurement gate (before layout freeze)

**ESP32-S3R16V** is the only route to 16 MB PSRAM (D1). Status:
- **Espressif:** Mass Production [V R1, R2].
- **JLCPCB:** 0 stock [V V0.2]. **LCSC:** "Part not found" [V R3].
- **DigiKey:** non-stock, 8-week lead time, a 2,000-unit price break, "Strip" packaging [V V0.1].
- **Mouser:** lists 356-ESP32-S3R16V; stock unverified [U].

Actions:
1. Ask Espressif sales, Mouser and DigiKey for sample or small-quantity availability, MOQ and lead time. **Ask for the tape/tray format JLCPCB accepts for consigned parts** [U].
2. Ask JLCPCB whether they can source it (global sourcing or pre-order) or accept it consigned, and confirm the moisture-sensitivity (MSL)/baking handling [U].
3. Ask Espressif whether bare R16V reels ship with the `VDD_SPI_FORCE/TIEH/XPD` and `PIN_POWER_SELECTION` eFuses burned [U R1]. The design is safe either way because of the GPIO45 pull-up; the answer just confirms it.
4. **If there's no source within your timeline, take D1-B** (ESP32-S3R8 with 3.3 V flash, 8 MB PSRAM, in stock). Same PCB.

Other single-source or low-stock parts at JLCPCB (2026-11-09) [V V0.2]:
- J2 C530607: 1,265.
- ANT1 C17410360: 903.
- Plain ESP32-S3 C2913192: 931.
- GD25LQ128EWIGR: 2,527.

Reserve stock, or pre-order through JLCPCB's parts manager, before ordering the boards.

## 2. Rev A bring-up plan

Builds: **N16R16 × 5** and **N16 × 5** [E]. On **2 boards of each**, leave the flash VDD_SPI link (0 Ω) **unfitted** for first-article power checks.

Per build, fit the OE **pull-up** (production configuration) on 3 boards and the OE **pull-down** (development configuration) on 2.
- U1, U2 and step 11 apply to pull-up boards.
- USB first flash in step 5 uses pull-down boards, or a jig grounding TP_OE [D].

| Step | Check | Pass criterion | Source |
|---|---|---|---|
| 0 | Visual check; X-ray of U1/U2 if JLCPCB offers it | No bridges or voids on the EPAD | [U] |
| 1 | Current-limited 5 V into the Type-A pins only, then the Type-C pins only | VSYS ≈ VBUS, 3V3 = 3.3 V, idle current sane. GPIO4 (ST) high on A and low on C. | [V V0.5] |
| 2 | Both plugs, two separate 5 V supplies, an ammeter in each | Type-C supply delivers only the VBUS_C divider (≈ 0.22 mA) plus ISTBY (≤ 2 µA). **No current flows into either supply** (reverse < 1 µA). | [V V0.5, R4 §7.2.1] [D] |
| 3 | **Before first power on any R16V board:** check that R_45 (GPIO45 to 3V3, 4.7 kΩ) is fitted, because the in-package PSRAM sits on VDD_SPI from the first power-up [V R1]. Then measure VDD_SPI on the link-open boards, both builds. | **1.8 V**. If 3.3 V, stop and check GPIO45 before fitting any flash. | [V R1, V0.6: flash abs max 2.5 V] |
| 4 | `espefuse summary` on R16V | Record the VDD_SPI fuses and PIN_POWER_SELECTION | [U R1] |
| 5 | First flash with the BOOT pad held at power-up. On production-configured boards (OE pull-up) use the UART0 pads with a 3.3 V USB-UART adapter. On boards with the OE pull-down (development units, D4-A), USB works. | esptool connects; flash ID reads C8 60 18 (GD) | [V R1, R3, R6] |
| 6 | Flash a test image; PSRAM check | R16V: 16 MB detected, memtest passes. N16: "continuing without it". | [V R3] |
| 7 | Crystal calibration (Espressif Certification and Test Tool, TX tone, over UART) | Frequency error within ±10 ppm; fix the load capacitor values | [V R2] |
| 8 | RF chip-side match (VNA pigtail at the 0 Ω break) | S11 near 35 + j0; S21 < −35 dB at 4.8/7.2 GHz | [V R2] |
| 9 | Antenna-side match, **in the closed case**: (a) free space, (b) plugged into a laptop via Type-A, (c) via Type-C | Return loss ≥ 6 dB (the datasheet's minimum) across 2.400–2.4835 GHz in all three cases. Pick a compromise match. | [V R7: "Return Loss (dB) 6 Min."] [D] |
| 10 | Over-the-air checks | RSSI and throughput against an ESP32-S3 DevKit at the same distance; target within a few dB [E] | [E] |
| 11 | USB: HID on Type-A and on Type-C; plug changes 100×; both-plugged policy; charger on Type-A + host on Type-C. The programming paths are tested in §2b. | Enumerates every time on Windows/macOS/Linux; no host ever shows 303A:1001 outside SERVICE mode | [D] |
| 12 | Hot-plug 1,000× on each end, including fast re-plugs | Boots every time. If not, fit the reset supervisor. | [V R2 warning] |
| 13 | **Thermal:** closed case, 25 °C and 40 °C room, worst-case Wi-Fi TX duty, thermocouples on U1 and the case air | Air inside the case stays below 65 °C for R16V (else ECC / buck / TX duty limits); the plain ESP32-S3 chip is rated to 105 °C, but the crystal (−30 to +85 °C) and other parts cap the system | [V R1, R5] |
| 14 | USB signal quality at full speed (scope) | Edges 4–20 ns; adjust the 22 Ω / capacitor options if needed | [V R4, R2] |
| 15 | ESD (IEC 61000-4-2) on the plug shells, if the product is sold | No damage or latch-up | [U] |
| 16 | Mechanical: insertion and removal, wrench test, case fit | Type-C 0.75 N·m wrenching requirement | [V R4] |

### 2b. Programming-path tests (revision 2)

Run U1–U9 on the **DevKit first** wherever possible (`06` §11), then on Rev A.

| Step | Check | Pass criterion | Source |
|---|---|---|---|
| U1 | Blank flash, no firmware: measure U5 S and OE with Type-A only, Type-C only, then both | OE high (disconnected). S high with Type-A power, low with Type-C only. No host sees any device. | [V V0.10, V0.5] [D] |
| U2 | NORMAL boot on each plug | Composite HID (keyboard, mouse, update interface) enumerates. The host **never** lists 303A:1001. | [D] |
| U3 | HID update of 2 MiB and 4 MiB images on each plug, from the web tool (Chrome/Edge) and the CLI | Completes; times close to the estimates in `06` §4 (2 MiB ≈ 49–51 s typical) | [V R8] |
| U4 | Unplug at 10 random points during erase and transfer | The old app still boots; the tool restarts or resumes | [V R8] |
| U5 | Install an image that crashes before `CONFIRM` | Bootloader rolls back to the previous app | [V R8] |
| U6 | Corrupted, wrongly signed, wrong-chip or older-version image | Rejected before erase or at `UPDATE_END`; old app intact | [V R8] |
| U7 | Hold the recovery button at plug-in for the hold time | Recovery app (recovery PID) enumerates and a reinstall works. After replug the new app runs. | [V V0.11] |
| U8 | SERVICE via host command, on each plug (with SW1 held on production-configured units) | 303A:1001 appears on the **same** plug; esptool flashes; hard reset returns to NORMAL. **Records whether the pad hold survives the ROM.** | [U R8] |
| U9 | OS matrix: Windows standard user, macOS (any Input Monitoring prompt?), Linux with and without the udev rule, ChromeOS | Matches `06` §7 | [V R9; U] |
| U10 | Production provisioning on 2–3 sacrificial units: Secure Boot V2 + secure download mode | Signed HID update works; an unsigned image is refused; SERVICE (SW1 held) works with `--no-stub`; bootloader and recovery app verify with every provisioned key | [V R8] |

## 3. Thermal decision rule (D6 and the R16V limit)

- R16V is rated −40 to 65 °C ambient; with ECC on, 85 °C at the cost of 1/16 of the PSRAM [V R1].
- If step 13 fails, apply fixes in this order [D]:
  1. Enable PSRAM ECC (16 → 15 MB usable).
  2. Switch to the buck (D6-B) in Rev B.
  3. Limit TX power or duty in firmware.

## 4. Risk register

| # | Risk | Likelihood / impact | Mitigation | Gate |
|---|---|---|---|---|
| R1 | ESP32-S3R16V can't be bought in small quantity | High / High | §1; fallback D1-B (8 MB) | Before layout freeze |
| R2 | Antenna performance on a 13.6 mm ground plane is poor | Medium / High | Centre-edge chip antenna, both π footprints, VNA tuning in the case, D10-B/C as alternates [V R7] | Rev A RF tests |
| R3 | Antenna detuned differently via Type-A vs Type-C | High / Medium | Tune for a compromise; test both orientations [V R7] | Rev A |
| R4 | R16V over its 65 °C ambient rating inside the case | Medium / High | §3 | Rev A thermal |
| R5 | Type-C plug stock is low (1,265 / 998); "Fixture Required" | Medium / Medium | Reserve stock; second source C52741990 has a different footprint, so decide before layout | Before order |
| R6 | JLCPCB Standard PCBA plus a custom panel with plug windows raises cost and lead time | High / Low | Design the panel yourself (§6 of `03`) | Quote |
| R7 | Private USB PHY API regresses | Low / High | Pin versions; HIL test (§14 of `04`) | Each IDF upgrade |
| R8 | Hosts briefly see USB-Serial/JTAG at power-up on development units (OE pull-down, D4-A) | Certain on dev units / Low | Production units fit the OE pull-up (D4-B) | Build BOM |
| R9 | 1.8 V flash or the R16V's in-package PSRAM damaged by a missing GPIO45 resistor or the wrong BOM variant | Low / High | Variant-named BOMs; check R_45 before first power; first-article VDD_SPI check with the flash link open | Every build |
| R10 | USB suspend current (2.5 mA) not met with radio-on firmware | High / Low (most hosts don't enforce it) | Firmware policy (§10 of `04`) | Rev A |
| R11 | Crystal off-frequency → RF problems | Medium / Medium | Tune the load capacitors (step 7) | Rev A |
| R12 | Width over 14.0 mm after routing and tab nubs | Low / High | 13.6 mm nominal; sand nubs; specify on the fab notes | Fab |
| R13 | Hot-plug resets fail with the RC reset | Medium / Medium | Optional supervisor footprint [V R2] | Rev A step 12 |
| R14 | 12 Mb/s signal integrity through the switch and two branches | Low / Medium | 90 Ω routing; series/capacitor options | Rev A step 14 |
| R15 | VBUS back-feed, or a powered D+ pull-up, on the unpowered plug | Medium / Medium | Rail-less ESD (`02` §2.1). OE keeps both plugs disconnected until firmware selects the powered plug (`02` §4.3). | Rev A step 2, U1 |
| R16 | 3V3 dips when Type-A is pulled while Type-C is live | Medium / High | PR1 threshold 3.87 V nominal + 47 µF on VSYS (`02` §2.2) | Rev A step 11 |
| R17 | A field update bricks a unit (power loss or bug) | Low / High | A/B slots; verify before switching; rollback; recovery app (`04` §7–9) | U4–U7 |
| R18 | TinyUSB DWC2 vulnerability in shipped firmware | High / High if left unfixed | TinyUSB ≥ 0.21.0~3 [V R8] | Before the first release |
| R19 | Pad hold doesn't survive ROM download, so SERVICE doesn't work on production units | Medium / Low | Recovery app for users; OE pull-down on development units | DevKit U8 |
| R20 | Browser or OS changes (WebHID availability, macOS permissions) | Medium / Medium | Python CLI fallback; native app option (D2a) | Each release |
| R21 | Signing key lost or leaked | Low / Critical | Offline signer; 2–3 Secure Boot key digests provisioned; bootloader and recovery app signed with every key [V R8] | Before provisioning |
| R22 | Ungated SERVICE mode lets local software rewrite flash | Medium / High | Physical-presence gate (SW1) + Secure Boot V2 (`04` §8) | Firmware review |

## 5. Open (unverified) items carried forward

From the research notes; each is listed in the relevant note's "UNVERIFIED" section.
1. Whether bare R16V reels have the VDD_SPI / PIN_POWER eFuses burned (R1, R2, R3).
2. Mouser stock of the R16V; whether JLCPCB can source it (V0.1).
3. Datasheet match of the Johanson -002E vs -001E; W3008C datasheet not read (R7).
4. The 0.8 mm board-thickness spec of C49287224, and the meaning of C5370430's "T=1.4" (R4). Only matters for D7-C or the rejected 12P parts.
5. USB 2.0 minimum VBUS at the device (4.4 V used in `02` §2.2) and the Type-C vSafe5V maximum (5.5 V assumed). The spec tables weren't extracted.
6. USJ bMaxPower; time from power-on to the app switching the PHY; whether hosts enumerate USJ in that window (R6).
7. Whether the octal-PSRAM image keeps full flash speed on a no-PSRAM chip (R3).
8. ADC1 usable alongside Wi-Fi (ADC2 not) — from memory, not checked (`02` §4.5).
9. GPIO6/GPIO7 state across `esp_restart()` and into ROM download: see item 19 (`04` §5, §8).
10. The XUNPU J1 sub-surface depth and step position; check against the 3D model (R4).
11. Whether the XTAL_P series part should be 24 nH (HDG) or 0 Ω (2023 module schematic) — both footprinted (R2).
12. Windows driver behaviour for the USJ JTAG interface. The COM port itself uses the in-box CDC driver; JTAG may show as a driverless function [U].
13. JLCPCB X-ray availability and fixture fees for C720521 and C530607.
14. VDD_SPI regulator budget (40 mA typical) for the flash plus 16 MB PSRAM (R2, R3).
15. Whether the crystal's ±10 ppm requirement includes temperature drift (R5).
16. USB 2.0 inrush rules vs 47 µF on VSYS behind the TPS2116 soft start (R5, `02` §2.2).
17. With both plugs in two hosts, the hosts' grounds are tied through the dongle (R5).
18. TPD1E05U06 / TPD1E10B06 land patterns, and whether TPD2E2U06 is rail-less (`02` §2.1).
19. Whether a GPIO pad hold survives the ROM's download boot (R8). This decides D2d.
20. Whether a non-admin Windows account can open the update interface; whether macOS 26/27 prompts for Input Monitoring for it (R9).
21. esptool-js reset behaviour with ESP32-S3 USB-Serial/JTAG (R9), and whether esptool in secure download mode leaves the force-download bit set (R8).
22. Exact udev match keys for the hidraw and tty rules (`06` §7).
23. Which esp_tinyusb release first bundles TinyUSB ≥ 0.21.0~3, and API compatibility (R8).
24. The report rate real hosts achieve on Windows, macOS, Linux and WebHID (R8 UNVERIFIED #3). This sets real update times.
25. ChromeOS: whether Linux creates an input device for the update interface (R9 #6).
26. Bootloader hold time vs `BOOTLOADER_WDT_TIME_MS` (9 s default) on the real board (V0.12).

## 6. Regulatory (only if the dongle will be sold) [V R7]

- **No pre-certified ESP32-S3 module fits 14 mm.**
  - MINI-1 is 15.4 mm wide [V R7].
  - u-blox NORA-W10 is certified and 10.4 × 14.3 mm, but its integration rules need a ground plane of at least 24 × 30 mm, which this board can't provide [V R7].
- So the **whole dongle is the intentional radiator**:
  - **USA:** FCC §15.201(b) requires certification by a TCB "prior to marketing", tested with the actual antenna [V R7]. §15.247 is the usual rule part for 2.4 GHz digital transmission, but R7 didn't fetch it [U]. Part 15B covers the digital device [V R7].
  - **EU:** the RED conformity assessment (Art. 17) [V R7]. That includes the RED cybersecurity essential requirements Art. 3(3)(d)/(e)/(f) (Delegated Reg. 2022/30), applicable from 1 Aug 2025 [V R7].
  - The harmonised-standard versions (EN 300 328, EN 301 489, EN 18031) weren't verified [U].
- **USB:** using Espressif's VID with an allocated PID is allowed under their program's terms [V R6]. USB-IF certification and logo use are separate and optional [U].

## 7. Roadmap

| Milestone | Content | Exit criterion |
|---|---|---|
| M0 Decisions | Answer D1–D13 and D2a–D2d in `01` | Choices recorded |
| M0.5 DevKit firmware + tools | Runs in parallel with M1–M3: ESP32-S3-DevKitC-1 (variant not chosen [U]), HID composite, update engine, recovery partition, SERVICE + pad-hold test, Python CLI, web updater (`06` §11) | U2–U9 pass on the DevKit; protocol v1 frozen |
| M1 Procurement | §1 gate; reserve the low-stock parts | R16V source confirmed, or D1-B chosen |
| M2 Schematic | From `02`; datasheet pinouts for every IC; footprints from manufacturer drawings | Schematic review against `02` §6 pin map and §8 open items |
| M3 Layout | From `03`; JLCPCB impedance calculation; RF layout review; DFM; panel | DRC/DFM clean; width ≤ 13.8 mm max |
| M4 Rev A order | N16R16 × 5, N16 × 5 (2 + 2 with the flash link open) | Boards received |
| M5 Bring-up | §2 steps 0–6, 11, 12, and §2b | Both builds boot; HID on both ends; update, recovery and SERVICE work |
| M6 RF / thermal | §2 steps 7–10, 13 | Match values frozen; thermal decision (§3) |
| M7 Rev B | Fold in the fixes (supervisor, buck, match, case) | Ready for pilot or certification |
| M8 Certification | Only if sold (§6) | Grants received |
