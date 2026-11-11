# 02 — Hardware design (schematic-level plan)

**Revision 2 (2026-11-09):** both plugs are HID-only. The USB switch now follows the powering plug and stays disconnected until firmware is ready (§4.3), and a pin-hole recovery button is added (§4.6). This file assumes the recommended options in `01`. Where another option changes the schematic, the text says so.

Tags: [V] verified (note ID) · [D] derived · [E] estimate · [U] open. Notes are in `plans/research/`.

---

## 1. Block diagram

```
 TYPE-A END                                                        TYPE-C END
 J1 USB-A plug (shell → GND)                                       J2 USB-C plug (shell → GND)
                                                                   CC A5 ── 5.1k 1% ── GND;  B5 VCONN: no connection
  VBUS_A ── 1µF ── TVS (TPD1E10B06) ──┐          ┌── TVS (TPD1E10B06) ── 1µF ── VBUS_C (A4/A9/B4/B9)
                                       ▼          ▼
                    ┌───────────────────────────────────────────────┐
                    │ U3 TPS2116  VIN1 = VBUS_A (priority)           │  MODE = VIN1; PR1 = 287k/100k from VBUS_A
                    │             VIN2 = VBUS_C   VOUT = VSYS (47µF) │  ST (open drain) ─ 10k to 3V3 ─► GPIO4; ─ 100k ─► U5 S
                    └──────────────────────┬────────────────────────┘
                                           ▼ VSYS
                              U4 TLV75733P LDO (or D6-B buck) ─► 3V3 (all logic)

  D+/D−_A ── ESD ×2 (TPD1E05U06 → GND) ──► 2D ┐            ┌ 1D ◄── ESD ×2 (TPD1E05U06 → GND) ── D+/D−_C (A6/A7)
                                        U5 TS3USB221A (VCC = 3V3)
                                        S  ◄─ GPIO6 + 100k from ST (default: follows the powering plug)
                                        OE̅ ◄─ GPIO7 + 100k pull-up (disconnected until firmware); pull-down DNP (dev)
                                            │ D±
                                            ▼ 0 Ω (22 Ω option) + DNP caps to GND, near U1
                    U1 ESP32-S3R16V / ESP32-S3:  GPIO20 = USB D+, GPIO19 = USB D−
                    ├─ VDD_SPI (1.8 V) ─ 0 Ω link ─ U2 GD25LQ128E 16 MB QSPI flash (1.8 V)
                    ├─ GPIO45 ── 4.7k ── 3V3   (VDD_SPI = 1.8 V strap; not fitted on D1-B)
                    ├─ LNA_IN ─ CLC (chip side, 0201) ─ 50 Ω CPWG ─ π (antenna side) ─ ANT1
                    ├─ XTAL_P/N ─ 24 nH series (XTAL_P) ─ Y1 40 MHz ±10 ppm
                    ├─ CHIP_PU ─ 10k / 1µF (+ optional supervisor footprint) ─ TP_EN
                    ├─ GPIO0 ─ 10k pull-up ─ TP_BOOT     GPIO43/44 ─ UART0 TPs (499 Ω on TX)
                    ├─ GPIO5 ◄─ VBUS_C divider (10k/13k)  GPIO9 ─► status LED
                    ├─ GPIO8 ◄─ SW1 pin-hole RECOVERY button to GND (10k pull-up)
                    └─ EPAD ─ GND (≥ 9 vias)
```

---

## 2. Power path

### 2.1 Per-plug VBUS (before the mux)

- **Capacitors:** each plug's VBUS gets **1 µF**, X5R 10 V, 0402, at the connector.
  - USB 2.0 ECN: each device connector VBUS needs 1.0–10.0 µF "regardless of whether the USB device is powered or unpowered" [V R4].
  - TI also recommends CIN = 1 µF for TPS2116 [V V0.5].
- **ESD: GND-referenced (rail-less) parts only**, within a few mm of each plug:
  - D+ and D−: **TPD1E05U06DPYR** (C436349), one channel per line, 0.42 pF, VRWM 5.5 V, 1.0 × 0.6 mm [V R5]. Four in total.
  - VBUS: **TPD1E10B06DPYR** (C48260), VRWM 5.5 V, leakage ≤ 100 nA at 5 V, 1.0 × 0.6 mm [V R5]. One per plug.
  - **Why not USBLC6-2:** its I/O-to-VBUS steering diodes would let the USJ D+ pull-up (on at reset [V R1]) back-feed an unpowered plug's VBUS whenever U5 connects that plug. Since revision 2 the switch stays off until firmware selects the powered plug. So this can only happen briefly: during the D12 fallback, in SERVICE mode, or on development units with the OE pull-down [D]. That would source current on VBUS, against USB 2.0 §7.2.1 [V R4], and corrupt VBUS_C sensing. (Found in the independent review; see V0.9.)
  - Alternate for D±: TPD2E2U06DRLR (C1972959, 2 channels, 1.5 pF) [V R5], **if** its datasheet confirms it has no supply/rail pin [U].
- **Bleed:** each plug's VBUS needs a resistive bleed, so an unplugged plug's VBUS pin sits near 0 V.
  - Type-A: the TPS2116 PR1 divider does this.
  - Type-C: the VBUS_C sense divider does this [D].

### 2.2 U3 — TPS2116DRLR power mux (C3235557) [V V0.5]

| Pin | Connection |
|---|---|
| 3 VIN1 | VBUS_A (priority input) |
| 6 VIN2 | VBUS_C |
| 5 MODE | **VIN1**, which gives priority mode per the datasheet: "Priority mode when MODE is tied to VIN1" |
| 4 PR1 | Divider from VIN1: **R_top 287 kΩ / R_bot 100 kΩ** (1 %) |
| 2, 7 VOUT | VSYS (both pins) |
| 8 ST | **10 kΩ** pull-up to 3V3. Goes to **GPIO4** (net `A_PWR`: high = Type-A powers the board) and, through **100 kΩ**, to U5 S (§4.3). |
| 1 GND | GND |

PR1 divider [D] (threshold raised after the independent review; see "Why high"):
- Switchover threshold = VREF × (387/100) = **3.87 V** nominal. Over the VREF range 0.92–1.08 V it is **3.56–4.18 V**.
- At the lowest USB 2.0 device-side VBUS (4.4 V) [U: confirm the 4.4 V figure], VPR1 = 1.137 V, above the 1.08 V maximum VREF. So Type-A is selected whenever it is present.
- Divider current is about 13 µA.
- **Why high:** while VIN1 is selected, VSYS follows VBUS_A. When Type-A is pulled out, VSYS has already fallen to the threshold before the 8 µs break-before-make gap starts [V V0.5]. With the earlier 3.55 V nominal (3.27 V worst case), 3V3 would dip below the ESP32-S3's 3.0 V minimum [D].

Other U3 details:
- **VSYS capacitance: 47 µF** (22 µF minimum), rated ≥ 10 V [D].
  - Switchover droop at 0.5 A = 0.5 A × 8 µs / C: **0.085 V** with 47 µF, 0.18 V with 22 µF [D].
  - Worst case (threshold 3.56 V, 47 µF): VSYS ≥ 3.47 V, so 3V3 ≥ about 3.25 V after the LDO's ≈ 225 mV dropout at 0.5 A [D; dropout from R5]. With 22 µF it is about 3.15 V. Both stay above the 3.0 V minimum [V R1].
- **Type-A plugged in while running on Type-C:** PR1 crosses VREF while VBUS_A is still rising (≥ 3.56 V) and VSYS is at 5 V.
  - The device "will not turn on the new channel until the output has discharged down to VIN + VRCB" [V V0.5], so VSYS sags toward the rising VBUS_A and stays at about the threshold or above. 3V3 holds [D].
  - TI recommends clamping the output or "a high output capacitance (about 100µF)" when reverse-current blocking is expected [V V0.5]. The plan uses 47 µF plus a second footprint for more.
- **Inrush:** soft start (1.7 ms at 5 V) limits it to about 47 µF × 5 V / 1.7 ms ≈ 0.14 A [D, V0.5]. Whether that meets the USB 2.0 inrush rules wasn't checked [U]; measure it at bring-up.
- **Back-feed:** reverse leakage out of an input pin is 0.001 µA typ at 25 °C and 0.05 µA at 85 °C (IREV, VOUT = 5.5 V, VINx = 0 V) [V V0.5]. The unselected input itself only draws ≤ 2 µA of standby current into the mux (ISTBY) [V V0.5]. This satisfies USB 2.0 §7.2.1, "No device shall supply (source) current on VBUS" [V R4], provided the data-line ESD is rail-less (§2.1).

### 2.3 U4 — 3.3 V regulator

- **D6-A (default): TLV75733PDYDR** (C22399950), 1 A, thermal-pad SOT-23-5 [V R5].
  - VIN = VSYS; EN tied to VIN.
  - VIN capacitor: 1 µF (part of the VSYS bulk).
  - VOUT capacitor: **10 µF at the regulator plus ≥ 10 µF at the ESP32 power entry** [V R2: Espressif asks for "at least 10 μF" at the power entrance]. TI allows 1–200 µF [V R5].
  - Supply requirement is met: the ESP32-S3 needs ≥ 500 mA ("output current is no less than 500 mA") [V R2, R5]; Wi-Fi TX peaks at 340 mA [V R1].
  - Dissipation is 0.20 W at 120 mA average and 0.85 W in a 500 mA burst [D R5]. Validate the thermals; see `05` §3.
- **D6-B: TLV62569DBVR** buck (C141836) with a 2.2 µH inductor and an FB divider set to 3.3 V [V R5].
  - Keep the inductor and switch node away from ANT1, the RF line and Y1.
  - Inductor part number not chosen [U].

### 2.4 Reset (CHIP_PU, pin 4)

- **RC:** 10 kΩ to 3V3 and 1 µF to GND [V R2]. "Do not leave the CHIP_PU pin floating" [V R1].
  - Timing: all rails must be stable ≥ 50 µs before CHIP_PU is released [V R1, R2].
- **Optional supervisor footprint** (SOT-23, about 3.0 V threshold, active-low).
  - Espressif warns the RC may not be enough with "Frequent power on/off operations", which describes a dongle [V R2].
  - Part not chosen [U]. Populate only if bring-up shows hot-plug boot failures.
- Test pad **TP_EN**.

---

## 3. ESP32-S3 core

### 3.1 Decoupling (Espressif HDG Fig. 1 and the WROOM-1 V1.4 schematic) [V R2]

| Pin(s) | Parts |
|---|---|
| VDD3P3 (2, 3), RF supply | 10 µF + 1 µF + 0.1 µF, then a series **2.0 nH ±0.1 nH** inductor rated ≥ 500 mA (module parts list: 600 mA), then 0.1 µF at the pins. 0201 except the 10 µF. Place a via to the bottom layer at the first capacitor. Trace ≥ 20 mil. |
| VDDA (55, 56) | 1 µF + 10 nF |
| VDD3P3_RTC (20) | 0.1 µF |
| VDD3P3_CPU (46) | 0.1 µF |
| VDD_SPI (29) | 0.1 µF + 1 µF. "do not add excessively large capacitors" |
| 3V3 entry | ≥ 10 µF; main trace ≥ 25 mil |

Conflict [V R2]: the HDG text says "place a 10 µF capacitor for each pin" (pins 2 and 3), but its own schematic shares one 10 µF.
- **Plan:** one 10 µF as in the schematic, plus a second 10 µF footprint (DNP).

Also from the HDG [V R2]: "VDD3P3_RTC cannot supply power alone; all power supplies must be powered on at the same time". All of them come from the single 3V3 rail here.

### 3.2 Clock

- **Y1:** Murata XRCGB40M000F1S1BR0 (C1870451) [V R5].
  - 2016 package, 40 MHz, CL 8 pF, ESR ≤ 50 Ω, ±10 ppm tolerance and ±10 ppm stability (−30 to +85 °C).
  - The ESP32-S3 "only supports 40 MHz crystal", accuracy "within ±10 ppm" [V R2, R5].
- **Alternate:** Hosonic E1SB40E00000CE (C2757580), CL 10 pF [V R5].
- **Series part on XTAL_P:** 24 nH, 0201, close to the chip.
  - The HDG says "inductor of 24 nH" [V R2].
  - Conflict: the 2023 module schematics draw a 0 Ω resistor there [V R2].
  - **Plan:** 0201 footprint, populate 24 nH per the HDG.
- **Load capacitors:** start at **10 pF each** for CL 8 pF. From CL = C/2 + C_stray with an assumed C_stray of about 3 pF [D].
  - Final values are tuned to ±10 ppm with Espressif's Certification and Test Tool in TX-tone mode [V R2]. See `05`.

### 3.3 Strapping pins [V R1, R2, V0.7]

**GPIO0 (pin 5)**
- 10 kΩ pull-up ("place a pull-up resistor at the GPIO0 pin"; "Do not add high-value capacitors at GPIO0") [V R2].
- **TP_BOOT** pad to GND on the bottom, for the lab/jig only. The end-user button is on GPIO8 (§4.6).
- GPIO0 = 0 at reset gives Joint Download boot [V R1].

**GPIO45 (pin 51)**
- **4.7 kΩ pull-up to 3V3 on every build with 1.8 V flash.** This sets VDD_SPI = 1.8 V when the VDD_SPI_FORCE eFuse is 0 [V R1, R2].
- Why 4.7 kΩ rather than Espressif's 10 kΩ:
  - The internal pull-down is "45 kΩ typ" with no min/max published [V V0.7].
  - VIH is 0.75 × VDD = 2.475 V [V V0.7].
  - With 4.7 kΩ, the pin stays above VIH unless the internal pull-down drops below about 14 kΩ [D].
- **Without this resistor, a plain ESP32-S3 supplies 3.3 V to a flash whose absolute maximum is 2.5 V** [V V0.6].
- It is harmless on the R16V: when VDD_SPI_FORCE is burned, GPIO45 is ignored [V R2].
- **Not fitted on the D1-B build** (ESP32-S3R8 with 3.3 V flash).

**GPIO46 (pin 52)**
- Internal pull-down. Must be low for download mode [V R1]. No connection; keep it clear of anything that could pull it up.

**GPIO3 (pin 8)**
- Floating, no internal pull. It only matters if EFUSE_STRAP_JTAG_SEL = 1 (default 0) [V R1]. No connection.

**Timing:** straps are latched at reset with setup ≥ 0 ms and hold ≥ 3 ms after CHIP_PU rises [V R1].

### 3.4 External flash U2 — GD25LQ128EWIGR (C2928889) [V R3, V0.6]

- **Part:** 1.65–2.0 V, 133 MHz, WSON-8 6 × 5 mm. JEDEC ID C8 60 18 matches ESP-IDF's "GD" quad-enable table entry [V R3].
- **Second source:** W25Q128JWPIQ (C2689660). Same WSON 6 × 5 package and pinout; the "IQ" suffix has QE fixed at 1 [V R3]. Land patterns were not compared between vendors [U R3].
- **Do not substitute Macronix MX25U12835F.** ESP-IDF's default QIO routine sends 0x35, which on Macronix means "enter QPI mode" [D R3].
- **Pinout** (both parts): 1 CS#, 2 DO (IO1), 3 WP# (IO2), 4 GND, 5 DI (IO0), 6 CLK, 7 HOLD# (IO3), 8 VCC [V R3].

| Flash pin | ESP32-S3 pin | Series part |
|---|---|---|
| CS# | SPICS0, pin 32 (GPIO29) | direct |
| CLK | SPICLK, pin 33 (GPIO30) | 0 Ω |
| DI/IO0 | SPID, pin 35 (GPIO32) | 0 Ω |
| DO/IO1 | SPIQ, pin 34 (GPIO31) | 0 Ω |
| WP#/IO2 | SPIWP, pin 31 (GPIO28) | 0 Ω |
| HOLD#/IO3 | SPIHD, pin 30 (GPIO27) | 0 Ω |

The 0 Ω footprints sit close to U1, per Espressif's reference [V R2].

- **VCC:** fed from VDD_SPI (pin 29) through a **0402 0 Ω bring-up link**. First-article boards can verify VDD_SPI = 1.8 V before the flash sees it (`05` §2); the link also allows current measurement [D].
- **Decoupling:** 0.1 µF at the flash VCC, as Espressif recommends when the flash is not right next to the chip [V R2].
- **Exposed pad:** to GND. The datasheet allows GND or floating [V V0.6].
- **Firmware:** QIO at **80 MHz** [V R3]. 120 MHz is not listed for these 1.8 V parts.
- **D1-B build** (ESP32-S3R8): fit a **3.3 V** part on the same footprint, W25Q128JVPIQ (C190862) or GD25Q128EWIGR (C2982923) [V R3, V0.2], and leave the GPIO45 resistor off.

**BOM-variant hazard.** If a 1.8 V build gets a 3.3 V flash, or the GPIO45 resistor is missing, the flash and/or the R16V's PSRAM can be damaged. ESP-IDF says "Not doing this can damage the PSRAM and/or flash chip" [V R1, R3]. Name the variants clearly in the BOM; see §7.

### 3.5 Pins left unconnected on purpose

| Pin(s) | Function | Reason |
|---|---|---|
| 28, GPIO26 / SPICS1 | PSRAM CS | Used inside the R16V [V R1] |
| 38–42, GPIO33–37 | Octal PSRAM DQ4–7 and DQS | Used inside the R16V [V R1] |
| 36/37, GPIO48/47 | — | Run at 1.8 V on the R16V [V R1] |
| 27 (GPIO21), 43 (GPIO38), 44 (GPIO39), 45 (GPIO40), 47 (GPIO41), 48 (GPIO42) | — | The ROM drives or configures them in USB-OTG download mode [V R6]. GPIO39–42 (MTCK/MTDO/MTDI/MTMS) are also the JTAG pads. Pin 46 is VDD3P3_CPU, not a GPIO. |
| GPIO15/16 | XTAL_32K | No 32 kHz crystal. Available as spare GPIO if needed. |
| GPIO1, 2, 12–14, 17, 18 | — | Unused. No connection; firmware enables the internal pull-down at boot, as Espressif asks for floating inputs [V R2]. |

### 3.6 UART0 (factory programming, RF test, recovery)

- **U0TXD** (pin 49, GPIO43): **499 Ω** series resistor near the chip [V R2], then TP_TX.
- **U0RXD** (pin 50, GPIO44): TP_RX.
- Espressif: "retain the UART download interface, as the current RF test firmware only supports the UART interface" [V R2].

---

## 4. USB

### 4.1 J1 — USB-A plug, XUNPU USB-212-BCW (C720521) [V R4]

- **Pins:** 1 VBUS, 2 D−, 3 D+, 4 GND. Shell legs (plated slots) to GND.
- **Footprint:**
  - 4 SMT pads, 1.00 mm wide, at 2.00 / 7.00 mm.
  - Two Ø1.20 mm peg holes at 4.50 mm spacing.
  - Two 0.90 × 2.50 mm slots at 11.70 mm spacing, about **12.6 mm overall** [V R4].
- **Board edge:** at the plug's step, **14.70 mm behind the nose** [V R4]. Check this against the 3D model [U].

### 4.2 J2 — USB-C plug, Hroparts TYPE-C-31-G-07 (C530607) [V R4]

| Contact | Connection |
|---|---|
| A4/A9/B4/B9 VBUS | tied together to VBUS_C (all VBUS are tied in a plug) |
| A1/A12/B1/B12 GND | GND |
| **A5 CC** | **Rd = 5.1 kΩ 1 % to GND.** "shall apply and sense CC voltage levels on pin A5 only" [V R4]. 1 % is better than the ±20 % spec limit [V R4]. |
| **B5 VCONN** | **no connection.** The spec requires impedance above zOPEN, 126 kΩ minimum [V R4]. |
| A6 D+, A7 D− | to the Type-C ESD parts, then U5 port 1D |
| B6/B7, if the part has them | no connection. "Contacts B6 and B7 should not be present in the USB Type-C plug"; unused contacts "shall be electrically isolated" [V R4] |
| SBU A8/B8 | no connection ("shall not be connected") [V R4] |
| SuperSpeed pins | no connection |
| Shell | GND |

**Current:** the Type-C default is "500 mA for USB 2.0 ports". The USB 2.0 unit load is 100 mA before configuration [V R4]; see `04` §10 for the firmware consequence.

### 4.3 U5 — TS3USB221ARSER data switch (C128396) [V R5, V0.10]

**Revision 2:** both plugs are HID-only, so neither plug is the "default" any more.
- The data path **follows whichever plug powers the board**.
- The switch stays **disconnected until firmware is ready**.

| Pin (RSE) | Connection |
|---|---|
| 10 VCC | 3V3, with 0.1 µF |
| 1, 2: 1D+/1D− | Type-C (after its ESD parts) |
| 3, 4: 2D+/2D− | Type-A (after its ESD parts) |
| 8, 7: D+/D− | ESP32-S3 GPIO20/GPIO19 (through the §4.4 parts) |
| 9 **S** | **GPIO6** directly, plus **100 kΩ** from the TPS2116 ST node (§2.2). While GPIO6 is high-Z (reset, ROM, bootloader), S follows ST: Type-A powering gives S = H → D = 2D (Type-A); Type-C powering gives S = L → D = 1D (Type-C). Firmware overrides it by driving GPIO6. |
| 6 **OE̅** | **GPIO7**, plus a **100 kΩ pull-up** (fitted), so the switch is disconnected until firmware enables it. A **100 kΩ pull-down footprint is DNP**: fit it instead of the pull-up on development units that should expose USB-Serial/JTAG at power-up. |
| 5 GND | GND |

**Truth table** [V V0.10]:

| S | OE̅ | Result |
|---|---|---|
| X | H | Disconnect |
| L | L | D = 1D |
| H | L | D = 2D |

**Level checks at VCC = 3.3 V** [D; thresholds from V0.10]:
- Datasheet limits: VIH ≥ 0.46 × VCC = 1.52 V; VIL ≤ 0.25 × VCC = 0.825 V; control-input leakage ±1 µA.
- **S following ST high:** 3.3 V − 1 µA × (10 k + 100 k) ≈ 3.19 V ≥ 1.52 V ✓.
- **S following ST low:** VOL(ST) ≤ 0.1 V at 1 mA [V V0.5], plus 1 µA × 100 k, gives ≤ 0.2 V ≤ 0.825 V ✓.
- **GPIO6 forcing S high while ST is low:** 33 µA flows into ST. ST stays low, so GPIO4 still reads "Type-C powers" ✓.
- **GPIO6 forcing S low while ST is high:** the ST node sits at 3.3 × 100/(10 + 100) = 3.0 V, so GPIO4 still reads high ✓. This is why the pull-up is 10 kΩ and the series resistor 100 kΩ, not the other way round.
- **OE̅ pull-up:** 3.3 V − 1 µA × 100 kΩ = 3.2 V ≥ 1.52 V, so the switch is disabled ✓.

**Why the defaults hold:**
- TI: "TI recommends that the digital control pins S and OE be pulled up to VCC or down to GND" [V V0.10].
- GPIO4–GPIO8 have no internal pulls at reset [V R1].
- GPIO6/7 power-up glitches are 60 µs low-level ones [V V0.7]. On OE̅, a glitch could connect the switch for ≤ 60 µs during power-up. That is far shorter than any host's attach debounce, so it is harmless [D].

**Test pads:** TP_SEL (S node) and TP_OE (OE̅ node) on L4. A jig pogo pin to GND on TP_OE overrides the 100 kΩ pull-up and connects USB with no firmware, e.g. for factory programming or lab recovery over USB [D].

**Electrical figures** [V V0.10]:
- RON 3 typ / 6 max Ω.
- C(ON) 6 / 7.5 pF.
- Power-off leakage ±2 µA.
- I/O "accepts signals up to 5.5V".
- tON 17 ns maximum from OE̅, 30 ns from S.

**Capacitance budget:** USB 2.0 allows ≤ 100 pF on D+ or D− for a full-speed device port, with D+/D− matched within 10 % [V R4]. ESD (0.42 pF) + switch (≤ 7.5 pF) + traces is well under that [D].

### 4.4 Series and filter parts near U1

- Per Espressif: "reserve series resistors (initial value can be 22/33 Ω) and capacitors to ground … (initially can be unpopulated) … close to the chip" [V R2].
- Espressif's DevKits connect GPIO19/20 directly, and its module peripheral schematics use 0 Ω [V R2].
- **Plan:** 0402 series footprints **fitted with 0 Ω** (22 Ω option); 0201 capacitors to GND **DNP**. Tune only if signal quality needs it (`05` §2).

### 4.5 Plug sensing

- **A_PWR:** TPS2116 ST to GPIO4 (§2.2). This is a clean digital signal with 5 µs response [V V0.5]. The same node drives U5 S through 100 kΩ (§4.3).
- **VBUS_C_SENSE:** VBUS_C, then 10 kΩ / 13 kΩ, then **GPIO5 (pin 10, ADC1_CH4)** [V V0.7], with 100 nF at the pin for the ADC.
  - Ratio 0.565 gives **2.49 V at 4.4 V** (≥ VIH 2.475 V) and **3.11 V at 5.5 V**, below VDD + 0.3 = 3.6 V [D, V0.7].
  - ADC1 is used because it works alongside Wi-Fi; ADC2 does not. **This ADC1/ADC2 claim is from memory, not checked [U]. Confirm in the ESP-IDF ADC docs.**
- With rail-less ESD (§2.1), VBUS_C reads a true 0 V when Type-C is unplugged, even while the switch connects Type-C [D].
- No VBUS_A divider is needed. The PR1 divider is the bleed; add a sense divider only if bring-up shows a need.

### 4.6 Recovery button SW1 (new in revision 2)

- **SW1:** Alps SKSVCAE010 (C115364), 2.8 × 1.9 mm, top-push, behind a case pin-hole [V R5, V0.2].
- **Wiring:** GPIO8 → SW1 → GND, with an external 10 kΩ pull-up to 3V3.
  - GPIO8 has no internal pull at reset [V R1].
  - The bootloader enables the internal pull-up while it checks the pin [V V0.11].
  - Optional 1 kΩ series resistor as ESD insurance [E].
- **Use:** hold it while plugging in for `BOOTLOADER_HOLD_TIME_GPIO` (default 5 s). The bootloader then boots the recovery app from the test partition [V V0.11]; see `04` §9. At run time the app may also read it as a user button [D].
- **GPIO0 (BOOT)** stays a jig pad. Holding it low at reset enters ROM download, which end users don't need [V R1].

---

## 5. RF

Espressif HDG RF sections [V R2, R7]:
- **Chip-side match:** C–L–C network with **0201** parts "close to the pin in a zigzag". Starting ranges C11 1.2–1.8 pF, L2 2.0–3.0 nH, C12 1.2–1.8 pF.
  - For 0201 parts, add a stub **15 mil long, 100 Ω ± 10 %** on the ground pad of the chip-side shunt capacitor. Clear layer 2 under it; layer 3 is the reference, so the stub width depends on board thickness [D].
  - These starting values apply only to a board that strictly follows Espressif's layout and stack-up [V R7].
  - Tuning target: S11 near **35 + j0**, and S21 below **−35 dB at 4.8 GHz and 7.2 GHz**.
- **RF line:** 50 Ω coplanar line on L1 over solid L2 ground. No vias, 135° bends, as short as possible.
  - Widths come from JLCPCB's impedance calculator for JLC04161H-7628 (L1–L2 = 0.2104 mm, Dk 4.4) [V V0.3].
  - Sanity check: Espressif's 8.22 mil, Dk 4.6 stack-up gives 12.6 mil width and 12.2 mil gap [V R2].
- **Antenna-side match:** a 3-pad π (0201/0402) right at the antenna feed. Espressif recommends a CLC at the antenna for PCB/chip antennas [V R2, R7].
  - The 2450AT18D thin-edge layout also has its own L/C tuning part [V R7].
- **ESD on the antenna:** Espressif recommends ESD protection at the antenna [V R2]. Part not chosen [U]; the lowest-capacitance part in the research is TPD1E05U06 at 0.42 pF [V R5]. Absorb its capacitance into the antenna-side match [D].
- **Measurement break:** a 0201 0 Ω between the chip-side and antenna-side networks, so each half can be measured with a VNA pigtail [D].
- **ANT1:** Johanson 2450AT18D0100002E (C17410360). Placement and keep-out are in `03` §4.

---

## 6. GPIO and pin map (single source of truth for schematic capture)

| QFN pin | Signal | Net / use | Default at reset | Notes |
|---|---|---|---|---|
| 1 | LNA_IN | RF_CHIP | — | §5 |
| 4 | CHIP_PU | EN | RC | TP_EN |
| 5 | GPIO0 | BOOT | 10k pull-up | TP_BOOT (strap; jig only) |
| 8 | GPIO3 | NC | floating | strap; leave open |
| 9 | GPIO4 | A_PWR (in) | 10k pull-up to 3V3 | from TPS2116 ST; the same node feeds U5 S through 100k |
| 10 | GPIO5 | VBUS_C_SENSE (ADC1_CH4) | divider | 100 nF |
| 11 | GPIO6 | USB_SEL (out) | high-Z: S follows ST (the powering plug) | to U5 S; pad-hold in SERVICE mode; TP_SEL on L4 |
| 12 | GPIO7 | USB_OE̅ (out) | 100k pull-up = disconnected | to U5 OE̅; pull-down DNP (dev units); pad-hold in SERVICE mode; **TP_OE** on L4 (a jig grounds it to connect USB) |
| 13 | GPIO8 | RECOVERY_BTN (in) | 10k pull-up | SW1 to GND; bootloader test-app pin [V V0.11] |
| 14 | GPIO9 | STATUS_LED (out) | — | 0402 LED + resistor |
| 15–16 | GPIO10–11 | spare | — | test pads |
| 6, 7, 17–19, 21–24 | GPIO1, 2, 12–18 | unused | — | NC; internal pull-down set in firmware [V R2] |
| 25 | GPIO19 | USB_D− | — | via U5 |
| 26 | GPIO20 | USB_D+ | USB pull-up (USJ) | via U5 |
| 28 | GPIO26 | NC | — | R16V PSRAM CS |
| 29 | VDD_SPI | 1.8 V out | — | to flash via 0 Ω link |
| 30–35 | GPIO27–32 | flash QSPI | — | §3.4 |
| 36–37 | GPIO48/47 | NC | — | 1.8 V on R16V |
| 38–42 | GPIO33–37 | NC | — | R16V octal PSRAM |
| 49 | GPIO43 | U0TXD | — | 499 Ω, TP_TX |
| 50 | GPIO44 | U0RXD | — | TP_RX |
| 51 | GPIO45 | VDD_SPI strap | 4.7k pull-up (1.8 V builds) | DNP on D1-B |
| 52 | GPIO46 | NC | internal pull-down | strap; must stay low |
| 53/54 | XTAL_N / XTAL_P | Y1 | — | 24 nH on XTAL_P |
| 57 | EPAD | GND | — | ≥ 9 vias [V R2] |

Pin numbers, GPIO numbers and reset states are from R1's pin table (DS v2.2 Table 2-1 / 2-4) [V R1].

---

## 7. BOM by build variant

Stock and prices are JLCPCB figures checked 2026-11-09 [V V0.2]. Every listed IC and connector is **Extended**; none is Basic [V R5, V0.2].

| Ref | Function | **N16R16** (main) | **N16** (no PSRAM) | **N16R8** (fallback D1-B) |
|---|---|---|---|---|
| U1 | SoC | ESP32-S3R16V, C22458657 (**0 stock; consign**) | ESP32-S3, C2913192 (931, $2.80) | ESP32-S3R8, C2913194 (12,738, $3.15) |
| U2 | Flash 16 MB | GD25LQ128EWIGR 1.8 V, C2928889 (2,527, $1.16) | same | **3.3 V:** W25Q128JVPIQ C190862 (12,898, $3.41) or GD25Q128EWIGR C2982923 |
| R_45 | GPIO45 pull-up 4.7k | **fitted** | **fitted** | **not fitted** |
| U3 | VBUS mux | TPS2116DRLR, C3235557 (53,187, $0.39) | same | same |
| U4 | 3.3 V | TLV75733PDYDR, C22399950 (13,662, $0.30). Alt: AP2112K-3.3TRG1 C51118 | same | same |
| U5 | USB switch | TS3USB221ARSER, C128396 (73,371, $0.24) | same | same |
| ESD | D± and VBUS | TPD1E05U06DPYR C436349 ×4 (58,418, $0.05; 0.42 pF) + TPD1E10B06DPYR C48260 ×2 (302,833, $0.04) [V R5, V0.2]. Both are 2-terminal X1SON parts, so neither has a rail pin. | same | same |
| Y1 | 40 MHz | XRCGB40M000F1S1BR0, C1870451 (3,002, $0.27) | same | same |
| ANT1 | Antenna | 2450AT18D0100002E, C17410360 (903, $0.99) | same | same |
| J1 | USB-A plug | USB-212-BCW, C720521 (61,004, $0.11) | same | same |
| J2 | USB-C plug | TYPE-C-31-G-07, C530607 (1,265, $1.05) | same | same |
| D1 | Status LED | 0402 LED, part not chosen [U] | same | same |
| SW1 | Recovery button | Alps SKSVCAE010, C115364 (20,356, $0.15) [V V0.2] | same | same |
| L_RF, L_VDD | 2.0 nH (≥ 500 mA), 24 nH, RF match | Murata recommended by Espressif [V R2]; parts not chosen [U] | same | same |

Indicative cost at quantity 1 (N16 build) [D, from the table; ESD at about $0.05 each from R5]:
- about **$6.3** for ICs and connectors;
- **$7.6** with Y1 and ANT1, about **$7.7** with SW1.

Add passives, PCB and assembly. JLCPCB also charges "$3 per extended component" [V R5] for each unique Extended part: about 12–15 here, so roughly $36–45 per order [E]. The R16V price is unknown until it is sourced.

---

## 8. Open items to close during schematic capture

1. TPD1E05U06 / TPD1E10B06 and TS3USB221A (RSE) pinouts and land patterns: take them from the datasheets, not from memory.
2. ESD part for the antenna, 2.0 nH / 24 nH inductor part numbers, RF match part numbers, LED part number.
3. Whether the 2450AT18D0100002E datasheet and land pattern match the -001E.
4. 3D models for J1 and J2: confirm the step position and that the plug body clears the board.
5. Whether JLCPCB really needs "Standard" PCBA (fixture-required parts) and what that does to panelisation (`03` §6).
6. USB 2.0 minimum device-side VBUS (the 4.4 V used in §2.2) and the Type-C vSafe5V maximum (5.5 V): confirm from the specs.
7. The ADC1-works-with-Wi-Fi assumption in §4.5: confirm in the ESP-IDF ADC docs.
8. Bench-test on a DevKit that the GPIO6/GPIO7 pad holds survive ROM download (`04` §8) before layout freeze. The result decides whether production units can use SERVICE mode.
9. Case pin-hole position over SW1, and the hold-time UX (5 s default).
