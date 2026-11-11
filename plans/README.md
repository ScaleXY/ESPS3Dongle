# ESP32-S3 dual-plug USB dongle — plan

Date: 2026-11-09 · Phase: **planning** (nothing drawn yet) · Target fab: JLCPCB, LCSC parts

**Revision 2 (2026-11-09):** both plugs are HID-only, and firmware is programmed from a host tool (web page or CLI); see `06`.

## The design in one paragraph

A 4-layer, 13.6 mm-wide (≤ 14 mm), roughly 38 mm-long PCB [E]:
- **Plugs:** a metal-shell **USB-A plug** at one end and a **24-pin USB-C plug** at the other.
- **Chip:** **ESP32-S3R16V** (16 MB octal PSRAM inside the chip) with a **1.8 V 16 MB quad flash**. The no-PSRAM build swaps in a plain **ESP32-S3** on the same footprint.
- **Power:** the two VBUS inputs meet in a **TPS2116 power mux** (Type-A has priority; no back-feed, given rail-less ESD on the data lines), followed by a 3.3 V LDO.
- **Data:** a **TS3USB221A analog switch** chooses which plug's D+/D− reaches the ESP32-S3's single USB PHY. It follows the plug that powers the board and stays disconnected until firmware is ready, so hosts only ever see the HID device.
- **Programming:**
  - A host tool (a WebHID web page, or a CLI) streams signed firmware over a vendor HID interface; the dongle rolls back automatically if the new firmware fails.
  - A pin-hole button boots a protected recovery app.
  - A serial/esptool SERVICE mode remains for development and the lab (`06`).
- **Antenna:** a centre-edge chip antenna, mid-length, with tuning footprints.

## Things that change the picture (read these first)

1. **16 MB PSRAM is only practical with ESP32-S3R16V, and JLCPCB/LCSC have none.** DigiKey lists it as non-stock with an 8-week lead time and a 2,000-unit price break. Without a source, the fallback is ESP32-S3R8 with 8 MB, on the same PCB. → `01` D1, `05` §1.
2. **"Without PSRAM" means swapping the chip**, not leaving a PSRAM part off. No discrete 16 MB PSRAM that ESP-IDF supports is buyable at LCSC. → `01` D1.
3. **Both 16 MB-flash builds use a 1.8 V flash, so the GPIO45 pull-up is mandatory.** Without it, the plain ESP32-S3 puts 3.3 V on a flash whose absolute maximum is 2.5 V. → `02` §3.3.
4. **R16V is rated to 65 °C ambient**; the plain ESP32-S3 is rated to 105 °C. A closed plastic stick needs a thermal test, which may push you to the buck regulator or PSRAM ECC. → `05` §3.
5. **No published, characterised PCB-trace antenna fits 14 mm.** LilyGO's T-Dongle-S3 uses a trace antenna at about 14 mm wide (read from its CAD outline [U]), with no published performance. A chip antenna on a 13.6 mm ground plane must be tuned with a VNA in the case. A chip-down radio needs its own FCC/CE certification if sold. → `03` §4, `05` §6.
6. **Every key part is a JLCPCB "Extended" part.** The plugs probably force Standard PCBA (a panel of at least 70 × 70 mm), and the panel needs windows for the overhanging plugs. → `03` §6.
7. **End-user updates make security a launch item.** Secure Boot V2 and secure download mode are irreversible eFuse steps; rehearse them on sacrificial units. TinyUSB must be ≥ 0.21.0~3 (security fix). → `04` §13, `06` §10.
8. **Web updater reach:** WebHID works only in Chromium browsers (Chrome/Edge/Opera, ChromeOS), not Firefox, Safari or Android. A CLI (and optionally a native app) covers the rest. → `06` §6.

## Decisions for you (details and evidence in `01`)

| # | Decision | My recommendation |
|---|---|---|
| D1 | 16 MB PSRAM + no-PSRAM build | Swap the SoC: R16V / plain S3. Fallback R8 (8 MB). |
| D2 | Programming architecture | **Decided:** HID updater + serial SERVICE path + recovery button. Sub-decisions D2a–D2d: web + Python CLI; recovery partition; Secure Boot V2 in production; SERVICE on production units only with SW1 held (physical presence) and only if the pad-hold test passes. |
| D3 | D+/D− routing | TS3USB221A switch that follows the powering plug |
| D4 | Plugs at power-up | Disconnected until firmware is ready (pull-up); pull-down option for development units |
| D5 | VBUS combining | TPS2116 priority mux |
| D6 | 3.3 V regulator | LDO for Rev A; buck if heavy Wi-Fi use (tell me your usage) |
| D7 | USB-C plug | Hroparts TYPE-C-31-G-07 (C530607), 10k cycles |
| D8 | USB-A plug | XUNPU USB-212-BCW (C720521); gold-finger edge rejected |
| D9 | Board thickness | 1.6 mm (0.8 mm only for a straddle C plug) |
| D10 | Antenna | Johanson 2450AT18D (thin-edge, centre-edge) |
| D11 | LED / buttons | One status LED + pin-hole recovery button (GPIO8) + BOOT jig pad |
| D12 | Both plugs connected | Type-A wins |
| D13 | EDA tool | KiCad (tell me if you use something else) |

## Files

| File | Contents |
|---|---|
| `01-requirements-and-decisions.md` | Requirements, placeholder assumptions, decisions D1–D13 with options |
| `02-hardware-design.md` | Block diagram, power, ESP32-S3 core, flash, USB, RF, **pin map**, BOM per build variant |
| `03-pcb-mechanical-rf.md` | Outline, stack-up, placement, antenna and RF layout, panelisation, case constraints |
| `04-firmware-usb-modes.md` | ESP-IDF config, partition table, USB composition, boot/port logic, UPDATE engine, SERVICE and RECOVERY modes, USB IDs, eFuse/security policy |
| `05-bringup-validation-risks.md` | Procurement gate, bring-up steps, programming-path tests, thermal rule, risk register, open items, regulatory, roadmap |
| `06-host-programming-tool.md` | **New:** device modes, vendor HID update protocol v1, web updater and CLI, per-OS notes, SERVICE path, recovery flows, security |
| `research/R1…R9-*.md` | Research notes with source URLs, versions, pages and verbatim quotes. R8 = device update and security; R9 = host HID tooling. |
| `research/V0-lead-verification.md` | Facts I re-checked myself (R16V stock, JLCPCB stock/stack-ups/assembly rules, TPS2116, flash, GPIO DC levels) |

Evidence tags in every file:
- **[V]** verified from a primary source; the tag names the research note.
- **[D]** derived by calculation.
- **[E]** estimate.
- **[U]** open, with a test or quote to close it.

Local file paths inside the research notes point to a temporary download folder that no longer exists. The URLs are the sources.
