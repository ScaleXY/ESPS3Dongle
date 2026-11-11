# R3 — External flash & PSRAM selection (ESP32-S3 USB dongle, chip-down)

Researcher notes, compiled 2026-11-09 (local). Stock/price checks ran 2026-11-08 21:18–21:35 UTC (= 2026-11-09 morning local).
Everything below is from primary sources (Espressif docs/source, manufacturer datasheets, LCSC/JLCPCB data). Anything not verified is marked **UNVERIFIED**; conflicts are marked **CONFLICT**.

Local copies of every downloaded file: `/private/tmp/claude-501/-Users-athul-Workspace-Poytle-esp-s3-dongle/8a5133a7-8352-4435-aa04-cab7a74cb041/scratchpad/r3/` (one directory per PDF; ESP-IDF sources in `r3/idf_v6.1_src/`). Text extractions and raw JLC/LCSC JSON (`rawlog.jsonl`) are in `.../scratchpad/r3scripts/`.

---

## 0. Source register (versions)

| ID | Source | Version / date | URL |
|---|---|---|---|
| S-IDF | ESP-IDF, latest stable release | **v6.1**, published 2026-08-27; GitHub `releases/latest` = v6.1; tag object 4dc1c655 | https://github.com/espressif/esp-idf/releases/tag/v6.1 (docs: https://docs.espressif.com/projects/esp-idf/en/v6.1/esp32s3/ ; the `stable` docs page title reads "ESP-IDF Programming Guide v6.1") |
| S-DS | ESP32-S3 Series Datasheet | **v2.2, 2026-03-05** (87 pp) | https://www.espressif.com/sites/default/files/documentation/esp32-s3_datasheet_en.pdf (redirects to documentation.espressif.com/esp32-s3_datasheet_en.pdf) |
| S-MOD | ESP32-S3-WROOM-1/1U Datasheet | **v1.8, 2026-03-02** | https://www.espressif.com/sites/default/files/documentation/esp32-s3-wroom-1_wroom-1u_datasheet_en.pdf |
| S-HDG | ESP Hardware Design Guidelines (ESP32-S3), "latest" | top revision entry **v1.8, 2025-07-03** | https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32s3/schematic-checklist.html |
| W-JW | Winbond W25Q128JW datasheet | **Rev G, 2021-07-29** (LCSC mirror; Winbond site is JS-only, newer rev **UNVERIFIED**) | https://datasheet.lcsc.com/datasheet/pdf/1c7245ae56f4249bb475769020ae9cb2.pdf (also Rev E via C2689660) |
| W-JV | Winbond W25Q128JV datasheet | **Rev J, 2024-04-25** (LCSC mirror) | https://datasheet.lcsc.com/datasheet/pdf/d009d960f1daec6149edaa35b7dae856.pdf |
| W-JVD | Winbond W25Q128JV-DTR (IM parts) | Rev C, 2018-03-02 (LCSC mirror) | https://datasheet.lcsc.com/datasheet/pdf/dfa53082d787b7f5aec3be274d19ef74.pdf |
| G-LQ | GigaDevice GD25LQ128E | **Rev 1.3, 2024-09-18** (vendor) | https://download.gigadevice.com/Datasheet/DS-00533-GD25LQ128E-Rev1.3.pdf |
| G-Q | GigaDevice GD25Q128E | **Rev 1.4** (rev history 2024-09-20; page footers say "April 2024" — minor CONFLICT) | https://download.gigadevice.com/Datasheet/DS-00480-GD25Q128E-Rev1.4.pdf |
| G-LB | GigaDevice GD25LB128E | LCSC mirror (rev 1.0 2020-06-11 in history) | https://datasheet.lcsc.com/datasheet/pdf/94533bf6869aa8c67f24bc2b1731e9de.pdf |
| X-QH | XMC XM25QH128C | Rev 1.2, 2020-07-21 (LCSC mirror) | https://datasheet.lcsc.com/datasheet/pdf/a054c4bd7829eb17d7db3fe9025e520c.pdf |
| X-QU | XMC XM25QU128C product page (datasheet login-gated) | fetched 2026-11-09 | https://www.xmcwh.com/en/site/product_con/227 |
| M-U | Macronix MX25U12835F | Rev 1.9, 2019-03-13 (LCSC mirror; latest **UNVERIFIED**) | https://datasheet.lcsc.com/datasheet/pdf/16f932eed07a14fd99525453e9130f22.pdf |
| M-L | Macronix MX25L12833F | Rev 1.0, 2017-10-17 (LCSC mirror; latest **UNVERIFIED**) | https://datasheet.lcsc.com/datasheet/pdf/269d028af469c4b76ae2a7a7c21e0ef9.pdf |
| P-L | Puya P25Q128L | 2020-04-30 (LCSC mirror) | https://datasheet.lcsc.com/datasheet/pdf/25d6e29e53705e342b3099a89fdfd8a5.pdf |
| P-LA | Puya PY25Q128LA | **Rev 1.6, 2025-12-27** (LCSC mirror) | https://datasheet.lcsc.com/datasheet/pdf/dea1870c730eb12e31a6692e205971cd.pdf |
| P-HA | Puya PY25Q128HA | V1.2, 2022-08-11 (LCSC mirror) | https://datasheet.lcsc.com/datasheet/pdf/af6a8417a28c95e2727e1ef3ce780ee8.pdf |
| B-ES | Boya BY25Q128ES | Rev 2.11 (LCSC mirror) | https://datasheet.lcsc.com/datasheet/pdf/4bf4267477e5d39b05b37918c1ec0778.pdf |
| B-AS | Boya BY25Q128AS | Rev 0.0 Aug 2017 (LCSC mirror) | https://datasheet.lcsc.com/datasheet/pdf/cc9cf251f65054160d01943a6e84d776.pdf |
| A-OPI | AP Memory APS12808L-OBMx (1.8 V OPI) | **Rev 3.4, 2023-07-13** (vendor) | https://www.apmemory.com/en/downloadFiles/032411222116600644 |
| A-OPI3 | AP Memory APS12808L-3OBMx (3 V OPI) | Rev 1.5, 2023-07-13 (vendor); LCSC copy Rev 1.1b 2019-12-14 | https://www.apmemory.com/en/downloadFiles/0324112221xz597240 |
| A-Q128 | AP Memory APS12804O-SQRH (128 Mb QSPI) | Rev 1.0, 2023-11-30 (vendor) | https://www.apmemory.com/en/downloadFiles/0324112120wb615978 |
| A-Q64-3 | AP Memory APS6404L-3SQR | Rev 2.7, 2024-01-05 (vendor) | https://www.apmemory.com/en/downloadFiles/032411212009597427 |
| A-Q64-18 | AP Memory APS6404L-SQN | Rev 4.0, 2024-01-05 (vendor) | https://www.apmemory.com/en/downloadFiles/0324112120g3605268 |
| A-WEB | AP Memory product tables (OPI/HPI, SPI/QSPI) | fetched 2026-11-09 | https://www.apmemory.com/en/product/iotram/OPIHPI , https://www.apmemory.com/en/product/iotram/SPIQSPI |
| LCSC-API | LCSC product JSON (backs product pages) | 2026-11-08 21:19–21:23 UTC | `https://wmsc.lcsc.com/ftps/wm/product/detail?productCode=<C#>` (product page: https://www.lcsc.com/product-detail/<C#>.html) |
| JLC-API | JLCPCB parts search JSON (`componentLibraryType`: base = Basic, expand = Extended) | 2026-11-08 21:18–21:30 UTC | POST https://jlcpcb.com/api/overseas-pcb-order/v1/shoppingCart/smtGood/selectSmtComponentList (part page: https://jlcpcb.com/partdetail/<C#>) |

---

## 1. ESP-IDF facts (v6.1)

### 1a. PSRAM on ESP32-S3

**Modes / Kconfig** — `components/esp_psram/esp32s3/Kconfig.spiram` @v6.1:
- `choice SPIRAM_MODE` → `CONFIG_SPIRAM_MODE_QUAD` ("Quad Mode PSRAM", default) / `CONFIG_SPIRAM_MODE_OCT` ("Octal Mode PSRAM").
- `choice SPIRAM_TYPE`: `SPIRAM_TYPE_AUTO` (default), `SPIRAM_TYPE_ESPPSRAM16` "ESP-PSRAM16 or APS1604" (quad only), `SPIRAM_TYPE_ESPPSRAM32` (quad only), `SPIRAM_TYPE_ESPPSRAM64` "ESP-PSRAM64 , LY68L6400 or APS6408".
- `SPIRAM_CLK_IO` default 30, `SPIRAM_CS_IO` default 26 (hidden ints).
- Speed: `SPIRAM_SPEED_120M` (depends on `SPIRAM_MODE_QUAD || IDF_EXPERIMENTAL_FEATURES`; help: "Quad PSRAM 120 MHz is stable" / "Octal PSRAM 120 MHz is an experimental feature…"), `SPIRAM_SPEED_80M`, `SPIRAM_SPEED_40M` (default 40M).
- `CONFIG_SPIRAM_ECC_ENABLE` depends on `SPIRAM_MODE_OCT`: "If enabled, 1/16 of the SPI RAM total size will be reserved for error-correcting code."
- Common (`Kconfig.spiram.common`): `CONFIG_SPIRAM_IGNORE_NOTFOUND` ("If this is enabled, booting will complete but no PSRAM will be available"; depends on `!SPIRAM_ALLOW_BSS_SEG_EXTERNAL_MEMORY && !SPIRAM_ALLOW_NOINIT_SEG_EXTERNAL_MEMORY`; WiFi/LWIP then use non-PSRAM defaults).
- `components/esp_system/port/cpu_start.c` @v6.1: on `esp_psram_chip_init()` failure → with IGNORE_NOTFOUND: `"Failed to init external RAM; continuing without it."`, else `abort()`. ⇒ one firmware image can run on a PSRAM-populated and a PSRAM-less build (per build mode QUAD or OCT).

**Which driver is compiled** — `components/esp_psram/CMakeLists.txt` + `device/CMakeLists.txt` @v6.1: ESP32-S3 + MODE_OCT → `esp32s3/esp_psram_impl_octal.c`; ESP32-S3 + MODE_QUAD → `device/esp_psram_impl_ap_quad.c` (AP Memory command set, `esp_quad_psram_defs_ap.h`, MFID_AP 0x0D).

**Sizes supported (source):**
- Quad (`esp_psram_impl_ap_quad.c`): density from EID[47:45]: `0x0→2 MB, 0x1→4 MB, 0x2→8 MB`; 16/32 MB only for QEMU fake IDs, with the comment *"Do not use `density` for QEMU PSRAM since we don't want any future QSPI PSRAM that are 16MB or 32MB to be interpreted as QEMU PSRAM devices"*. Any other density → size 0, and `system_layer/esp_psram.c` then hits `assert(ret == ESP_OK)` after `esp_psram_impl_get_physical_size()`. ⇒ **16 MB QUAD PSRAM is NOT supported in ESP-IDF v6.1** (max 8 MB quad).
- Octal (`esp_psram_impl_octal.c`): MR2 density `0x1→4 MB, 0x3→8 MB, 0x5→16 MB, 0x7→32 MB, 0x6→64 MB`. ⇒ **16 MB OCTAL is supported.**
- Vendors in octal driver: `OCT_PSRAM_VENDOR_ID_AP 0xD`, `OCT_PSRAM_VENDOR_ID_UNILC 0x1A`; other IDs → warning "PSRAM ID read error … fallback to use default driver pattern". Protocol = AP Memory Xccela OPI DTR (sync read 0x0000, sync write 0x8080, reg read 0x4040, reg write 0xC0C0). Driver reports VCC "3V"/"1.8V" from MR3.
- eFuse table (`components/efuse/esp32s3/esp_efuse_table.csv` @v6.1): `PSRAM_CAP {0 None; 1 8M; 2 2M; 3 16M; 4 4M}`, `PSRAM_VENDOR {0 None; 1 AP_3v3; 2 AP_1v8}`, `FLASH_VENDOR {0 None; 1 XMC; 2 GD; 3 FM; 4 TT; 5 BY}` (in-package parts), `PIN_POWER_SELECTION` "Set default power supply for GPIO33-GPIO37; set when SPI flash is initialized {0: VDD3P3_CPU; 1: VDD_SPI}", `VDD_SPI_FORCE`, `VDD_SPI_TIEH` "{0: VDD_SPI connects to 1.8 V LDO; 1: VDD_SPI connects to VDD3P3_RTC_IO}".

**Supported vendors/parts (docs)** — external-ram.rst, v6.1, "Hardware":
> "ESP32-S3 supports PSRAM connected in parallel with the SPI flash chip. While ESP32-S3 is capable of supporting several types of RAM chips, ESP-IDF currently only supports Espressif branded PSRAM chips (e.g., ESP-PSRAM32, ESP-PSRAM64, etc)."
> "If you are using a custom PSRAM chip, ESP-IDF SDK might not be compatible with it."
- **CONFLICT/nuance:** Kconfig names non-Espressif parts (LY68L6400, APS1604, APS6408) and the drivers are AP-Memory-protocol generic.

**Discrete (off-package) octal PSRAM — hardware vs software:**
- S-DS p31 §2.6/Table 2-14 gives Octal SPI/OPI PSRAM pin mapping and says: "For off-package flash/PSRAM, these are the recommended pin mappings." Notes: "CS0 is for in-package flash", "CS1 is for in-package PSRAM".
- S-HDG: "The connection for 1.8 V, octal, off-package flash/PSRAM is as shown in Figure ESP32-S3 Schematic for Off-Package 1.8 V Octal Flash/PSRAM." and "Off-Package Flash and PSRAM: To reduce the risk of software compatibility issues, it is recommended to use flash and PSRAM models officially validated by Espressif. For detailed model selection, consult the sales or technical support team."
- S-HDG: "the following chip pins can connect at most one flash and one PSRAM."
- ESP-IDF octal driver has no in-package/off-package distinction (only CS1 + MR registers). ESP-IDF never switches GPIO33–37 power domain in code (GitHub code search: `PAD_POWER_SEL` only in register headers/ROM .ld); domain comes from eFuse `PIN_POWER_SELECTION`. ⇒ A discrete 1.8 V OPI PSRAM on a plain ESP32-S3 would need that eFuse burned (inference; **UNVERIFIED** on hardware).
- **Verdict:** Hardware: Espressif documents off-package octal PSRAM. Software: ESP-IDF docs only promise Espressif-branded PSRAM; a discrete AP Memory OPI part would *probably* work with the octal driver (same protocol/vendor ID as in-package) but is **not an Espressif-supported/validated configuration** (UNVERIFIED in practice).

**GPIOs consumed** (`components/esp_hal_gpspi/esp32s3/include/soc/spi_pins.h` @v6.1; S-DS Table 2-14):
`MSPI_IOMUX_PIN_NUM_CS1 26, HD 27, WP 28, CS0 29, CLK 30, MISO 31, MOSI 32, D4 33, D5 34, D6 35, D7 36, DQS 37`.
- Quad flash + quad PSRAM: GPIO26–32 (CS1 only extra pin vs flash alone). Quad driver reserves CS1 and WP (`esp_gpio_reserve`).
- Octal PSRAM (in- or off-package): GPIO26–37. S-HDG: "In cases where 1.8 V or 3.3 V, octal, in-package or off-package SPI flash/PSRAM is used, GPIO33 ~ GPIO37 are occupied and cannot be used for other functions." S-DS p26: GPIO33–37 "can be GPIO pins if the chip is not connected to flash or PSRAM in 8-line SPI mode."
- S-DS p18: "For ESP32-S3R8V and ESP32-S3R16V chip, as the VDD_SPI voltage has been set to 1.8 V, the working voltage for pins SPICLK_N and SPICLK_P (GPIO47 and GPIO48) would also be 1.8 V". S-DS p17–18: GPIO33–37 and GPIO47/48 are "VDD_SPI/VDD3P3_CPU" pins; "Pin Providing Power … is decided by eFuse bit EFUSE_PIN_POWER_SELECTION".

**1.8 V requirements:**
- external-ram (v6.1): "The working voltage of the PSRAM chip must match the working voltage of the flash component… For a 1.8 V PSRAM chip, make sure to either set the GPIO45 strapping pin to a high signal level on boot-up, or program ESP32-S3 eFuses to always use the VDD_SPI level of 1.8 V. Not doing this can damage the PSRAM and/or flash chip."
- S-DS p34 Table 3-4: VDD_SPI = 3.3 V (VDD3P3_RTC via RSPI) when FORCE=0 & GPIO45=0 (default; GPIO45 weak pull-down), or FORCE=1 & TIEH=1; = 1.8 V (Flash Voltage Regulator) when FORCE=0 & GPIO45=1, or FORCE=1 & TIEH=0.
- S-DS p65 Table 5-3: RSPI = 14 Ω (3.3 V mode); "ISPI Output current when VDD_SPI is powered by Flash Voltage Regulator for 1.8 V flash/PSRAM 40 mA" (typ). S-HDG: "The typical current this LDO can offer is 40 mA." and "VDD_SPI can also be driven by an external power supply."
- S-DS p64 Table 5-2: VDD_SPI (as input) 1.8–3.6 V.
- 32 MB virtual window (external-ram v6.1): "ESP32-S3 has the ability to use up to 32 MB of virtual addresses for external PSRAM … The 32 MB virtual addresses are shared with flash instructions and rodata."
- Temperature (S-DS p13, note 3): octal-PSRAM chips are –40~65 °C; "if the PSRAM ECC function is enabled, the maximum ambient temperature can be improved to 85 °C, while the usable size of PSRAM will be reduced by 1/16."

### 1b. Flash on ESP32-S3

**Vendor support (docs, spi_flash/index.rst v6.1):** "Quad mode (QIO/QOUT) is supported on the following chip types: 1. ISSI 2. GD 3. MXIC 4. FM 5. Winbond 6. XMC 7. BOYA." "The fast/slow read and Dual mode (DOUT/DIO) of almost all flashes with 24-bit address are supported".
**Optional-features doc (v6.1):** "This document only shows that ESP-IDF code has supported the features of those flash chips. It is not a list of stable flash chips certified by Espressif."
**Source:** `components/spi_flash/esp32s3/Kconfig.soc_caps.in` enables XMC, GD, ISSI, MXIC, Winbond, BOYA, TH. `spi_flash_chip_drivers.c` registers issi, gd, mxic, winbond, boya, th, mxic_opi, then `generic` ("FM, Winbond and XMC chips are supposed to be supported by this chip driver"). Runtime probes: GD accepts 0xC8 with product 0x40xx/0x60xx/0x83xx/0x43xx (GD25LQ → 16-bit WRSR, QE bit 9); Winbond accepts any 0xEF; MXIC accepts any 0xC2; BOYA requires 0x68 + 0x40xx. **Puya (0x85) and Zbit (0x5E) have no dedicated driver and are not in the docs' QIO list** (generic driver).

**Bootloader QIO enable table** (`bootloader_flash/src/flash_qio_mode.c` @v6.1):
```
{ "MXIC", 0xC2, 0x2000, 0xFF00, 8b RDSR, 8b WRSR, 6 },
{ "ISSI", 0x9D, 0x4000, 0xCF00, 8b RDSR, 8b WRSR, 6 },
{ "WinBond", 0xEF, 0x4000, 0xFF00, 16b RDSR+RDSR2, 16b WRSR, 9 },
{ "GD", 0xC8, 0x6000, 0xFF00, 16b RDSR+RDSR2, 16b WRSR, 9 },
{ "XM25QU64A", 0x20, 0x3817, 0xFFFF, … 6 },
{ "TH", 0xcd, 0x6000, 0xFF00, … 9 },
{ NULL, 0xFF, 0xFFFF, 0xFFFF, 8b RDSR2 (0x35), 8b WRSR2 (0x31), 1 }   // default
```
`CMD_RDSR2 0x35`, `CMD_WRSR2 0x31` (bootloader_flash_priv.h). Consequences:
- W25Q128JW-IQ (EF 60 18) / -IM (EF 80 18), W25Q128JV-IM (EF 70 18), GD25Q128E (C8 40 18), XM25QH128C (20 40 18), BY25Q128ES (68 40 18), Puya (85 xx xx) → **default entry (35h/31h, bit 1)**; all of these datasheets list 35h = read SR2 and 31h = write SR2 → OK.
- GD25LQ128E / GD25LB128E (C8 60 18) → "GD" entry (01h 2-byte write) → OK (GD25LQ128E has no 31h; uses 01h with 2 bytes).
- **MX25U12835F (C2 25 38) does NOT match the MXIC entry (0x2538 & 0xFF00 ≠ 0x2000) → default entry sends 0x35, which on Macronix is "EQIO" ("By issuing EQIO command (35h), the QPI mode is enabled", M-U p15). Inferred QIO-boot failure risk — UNVERIFIED on hardware; avoid MX25U12835F or use DIO / override the weak `bootloader_flash_qe_support_list`.** (`bootloader_flash_unlock` treats all 0xC2 as MXIC and is safe.)

**Modes / frequency (Kconfig @v6.1):**
- `ESPTOOLPY_FLASHMODE`: QIO, QOUT, DIO (default), DOUT, OPI (octal). "we use esptool to flash bootloader in dio mode for QIO/QOUT, bootloader then upgrades itself to quad mode during initialisation".
- `components/spi_flash/esp32s3/Kconfig.flash_freq`: 120 MHz (depends on `SPI_FLASH_HPM_ON || ESPTOOLPY_OCT_FLASH`), **80 MHz (default)**, 40, 20.
- HPM (>80 MHz) chip list in `spi_flash_hpm_enable.c` @v6.1: GD 0xC84016/17 (C-series, cmd), XMC 0x204017/18 & 0x464016/17/18, GD E-series 0xC84017/18 (DC-adjust, needs `BOOTLOADER_FLASH_DC_AWARE`), XMC 0x204019/20, ZB 0x5E4016, "nothing-to-do" 0xC86019 (GD25LQ255E) and 0xEF4017. Doc list (optional_feature v6.1): GD25Q64C, GD25Q32C, ZB25VQ32B, GD25LQ255E (no DC); GD25Q64E, **GD25Q128E**, XM25QH64C, **XM25QH128C** (DC aware). **No 1.8 V 128 Mbit part (W25Q128JW, GD25LQ128E, XM25QU128C, MX25U12835F, PY25Q128LA) and not W25Q128JV is in the HPM list** → for those, use 80 MHz; at 120 MHz the driver logs "High performance mode of this flash model hasn't been supported." (120 MHz behaviour UNVERIFIED).
- flash_psram_config.rst v6.1: "Quad flash only supports STR mode… Quad PSRAM only supports STR mode, while Octal PSRAM only supports DTR mode." **F4R8 (quad flash + octal PSRAM) table:** A: flash 120 MHz SDR ↔ PSRAM 120 MHz DDR; B: 80 MHz SDR ↔ 80 MHz DDR; C: 40/20 MHz SDR ↔ 40 MHz DDR; "Flash mode in group A works with PSRAM mode in group A/D. Flash mode in group B/C works with PSRAM mode in group B/C/D." **F4R4:** 120/80/40/20 MHz both; A↔A/C/D, B↔B/C/D, C↔A/B/C/D. 120 MHz DDR needs `CONFIG_IDF_EXPERIMENTAL_FEATURES` with temperature-drift risk.

**Max flash size & caveats:** `ESPTOOLPY_FLASHSIZE` choices up to 128 MB. optional_feature v6.1 §32-bit address: "Most NOR flash chips … use 24-bits address, which can cover 16 MB"; >16 MB QSPI needs 32-bit-address support (W25Q256, GD25Q256, XM25QH256D); "For Quad flash chips, by default, the part of flash above 16 MB can be used for data storage"; mapping above 16 MB = experimental (`CONFIG_BOOTLOADER_CACHE_32BIT_ADDR_QUAD_FLASH`). ⇒ **16 MB (128 Mbit) is the largest fully-mapped QSPI size without caveats.**

**1.8 V flash:** ESP-IDF is voltage-agnostic; hardware rule = flash voltage must equal VDD_SPI (S-HDG: "make sure to select the appropriate off-package flash and RAM according to the power voltage on VDD_SPI (1.8 V/3.3 V)"). Espressif's own 1.8 V flash spec (S-DS p68 Table 5-11): VCC 1.65 / 1.80 / 2.00 V; 3.3 V: 2.7 / 3.3 / 3.6 V.

---

## 2. 16 MB (128 Mbit) quad SPI NOR candidates

Pinout of all 8-pin parts checked (W25Q128JW/JV, GD25LQ128E): 1 CS#, 2 DO/IO1, 3 WP#/IO2, 4 GND, 5 DI/IO0, 6 CLK, 7 HOLD#/IO3, 8 VCC. WSON 6×5 land patterns of different vendors **not compared (UNVERIFIED)**.

### 1.8 V parts
| Part | Supply | Packages (datasheet) | Max clock | QE default / ID | ESP-IDF fit |
|---|---|---|---|---|---|
| **Winbond W25Q128JW** (W-JW Rev G) | "Vcc:1.7~1.95V" (p5) | S = SOIC-8 208-mil; **P = WSON8 6x5-mm**; E = WSON8 8x6; F = SOIC-16 300-mil; B/C = TFBGA-24 8x6; Y/K = 21-ball WLCSP; T = VSOP-8 (p76). No USON 4x4/4x3. | "Clock frequency for SPI EBh instruction (< 85℃) … 133 MHz"; 104 MHz other SPI instr.; 50 MHz 03h (p65) | **IQ/JQ: "QE = 1 (fixed)"**; IN: QE=1 fixed + DRV 75 %; **IM/JM: "QE = 0 (programmable)"** (p17, p76). IDs: IQ/JQ **EF 60 18**, IM/JM **EF 80 18** (p22). | Winbond in QIO list; bootloader default entry (35h/31h) OK |
| **GigaDevice GD25LQ128E** (G-LQ Rev1.3) | "Full voltage range: 1.65-2.0V" (p4) | SOP8 208mil (S), VSOP8 208mil (V), SOP16 300mil (F), **USON8 (4x4mm) (Q)**, **WSON8 (6x5mm) (W)**, WSON8 (8x6mm) (Y), TFBGA-24 (B) (p59) | Fc 133 MHz (VCC 1.65–2.0 V, 30 pF) (p50); Rev1.3 "Modify FC Value from 120MHz to 133MHz" | QE (S9) "set to 0 (Default)" (p14); ID **C8 60 18** (p19); SR write = 01H 2 bytes | Exact match in bootloader "GD" entry + runtime GD driver |
| GigaDevice GD25LB128E (G-LB) | 1.65–2.0 V | SOP8 / WSON8 etc. | — | "QE bit is set to 1 as default and cannot be changed"; ID C8 60 18 | as GD25LQ |
| XMC XM25QU128C (X-QU product page only) | page shows "Vcc 1.65V~2.0V" and "voltage: 1.65v to 1.95v" (**CONFLICT** on same page); Status "NR" | SOP-8 208, USON 4x4 8L, WSON 5x6 8L, KGD | 133 MHz | **UNVERIFIED** (datasheet login-gated) | XMC in QIO list |
| Macronix MX25U12835F (M-U Rev1.9) | "1.65 to 2.0 volt" (p1) | 8-SOP 208 mil (M2), 8-WSON 6x5 (ZN), 8-WSON 8x6 (Z2), 16-SOP, WLCSP-23, BGA (per LCSC listings) | 4READ 104 MHz; 133 MHz only "-08G" part (p11/p31 note) | QE "0 (factory default)" (p31); ID **C2 25 38** (p26); **35h = EQIO** (p15) | **Bootloader QIO risk (see §1b)** |
| Puya P25Q128L (P-L) | 1.65–2.0 V | SOP8 208, VSOP8, SOP16, WSON8 6x5x0.75 | **fQ (4READ/QREAD/QPI) = 70 MHz**; fC 85 MHz (p11) | QE default 0 | Too slow for 80 MHz QIO; Puya not in QIO list |
| Puya PY25Q128LA (P-LA Rev1.6) | "Supply Range from 1.65 to 2.0V" | **USON8 4x4x0.45mm (QV)**, WSON8 6x5x0.75 (WX) (p94) | fC 133 MHz (p9 Table 5-3-1) | QE (S9) default 0; 35H/31H present; MFID 85h | Puya not in docs' QIO list (generic driver) |
| Zbit ZB25LQ128 | **UNVERIFIED** (no primary datasheet obtained) | JLC listings: DFN5x6-8, SOP-8-208 | — | — | not in QIO list |
| Boya 1.8 V 128 Mbit | **none found** at LCSC/JLC (searches BY25LQ128/BY25Q128EL → 0) | | | | |

### 3.3 V parts
| Part | Supply | Packages | Max clock | QE default / ID |
|---|---|---|---|---|
| **Winbond W25Q128JV** (W-JV Rev J) | "Single 2.7 to 3.6V supply" (p5) | SOIC-8 208-mil, SOIC-16 300-mil, **WSON 6x5 (P)** / 8x6 (E), TFBGA-24 8x6, 24-ball WLCSP (p5) | 133 MHz at 3.0–3.6 V; 104 MHz at 2.7–3.0 V (p61, p65) | IQ/IN/JQ QE=1 fixed (p17), ID **EF 40 18** (p22); IM: QE=0, ID EF 70 18 (W-JVD) |
| **GigaDevice GD25Q128E** (G-Q Rev1.4) | "Full voltage range: 2.7-3.6V" (p4) | SOP8 208mil, SOP16 300mil, **USON8 (4x4mm, 0.45mm thickness)**, WSON8 6x5, WSON8 8x6, TFBGA-24 (p4) | 133 MHz (FC1, DC=1, 3.0–3.6 V) (p45) | QE "0 (Default)" (p15); ID **C8 40 18** (p20); has 31H (p18). In ESP-IDF HPM (120 MHz) list (DC-aware) |
| XMC XM25QH128C (X-QH Rev1.2) | "2.3-3.6V" | SOP8 208 (H), VSOP8 (R), WSON 5x6 (W), **USON 4x4 (U3)**, TFBGA, WLCSP | 133 MHz | QE code "G: QE=0; Q: Green Package with QE=1 fix(default)" (p7); ID **20 40 18** (p24). In HPM list |
| Macronix MX25L12833F (M-L Rev1.0) | "2.7 to 3.6 volt" (p4) | 8-SOP 200mil, 16-SOP 300mil, 8-WSON 6x5, 8-WSON 8x6 | 133 MHz | QE factory default 0; ID **C2 20 18** (p25) → matches bootloader MXIC entry |
| Puya PY25Q128HA (P-HA V1.2) | "2.7 to 3.6V" | SOP8 150/208, WSON8 6x5x0.75, **USON8 4x4x0.45** | fC 133 MHz | QE default 0 |
| Boya BY25Q128ES (B-ES Rev2.11) | "2.7~3.6V" | SOP8 208, WSON8 5x6, **USON8 4x4**, LGA8 4x3, SOP16, WSON8 6x8 | "Fast Read (Serial): 120MHz" | QE "0 (Default)"; ID **68 40 18** (matches ESP-IDF BOYA probe) |
| Boya BY25Q128AS (B-AS Rev0.0) | 2.7–3.6 V | SOP8 208, WSON 5x6 (per LCSC) | (Normal read 55 MHz; fast-read value not extracted) | — |
| Zbit ZB25VQ128 | JLC listing says 2.3–3.6 V, 104 MHz — **UNVERIFIED** (no primary datasheet) | | | |

### LCSC / JLCPCB data (LCSC-API & JLC-API, 2026-11-08 ~21:20 UTC). "JLC" = JLCPCB assembly stock; price = LCSC @1 pc (and high-qty where useful). All Extended except where stated.
**1.8 V**
| C# | MPN | Pkg | LCSC stock | JLC stock | LCSC price | JLC lib |
|---|---|---|---|---|---|---|
| C2689660 | W25Q128JWPIQ | WSON-8 5x6 | 4,741 | 4,741 | $5.3471 (1k: $3.0598) | Extended |
| C7150041 | W25Q128JWPIM | WSON-8 5x6 | 15 | 15 | $4.4838 | Extended |
| C7150045 | W25Q128JWSIQ | SOIC-8 208 | 8,478 | 8,478 | $3.3977 | Extended |
| C52993625 | W25Q128JWBAQ | TFBGA-24 6x8 | 3,723 | 3,723 | $4.6181 | Extended |
| C6750401 / C6326898 | W25Q128JWYIQ / YIM | WLCSP-21 | — | 0 | — | Extended |
| C2928889 | **GD25LQ128EWIGR** | WSON-8 5x6 | 2,524 | 2,527 | **$1.1659** | Extended |
| C2927797 | GD25LQ128ESIGR | SOP-8 208 | 1,017 | 1,069 | $2.2889 | Extended |
| C2928888 | GD25LB128ESIGR | SOP-8 | 1,983 | 1,983 | $2.164 | Extended |
| C2974001 | GD25LB128EWIGR | WSON-8 5x6 | 0 | 0 | $2.7024 | Extended |
| C9900313340 | GD25LQ128EQIG (USON 4x4) | — | (JLC "Assembly" placeholder) | 0 | — | — |
| C38730309 | XM25QU128CHIQT08Q | SOP-8 208 | not found | 0 | — | Extended |
| C2802865 | MX25U12835FZNI-10G | WSON-8 5x6 | 15 | 15 | $13.6322 | Extended |
| C6611928 | MX25U12835FM2I-10G | SOIC-8 208 | 0 | 0 | $2.4814 | Extended |
| C559229 | P25Q128L-WXH-IR | WSON-8 5x6 | 47 | 47 | $0.7999 | Extended |
| C55173067 | PY25Q128LA-QVH-IR | **USON-8 4x4** | 30 | 30 | $1.2931 | Extended |
| C54741437 | PY25Q128LA-WXH-IR | WSON8 5x6 | 35 | 35 | $1.4091 | Extended |
| C22387407 / C22440706 | ZB25LQ128B / ZB25LQ128CS | DFN5x6 / SOP-8 | not found | 0 | — | Extended |

**3.3 V**
| C# | MPN | Pkg | LCSC stock | JLC stock | LCSC price | JLC lib |
|---|---|---|---|---|---|---|
| **C97521** | **W25Q128JVSIQ** | SOIC-8 208 | 0 | **69,062** | $2.3402 (JLC $2.3191) | **Basic** (`componentLibraryType: base`) |
| C190862 | W25Q128JVPIQ | WSON-8 5x6 | 12,294 | 12,898 | $3.444 | Extended |
| C2441427 | W25Q128JVPIM | WSON-8 5x6 | 21,406 | 21,406 | $2.8238 | Extended |
| C2928891 | GD25Q128ESIGR | SOP-8 208 | 16,708 | 16,708 | $1.4009 | Extended |
| C2982923 | GD25Q128EWIGR | WSON-8 5x6 | 1,564 | 1,931 | $3.3528 (1k $1.3577) | Extended |
| C24733358 | GD25Q128EWIGY | WSON8 5x6 | 2,262 | 2,262 | $2.1412 | Extended |
| C22357558 | GD25Q128EQIGR | DFN-8 4x4 | not found | 0 | — | Extended |
| C2858567 | XM25QH128CHIQT08Q | SOP-8 208 | 0 | 0 | $0.8881 | Extended |
| C17810878 | XM25QH128CWIQ | WSON-8 5x6 | not found | 0 | — | Extended |
| C701355 | MX25L12833FM2I-10G | SOP-8 200 | 1,562 | 1,562 | $3.546 | Extended |
| C2802709 | MX25L12833FZNI-10G | WSON-8 5x6 | 0 | 0 | $3.6005 | Extended |
| C5354566 | PY25Q128HA-SUH-IR | SOP-8 208 | 13,446 | 13,793 | $1.2741 | Extended |
| C18208279 | PY25Q128HA-WXH-IR | WSON-8 | 13,000 | 13,000 | $1.3476 | Extended |
| C53264456 | PY25Q128HA-QVH-IR | USON8 4x4 | — | 0 | — | Extended |
| C383794 | BY25Q128ASSIG(R) | SOP-8 208 | 2,904 | 3,080 | $1.703 | Extended |
| C55097692 | BY25Q128ESWIG(R) | WSON-8 5x6 | 275 | 275 | $1.5651 | Extended |
| C49023667 | BY25Q128ESSIG(R) | SSOP-8 208 | 10,272 | 10,272 | $1.1164 | Extended |
| C609616 | ZB25VQ128ASIG | SOP-8 208 | not found | 0 | — | Extended |

**Smallest leadless 128 Mbit package actually stocked:** WSON-8 6×5 mm for all mainstream parts; USON-8 4×4 only PY25Q128LA-QVH-IR (30 pcs, Puya not in ESP-IDF QIO list). USON 4×3 128 Mbit: none found. JLCPCB capabilities page (https://jlcpcb.com/capabilities/pcb-assembly-capabilities): BGA min spacing 0.5 mm (Economic) / 0.3 mm (Standard); IC pin spacing 0.4 mm / 0.35 mm.

Data-quality notes: JLC listing C2986327 "GD25Q128EWIGR 1.65V~3.6V 104MHz" contradicts G-Q (2.7–3.6 V, 133 MHz) — **CONFLICT (distributor data error)**. GD25LQ128E LCSC mirror is Rev1.0 (120 MHz) vs vendor Rev1.3 (133 MHz). LCSC param for APS6404L-3SQR-SN says "2.7V~3.3V" vs datasheet 2.7–3.6 V — **CONFLICT**. JLC vs LCSC stock are separate warehouses (e.g., C97521 JLC 69,062 vs LCSC 0).

---

## 3. Discrete PSRAM

### 3a. 16 MB octal (OPI)
- **APS12808L-OBM(X)-BA** (A-OPI Rev3.4): "VDD=1.62 to 1.98V; VDDQ=1.62 to 1.98V"; OPI Xccela DDR "Clock rate up to 200MHz"; "128Mb, 16M x 8bits with 1024 bytes page size"; "mini-BGA 24B package 6 x 8 x 1.2mm, ball pitch 1.0mm, ball size 0.4mm, package code “BA”"; ordering: APS12808L-OBM-BA (Tc –40~85 °C, 200 MHz), APS12808L-OBMX-BA (–40~105 °C).
- **APS12808L-3OBM(X)-BA** (A-OPI3 Rev1.5): "VDD = 2.7 to 3.6V; VDDQ = 2.7 to 3.6V", "Clock rate up to 133MHz", same 6×8×1.2 mm BGA-24, 1.0 mm pitch.
- "APS12808L-OBR" (as named in the task) — **not listed** on AP Memory's OPI table (only APS12808L-OBM, APS12808L-3OBM, APS128XXO-OB9 at 128 Mb; "-OBR" suffix exists only for 256/512 Mb). APS12808O also not listed. **UNVERIFIED/does not appear to exist.**
- AP Memory OPI table status: APS12808L-OBM 1.8 V "MP"; APS12808L-3OBM 3.3 V "MP".
- Availability: LCSC **C5197285 APS12808L-3OBM-BA: stock 0** (list $3.1573); C17701412 APS12808L-3OBMX-BA: JLC 0, LCSC not found; APS12808L-OBM-BA: only JLC "Assembly" placeholder C9900258368, stock 0. DigiKey search "APS12808L" → "did not return any results" (WebFetch 2026-11-09). Mouser → captcha/blocked (**UNVERIFIED**).
- ESP-IDF: octal driver handles 16 MB AP Xccela parts, but docs restrict support to Espressif-branded PSRAM (see §1a).

### 3b. 16 MB QSPI PSRAM
- **Exists:** AP Memory SPI/QSPI table lists **APS12804O-SQRH** (128 Mb, 1.8 V, X4, 144 Mbps, MP) and **APS12804O-DQ** (128 Mb, 1.8 V, 333 Mbps). A-Q128 Rev1.0: "VDD=1.62 to 1.98V", "144MHz for Wrapped Burst … 84MHz for Linear 2048 Burst", "128Mb, 16M x 8bits", page 2048 B. Ordering: "APS12804O-SQRH … Bare die, SIP"; "APS12804O-SQRH-SN … SOP8 (Only for validation)"; §3 "available in 8-lead SOP-8L(150)".
- **CONFLICT:** AP Memory web table marks APS12804O-SQRH columns KGD = V and WLCSP = V, USON8/SOP8 blank, whereas the datasheet lists SOP-8L(150) (validation only).
- Availability: JLC only "Assembly" placeholders (APS12804O-SQRH-WA WLCSP-15, APS12804O-SQRH-SN SOP-8), stock 0; not at LCSC.
- **ESP-IDF v6.1 cannot use it** (quad driver max 8 MB; see §1a). No 16 MB QSPI PSRAM found from Lyontek, IPUS, Vilsion, ISSI at JLC/LCSC (ISSI IS66WVS8M8 = 64 Mb; ISSI 128 Mb parts are HyperRAM/OctalRAM, different protocol).

### 3c. 8 MB QSPI PSRAM
| Part | Source facts | LCSC / JLC (2026-11-08 UTC) |
|---|---|---|
| **APS6404L-3SQR** (A-Q64-3 Rev2.7) | "VDD=2.7 to 3.6V"; "133MHz for 32 Bytes Wrapped Burst operation at VDD=3.0V+/-10%; 109MHz … at VDD=3.3V+/-10%; 84MHz for Linear Burst"; "available in … SOP-8L(150) and … USON-8L 3x2mm"; ICC read/write 7 mA | **C5333729 APS6404L-3SQR-SN** (SOP-8): LCSC 2,882 / JLC 2,882, $4.0125; **C3040877 APS6404L-3SQR-ZR** (USON-8 3x2): LCSC 1,212 / JLC 1,341, $4.9102. Extended |
| APS6404L-SQN (1.8 V) (A-Q64-18 Rev4.0) | "VDD=1.62 to 1.98V", "Clock rate up to 144MHz", SOP-8L(150) / USON-8L 3x2mm | C5360304 APS6404L-SQN-SN: 522, $1.9345; C5360305 APS6404L-SQN-ZR (USON 2x3): LCSC 8 / JLC 9, $5.2251. Extended |
| APS6404L-3SQN | (3.0 V per AP table) | C3028887: 570, $3.7032 |
| APS6404L-SQR (1.8 V) | (AP table) | C43758152 -ZR: 60, $4.6042 |
| ESP-PSRAM64H / ESP-PSRAM64 | Espressif datasheet URL now returns 404 (2026-11-09) → specs **UNVERIFIED** | C7543912 ESP-PSRAM64: JLC 0, LCSC not found; ESP-PSRAM64H: JLC placeholders only, 0 |
| LY68L6400 (Lyontek) | primary datasheet not obtained → **UNVERIFIED** (JLC text: 2.7–3.6 V, SOP-8) | C261881: JLC 0, LCSC not found |
| VTI7064MSME (Vilsion) | **UNVERIFIED** (LCSC param 2.7–3.3 V, SOIC-8) | C139966: 265, $4.7396 |
| IS66WVS8M8FBLL-104NLI (ISSI 64 Mb) | — | C39372041: 6, $11.39 |

**Plain statement:** As of 2026-11-09 there is **no discrete 16 MB PSRAM that (a) ESP-IDF v6.1 supports and (b) is buyable at LCSC.** 16 MB QSPI parts are unsupported by ESP-IDF and not stocked; 16 MB OPI parts (APS12808L-OBM/-3OBM, 6×8 mm BGA-24) are not stocked at LCSC/DigiKey and are not an Espressif-supported off-package configuration. The largest stocked, driver-supported discrete PSRAM is 8 MB QSPI (APS6404L family).

---

## 4. SoC parts (LCSC/JLC, 2026-11-08 ~21:19 UTC)
| C# | MPN | Pkg | LCSC stock | JLC stock | LCSC price | JLC lib |
|---|---|---|---|---|---|---|
| C2913192 | ESP32-S3 | QFN-56-EP 7x7 | 745 | 931 | $2.8353 @1; $1.9354 @1000 | Extended |
| C22458657 | **ESP32-S3R16V** | QFN56-7X7-0.4 | **LCSC page: "Part not found"** | **0** (JLC page: Extended, no stock/price shown; API price is a $0.0398 placeholder) | — | Extended |
| C2913194 | ESP32-S3R8 | QFN-56 7x7 | 11,178 | 12,738 | $3.178 @1; $2.1671 @1000 | Extended |
| (C2913195) | "ESP32-S3(R8V)" | | not found | 0 | | EOL per S-DS |

S-DS p13 Table 1-1: ESP32-S3 (no in-pkg memory, –40~105 °C, VDD_SPI 3.3 V/1.8 V, rev v0.1/v0.2); ESP32-S3R8 (8 MB Octal, –40~65 °C, 3.3 V); **ESP32-S3R16V (16 MB Octal SPI, –40~65 °C, VDD_SPI 1.8 V, rev v0.2)**; ESP32-S3R8V EOL.

**R16V ⇒ 1.8 V flash (Espressif sources):**
- S-DS p13 Fig 1-1 nomenclature: suffix **"V" = "1.8 V external SPI flash only"**.
- S-DS p13 Table 1-1: R16V VDD_SPI Voltage = 1.8 V.
- S-DS p18: "For ESP32-S3R8V and ESP32-S3R16V chip, as the VDD_SPI voltage has been set to 1.8 V…".
- S-MOD p4 note 7: "Please note that the VDD_SPI voltage is 1.8 V for ESP32-S3-WROOM-1-N16R16VA and ESP32-S3-WROOM-1U-N16R16VA only." p39: "For modules with PSRAM, the VDD_SPI voltage is fixed to 3.3 V or 1.8 V via eFuse".
- Whether **bare** R16V chips ship with VDD_SPI_FORCE/PIN_POWER_SELECTION eFuses burned is implied ("has been set") but not stated word-for-word → **UNVERIFIED**. (Either way, pulling GPIO45 high gives 1.8 V, so a GPIO45 pull-up is safe for both R16V and plain ESP32-S3.)

---

## 5. Flash in ESP32-S3-WROOM-1-N16R16VA
- S-MOD v1.8: Table 1-1 "ESP32-S3-WROOM-1-N16R16VA 16 MB (Quad SPI) 16 MB (Octal SPI) –40~65"; schematic (p39) labels the flash only as **"U2 FLASH"** — no vendor/MPN. Note 3: "By default, the SPI flash on the module operates at a maximum clock frequency of 80 MHz and does not support the auto suspend feature."
- eFuse `FLASH_VENDOR` field covers in-package flash only.
- Web search found no authoritative source. **UNVERIFIED — not documented by Espressif.**

---

## 6. UNVERIFIED / CONFLICT list
1. Flash MPN inside WROOM-1-N16R16VA — not documented.
2. Bare R16V factory eFuse state (VDD_SPI_FORCE/TIEH, PIN_POWER_SELECTION).
3. Mouser / DigiKey stock for APS12808L-OBM-BA and ESP32-S3R16V (blocked; DigiKey "APS12808L" = no results).
4. "APS12808L-OBR" part number does not appear on AP Memory site.
5. APS12804O-SQRH packages: web table (KGD/WLCSP) vs datasheet (SOP-8 validation only, bare die/SiP).
6. Newer Winbond / Macronix datasheet revisions than those read (vendor sites JS/login).
7. XM25QU128C details (QE default, ID): datasheet login-gated; product page has internal voltage conflict.
8. ESP-PSRAM64H, LY68L6400, ZB25VQ128/ZB25LQ128, VTI7064 specs: no primary datasheet obtained.
9. MX25U12835F QIO boot failure — inferred from ESP-IDF source + Macronix datasheet, not hardware-tested.
10. 120 MHz QIO on W25Q128JW/GD25LQ128E/W25Q128JV — not in ESP-IDF HPM list; untested.
11. Clean boot of an octal-PSRAM firmware build on a PSRAM-less plain ESP32-S3 at full flash speed (IGNORE_NOTFOUND path exists; flash timing restore after failed octal probe not traced).
12. ESP-IDF docs "Espressif-branded PSRAM only" vs Kconfig naming LY68L6400/APS1604/APS6408 (CONFLICT, software-support scope).
13. Discrete octal PSRAM: HW documented by Espressif (DS/HDG) vs SW support statement (docs).
14. Distributor parametric errors (C2986327; APS6404L-3SQR-SN voltage).
15. WSON 6×5 land-pattern compatibility W25Q128JW vs GD25LQ128E (not compared).

---

## 7. Recommendation (A vs B)
**A (R16V ↔ plain ESP32-S3 on one footprint, 1.8 V 16 MB quad flash)** is the only route to 16 MB PSRAM that ESP-IDF v6.1 supports with an Espressif-validated memory (the R16V is exactly the SoC in Espressif's N16R16VA module, which pairs it with a 1.8 V quad flash). Advantages: no PSRAM package on a ≤14 mm board, 8-line DDR PSRAM (80 MHz DDR stable), DNP variant = just swap the QFN (plain S3 is –40~105 °C and 3.3 V/1.8 V capable), one firmware via `CONFIG_SPIRAM_IGNORE_NOTFOUND`. Costs: R16V currently **not orderable at LCSC/JLC** (blocker – must source/consign elsewhere); R16V ambient –40~65 °C (85 °C with ECC, –1/16 capacity) — check dongle thermal; GPIO33–37 unusable on the shared PCB; GPIO47/48 are 1.8 V on R16V (avoid); VDD_SPI 1.8 V LDO is 40 mA typ for flash + PSRAM; plain-S3 build needs GPIO45 pull-up (or eFuse) or the 1.8 V flash gets 3.3 V (W25Q128JW abs-max 2.5 V).
Flash for A: **GD25LQ128EWIGR (C2928889, WSON-8 6×5, 1.65–2.0 V, 133 MHz, $1.17, 2.5k stock; exact match in ESP-IDF bootloader QIO table and runtime GD driver)**, second source **W25Q128JWPIQ (C2689660, WSON-8 6×5, 1.7–1.95 V, QE fixed = 1, $5.35, 4.7k stock)** — same 8-pin pinout. Avoid MX25U12835F (QIO risk, 15 pcs, $13.6), P25Q128L (70 MHz quad), XM25QU128C/Zbit (no stock). Run flash at 80 MHz QIO.

**B (plain S3 + discrete flash + optional PSRAM)** is fully stocked (e.g., W25Q128JVSIQ Basic C97521 / W25Q128JVPIQ C190862 / GD25Q128EWIGR C2982923 + APS6404L-3SQR-ZR C3040877 USON 3×2) but **caps PSRAM at 8 MB** with ESP-IDF; a discrete 16 MB is either unsupported (QSPI) or unobtainable + unsupported-by-docs + hard to route (OPI BGA-24 6×8 mm, 11 signals incl. GPIO33–37, eFuse for 1.8 V pad domain). Choose B only if 8 MB is acceptable or R16V cannot be sourced.
