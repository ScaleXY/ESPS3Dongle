# R1 — ESP32-S3 silicon facts (research notes)

Research date: 2026-11-09. All facts below come from Espressif primary sources (datasheets, TRM, errata, HW design guidelines, product-selector data, PCNs/advisories, Espressif GitHub source/docs). Each fact carries a source tag + page/section. Verbatim quotes are in "double quotes". Items I could not verify are marked **UNVERIFIED**; conflicts are marked **CONFLICT**.

Method note: the Read tool could not render PDFs (no `pdftoppm`), so PDF text was extracted with macOS PDFKit (JXA, `osascript -l JavaScript`). Figures/tables whose text extraction was ambiguous were rendered to PNG via PDFKit and checked visually (pages listed below). Scripts: `scratchpad/r1-scripts/`; extracted text: `scratchpad/r1-text/`; renders: `scratchpad/r1-img/`; downloads: `scratchpad/r1/<one dir per file>/`. Nothing downloaded was executed.

---------------------------------------------------------------------------------------------------

## 0. Sources (version / date / URL)

| Tag | Document | Version / date | URL |
|---|---|---|---|
| DS | ESP32-S3 Series Datasheet | **v2.2**, revision-history date 2026-03-05 (PDF CreationDate 2026-03-09) | https://www.espressif.com/sites/default/files/documentation/esp32-s3_datasheet_en.pdf (301 → https://documentation.espressif.com/esp32-s3_datasheet_en.pdf) |
| TRM | ESP32-S3 Technical Reference Manual | **v1.8**, 2026-03-04 (p.1524) | https://www.espressif.com/sites/default/files/documentation/esp32-s3_technical_reference_manual_en.pdf (301 → documentation.espressif.com) |
| ERR | ESP32-S3 Series SoC Errata | **v1.3**, 2025-03-31 (PDF build 2026-10-29) | Requested URL esp32-s3_errata_en.pdf redirects to HTML https://docs.espressif.com/projects/esp-chip-errata/en/latest/esp32s3/index.html ; PDF used: https://docs.espressif.com/projects/esp-chip-errata/en/latest/esp32s3/esp-chip-errata-en-master-esp32s3.pdf |
| HDG | ESP32-S3 Hardware Design Guidelines | "Release master", PDF dated Nov 05 2026; last revision-history entry **v1.8 (2025-07-03)** | https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32s3/esp-hardware-design-guidelines-en-master-esp32s3.pdf |
| PS | ESP Product Selector (live JSON behind the UI) | fetched 2026-11-09 | data: https://products.espressif.com/api/user/products?language=en ; UI: https://products.espressif.com/#/product-selector?language=en |
| PCN-R2 | PCN20251001 "Upgrade ESP32-S3R2 and ESP32-D0WDR2-V3 Products" | issued 2025-11-28; change 2025-12-15; first shipment 2026-01-30 | https://www.espressif.com/sites/default/files/pcn_downloads/PCN20251001_ESP32-S3R2_ESP32-D0WDR2-V3_%E5%8D%87%E7%BA%A7.pdf |
| PCN-REV | PCN20220602 "Upgrade Chip Revision of ESP32-S3 Series Products" | issued 2022-08-11; first shipment 2022-11-11 | https://www.espressif.com/sites/default/files/pcn_downloads/PCN20220602%20Upgrade%20Chip%20Revision%20of%20ESP32-S3%20Series%20Products.pdf |
| PCN-W2 | PCN20220802 "BOM Change for ESP32-S3-WROOM-2" | issued 2022-09-22 | https://www.espressif.com/sites/default/files/pcn_downloads/PCN20220802%20ESP32-S3-WROOM-2%20%E6%A8%A1%E7%BB%84%20BOM%20%E5%8F%98%E6%9B%B4.pdf |
| PCNLIST | PCN list filtered "ESP32-S3" | fetched 2026-11-09 | https://www.espressif.com/en/support/documents/pcns?keys=ESP32-S3 |
| AR22-004 | Security Advisory AR2022-004 "USB_OTG & USB_Serial_JTAG Download Functions of ESP32-S3 Series Products" | V1.1, 2022-12-21 | https://www.espressif.com/sites/default/files/advisory_downloads/AR2022-004%20Security%20Advisory%20for%20USB_OTG%20%26%20USB_Serial_JTAG%20Download%20Functions%20of%20ESP32-S3%20Series%20Products%20EN.pdf |
| PICO | ESP32-S3-PICO-1 Series Datasheet | v1.2, 2026-07-09 | https://www.espressif.com/sites/default/files/documentation/esp32-s3-pico-1_datasheet_en.pdf |
| WROOM1 | ESP32-S3-WROOM-1 & WROOM-1U Datasheet | v1.8 (PDF created 2026-03-02) | https://www.espressif.com/sites/default/files/documentation/esp32-s3-wroom-1_wroom-1u_datasheet_en.pdf |
| ASC | Recommended land pattern (PADS ASCII) linked from DS §7 | HTTP Last-Modified 2023-07-26 | https://www.espressif.com/sites/default/files/chips-dxf/ESP32-S3_Footprint.asc |
| ET-SRC | esptool `esptool/targets/esp32s3.py` (master) | commit 589c349, 2026-10-02 | https://github.com/espressif/esptool/blob/master/esptool/targets/esp32s3.py |
| ET-VDD | esptool docs "Set Flash Voltage" (ESP32-S3) | latest (© 2016-2026) | https://docs.espressif.com/projects/esptool/en/latest/esp32s3/espefuse/set-flash-voltage-cmd.html |
| ET-BOOT | esptool docs "Boot Mode Selection" (ESP32-S3) | latest | https://docs.espressif.com/projects/esptool/en/latest/esp32s3/advanced-topics/boot-mode-selection.html |
| IDF-EF | esp-idf `components/efuse/esp32s3/esp_efuse_table.csv` (master) | commit 70b6520, 2024-11-04 | https://github.com/espressif/esp-idf/blob/master/components/efuse/esp32s3/esp_efuse_table.csv |
| IDF-SIG | esp-idf `components/soc/esp32s3/include/soc/gpio_sig_map.h`, `usb_pins.h` | commit da18980, 2025-11-28 | https://github.com/espressif/esp-idf/tree/master/components/soc/esp32s3/include/soc |
| IDF-REG | esp-idf `components/soc/esp32s3/register/soc/rtc_cntl_reg.h`, `usb_serial_jtag_reg.h` | master, fetched 2026-11-09 | https://github.com/espressif/esp-idf/tree/master/components/soc/esp32s3/register/soc |
| IDF-PHY | esp-idf `components/esp_hw_support/include/esp_private/usb_phy.h`; `components/esp_hw_support/usb_phy/usb_phy.c` | usb_phy.h commit 6020aec, 2026-06-10 | https://github.com/espressif/esp-idf/blob/master/components/esp_hw_support/include/esp_private/usb_phy.h |
| IDF-LL | esp-idf `components/esp_hal_usb/esp32s3/include/hal/usb_wrap_ll.h` / `usb_serial_jtag_ll.h` | 994d2b4 (2026-09-08) / b1fdb0d (2025-11-21) | https://github.com/espressif/esp-idf/tree/master/components/esp_hal_usb/esp32s3/include/hal |
| IDF-RST | esp-idf `components/esp_system/port/soc/esp32s3/system_internal.c` | commit 651d6a2, 2026-07-06 | https://github.com/espressif/esp-idf/blob/master/components/esp_system/port/soc/esp32s3/system_internal.c |
| IDF-PSR | esp-idf `components/esp_psram/esp32s3/esp_psram_impl_octal.c` (6e3abd1, 2026-09-09); `device/esp_psram_impl_ap_quad.c` (938833c, 2026-09-28); `device/esp_quad_psram_defs_ap.h` (ad4fe4c, 2025-08-21); `device/CMakeLists.txt` | as listed | https://github.com/espressif/esp-idf/tree/master/components/esp_psram |
| IDF-COMPAT | esp-idf `COMPATIBILITY.md` | commit 6eb1691, 2026-01-30 | https://github.com/espressif/esp-idf/blob/master/COMPATIBILITY.md |
| IDF-FP | ESP-IDF docs (latest, ESP32-S3) "SPI Flash and External SPI RAM Configuration" | Last-Modified 2026-11-02 | https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/api-guides/flash_psram_config.html |
| IDF-XRAM | ESP-IDF docs (latest, ESP32-S3) "Support for External RAM" | Last-Modified 2026-11-02 (source rst commit 4d332f7, 2026-08-11) | https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/api-guides/external-ram.html |
| IDF-OTGCON | ESP-IDF docs (latest, ESP32-S3) "USB OTG Console" | fetched 2026-11-09 | https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/api-guides/usb-otg-console.html |
| IDF-USJCON | ESP-IDF docs (latest, ESP32-S3) "USB Serial/JTAG Controller Console" | fetched 2026-11-09 | https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/api-guides/usb-serial-jtag-console.html |
| ESPUSB | ESP-USB Programming Guide (latest, ESP32-S3) "USB Device Stack" | Last-Modified 2026-11-06 | https://docs.espressif.com/projects/esp-usb/en/latest/esp32s3/usb_device.html |
| ARD | arduino-esp32 `cores/esp32/esp32-hal-tinyusb.c` (Espressif GitHub; code, not a spec) | commit cc64824, 2026-09-16 | https://github.com/espressif/arduino-esp32/blob/master/cores/esp32/esp32-hal-tinyusb.c |

---------------------------------------------------------------------------------------------------

## 1. Variants, memory, temperature, revision, lifecycle

### 1.1 DS Table 1-1 "ESP32-S3 Series Comparison" (DS p.13, rendered & checked)
Title page (DS p.1) lists: ESP32-S3, ESP32-S3FN8, ESP32-S3RH2, ESP32-S3R8, ESP32-S3R16V, ESP32-S3FH4R2, "ESP32-S3R8V – End of life (EOL)", "ESP32-S3R2 – End of life (EOL), upgraded to ESP32-S3RH2". All are "QFN56 (7×7 mm) Package".

| Part number | In-package flash | In-package PSRAM | Ambient temp | VDD_SPI voltage | Chip revision |
|---|---|---|---|---|---|
| ESP32-S3 | — | — | –40~105 °C | 3.3 V/1.8 V | v0.1/v0.2 |
| ESP32-S3FN8 | 8 MB (Quad SPI) | — | –40~85 °C | 3.3 V | v0.1/v0.2 |
| ESP32-S3RH2 | — | 2 MB (Quad SPI) | –40~105 °C | 3.3 V | v0.2 |
| ESP32-S3R8 | — | 8 MB (Octal SPI) | –40~65 °C | 3.3 V | v0.1/v0.2 |
| ESP32-S3R16V | — | 16 MB (Octal SPI) | –40~65 °C | 1.8 V | v0.2 |
| ESP32-S3FH4R2 | 4 MB (Quad SPI) | 2 MB (Quad SPI) | –40~85 °C | 3.3 V | v0.1/v0.2 |
| ESP32-S3R8V (EOL) | — | 8 MB (Octal SPI) | –40~65 °C | 1.8 V | v0.1/v0.2 |
| ESP32-S3R2 (EOL) | — | 2 MB (Quad SPI) | –40~85 °C | 3.3 V | v0.1/v0.2 |

Table notes (DS p.13):
- Note 2: "By default, the SPI flash on the chip operates at a maximum clock frequency of 80 MHz and does not support the auto suspend feature."
- Note 3: "Ambient temperature specifies the recommended temperature range of the environment immediately outside an Espressif chip. For chips with Octal SPI PSRAM (ESP32-S3R8, ESP32-S3R8V, and ESP32-S3R16V), if the PSRAM ECC function is enabled, the maximum ambient temperature can be improved to 85 °C, while the usable size of PSRAM will be reduced by 1/16."
- Note 6: "ESP32-S3R2 has been upgraded to ESP32-S3RH2. For more information, see PCN." (link → PCN20251001)
- Nomenclature, DS Fig 1-1 (p.13): suffix "V" = "**1.8 V external SPI flash only**"; "R" = PSRAM, "H" after R = PSRAM high temperature; "F"+"H/N" = flash + flash temperature.
- Supply voltage for all variants: PS `voltageRange` "3.0 ~ 3.6".

### 1.2 Lifecycle — ESP Product Selector live data (PS, fetched 2026-11-09)
Status vocabulary in the selector: 'Mass Production', 'EOL', 'NRND', 'Replaced', 'Sample'.

| mpn | status | operatingTemp | flash | psram | package | other |
|---|---|---|---|---|---|---|
| ESP32-S3 | **Mass Production** | -40 ~ 105 | N/A | N/A | QFN 7×7 | releaseTime 2020/12/30, leadTime "5 weeks", gpio 45 |
| ESP32-S3FN8 | Mass Production | -40 ~ 85 | 8 | N/A | QFN 7×7 | |
| ESP32-S3RH2 | Mass Production | -40 ~ 105 | N/A | 2 | QFN 7×7 | |
| ESP32-S3R8 | Mass Production | -40 ~ 65 | N/A | 8 | QFN 7×7 | |
| ESP32-S3R16V | **Mass Production** | -40 ~ 65 | N/A | 16 | QFN 7×7 | leadTime "6 weeks" |
| ESP32-S3FH4R2 | Mass Production | -40 ~ 85 | 4 | 2 | QFN 7×7 | |
| ESP32-S3R8V | **EOL** | -40 ~ 65 | N/A | 8 | QFN 7×7 | |
| ESP32-S3R2 | **EOL** | -40 ~ 85 | N/A | 2 | QFN 7×7 | |
| ESP32-S3-PICO-1-N8R2 | Mass Production | -40 ~ 85 | 8 | 2 | LGA 7×7 | 39 GPIO, leadTime "12 weeks (Non-Cancellation)" |
| ESP32-S3-PICO-1-N8R8 | Mass Production | -40 ~ 65 | 8 | 8 | LGA 7×7 | 39 GPIO |

No ESP32-S3 SoC is marked NRND in the selector. ⇒ **ESP32-S3R16V: Mass Production (active, not NRND)**; **plain ESP32-S3: Mass Production (active)**.

DS lifecycle history (DS Revision History p.83): v2.0 (2025-04-24) "Updated the status of ESP32-S3R8V to End of Life"; v2.1 (2025-11-28) "Updated the status of ESP32-S3R2 to End of Life and added chip variant ESP32-S3RH2"; v1.8 (2023-11-24) "Added chip variant ESP32-S3R16V".
DS Datasheet Versioning (p.80): NRND/EOL watermark is added to the title page only when *all* variants covered are NRND/EOL (so per-variant status lives in Table 1-1 / selector).

PCNs found for ESP32-S3 (PCNLIST): PCN20251001 (S3R2→S3RH2), PCN20230802 (module shield marking), PCN20221203 (remove BLE antenna-diversity feature from datasheets), PCN20221102 (remove "External power amplifier support" from datasheets), PCN20220802 (WROOM-2 BOM), PCN20220602 (chip revision upgrade). No PCN mentioning ESP32-S3R16V; **no EOL/PCN document for ESP32-S3R8V was found** (its EOL status is from DS v2.0+ and PS only).

PCN-R2 (p.1, p.4): S3R2 → S3RH2; ambient –40~85 → –40~105 °C; "The in-package PSRAM in the products listed in Para 1 now supports a higher ambient temperature"; marking R2XXXXXXXXX → RH2XXXXXXXXX; "This change has no impact on software."

### 1.3 Chip revision
- ERR §1.2 Table 1.1 (p.1): revisions v0.0, v0.1, v0.2 identified by EFUSE_RD_MAC_SPI_SYS_5_REG[25:23] and EFUSE_RD_MAC_SPI_SYS_3_REG[20:18] (v0.1: SYS_3[18]=1; v0.2: SYS_3[19]=1). Marking: "X C XXXXXX" = v0.2 (ERR Table 1.2, p.2).
- PCN-REV Appendix I (p.5): chip revision "V001 → V002"; affected chips "ESP32-S3, ESP32-S3FN8, ESP32-S3R2, ESP32-S3R8, ESP32-S3R8V, ESP32-S3FH4R2"; first shipment after change 2022-11-11.
- ⇒ Current/latest revision = **v0.2** (DS Table 1-1 lists R16V and RH2 as v0.2 only).
- IDF-COMPAT: "### ESP32-S3 / #### v0.1, v0.2 / Supported since ESP-IDF v4.4."
- ET-SRC `get_chip_description`: pkg_version 0 → "ESP32-S3 (QFN56)", 1 → "ESP32-S3-PICO-1 (LGA56)".

### 1.4 ESP32-S3-PICO-1 SiP (PICO v1.2, Table 1-1 p.9)
| Ordering code | In-package flash | In-package PSRAM | Ambient | SPI voltage |
|---|---|---|---|---|
| ESP32-S3-PICO-1-N8R2 | 8 MB (Quad SPI) | 2 MB (Quad SPI) | –40~85 °C | 3.3 V |
| ESP32-S3-PICO-1-N8R8 | 8 MB (Quad SPI) | 8 MB (Octal SPI) | –40~65 °C (85 °C with PSRAM ECC, usable PSRAM –1/16) | 3.3 V |
- Package "LGA56 (7×7 mm)" (PICO Fig 6-1). Integrates "a crystal oscillator, decoupling capacitors, SPI flash/PSRAM, and RF matching links" (PICO p.2); "40 MHz crystal oscillator" (p.4). Both "Mass Production" in PS. Note: max 8 MB flash → does not meet a 16 MB flash requirement.

### 1.5 Other variant-related notes
- DS §5.6.2 (p.67) text mentions "ESP32-S3FH8" and "ESP32-S3FN4R2" — **CONFLICT/typo**: these part numbers do not exist in DS Table 1-1 (actual: FN8, FH4R2).
- DS Features p.4: "GPIOs allocated for in-package memory: 6 GPIOs for either in-package flash or PSRAM; 7 GPIOs when both in-package flash and PSRAM are integrated".

---------------------------------------------------------------------------------------------------

## 2. Plain ESP32-S3 vs ESP32-S3R16V — one PCB?

- **Same land pattern**: DS §7 (p.77): "All ESP32-S3 chip variants have identical land pattern (see Figure 7-1) except ESP32-S3FH4R2 has a bigger EPAD (see Figure 7-2)." ⇒ ESP32-S3 and ESP32-S3R16V share Fig 7-1 footprint; same pinout (DS Table 2-1 applies to the whole series).
- **What the R16V consumes** (DS Table 2-14 p.31; HDG Table 5 lists the same mapping for R8/R8V octal PSRAM):
  - In-package Octal PSRAM uses SPICS1 (pin 28 = GPIO26) as CE#, SPID/SPIQ/SPIWP/SPIHD as DQ0..DQ3, SPICLK, and **GPIO33..GPIO36 = DQ4..DQ7, GPIO37 = DQS/DM**. DS Table 2-14 note: "1 CS0 is for in-package flash", "2 CS1 is for in-package PSRAM". DS p.31: "Notice: Do not use the pins connected to in-package flash/PSRAM for any other purposes."
  - HDG §1.3.1 p.4: "In cases where 1.8 V or 3.3 V, octal, in-package or off-package SPI flash/PSRAM is used, GPIO33 ~ GPIO37 are occupied and cannot be used for other functions."
  - HDG §1.3.4 p.9: "the following chip pins can connect at most one flash and one PSRAM … when there is only PSRAM, the pin occupied by PSRAM can only connect flash".
  - WROOM1 Table 3-1 note b (p.12): "For modules with Octal SPI PSRAM, i.e., modules embedded with ESP32-S3R8 or ESP32-S3R16V, pins IO35, IO36, and IO37 are connected to the Octal SPI PSRAM and are not available for other uses." (module only exposes 35-37).
- **VDD_SPI**: plain ESP32-S3 "3.3 V/1.8 V"; R16V "1.8 V" (DS Table 1-1). Nomenclature "V" = "1.8 V external SPI flash only" ⇒ the external flash used with R16V must be 1.8 V. WROOM1 Table 1-1 note 7 (p.4): "Please note that the VDD_SPI voltage is 1.8 V for ESP32-S3-WROOM-1-N16R16VA and ESP32-S3-WROOM-1U-N16R16VA only." (that module = R16V + 16 MB Quad flash).
- **GPIO47/48 (and GPIO33-37) voltage on R16V**: DS Table 2-1 note 4 (p.18, verbatim, checked on render): "For ESP32-S3R8V and ESP32-S3R16V chip, as the VDD_SPI voltage has been set to 1.8 V, the working voltage for pins SPICLK_N and SPICLK_P (GPIO47 and GPIO48) would also be 1.8 V, which is different from other GPIOs." HDG §1.3.10 p.15: "SPICLK_N, SPICLK_P, and GPIO33 ~ GPIO37 work in the same power domain, so if octal 1.8 V flash/PSRAM is used, then SPICLK_P and SPICLK_N also work in the 1.8 V power domain."
- Power selection for GPIO33-37/47/48: DS Table 2-1 note 3 (p.18): "Pin Providing Power (either VDD3P3_CPU or VDD_SPI) is decided by eFuse bit EFUSE_PIN_POWER_SELECTION … and can be configured via the IO_MUX_PAD_POWER_CTRL bit". TRM Register 6.35 (p.513): "IO_MUX_PAD_POWER_CTRL Select power voltage for GPIO33~37 and GPIO47~48. 1: select VDD_SPI 1.8 V; 0: select VDD3P3_CPU 3.3 V." TRM Reg 5.16 (p.435): "EFUSE_PIN_POWER_SELECTION … while ROM code is executed. 0: VDD3P3_CPU. 1: VDD_SPI."
- Other differences: ambient –40~105 °C (plain) vs –40~65 °C (R16V; 85 °C only with PSRAM ECC). Revision: plain v0.1/v0.2, R16V v0.2.
- EPAD: same 4.0 mm nominal for both (Fig 7-1); FH4R2 differs (D2/E2 5.6/5.7/5.8 mm, DS Fig 7-2 p.78).

---------------------------------------------------------------------------------------------------

## 3. QFN56 pin table (DS Table 2-1 pp.16-17 rendered/checked; GPIO numbers from DS Table 2-4 pp.21-22; USB D± from DS Table 2-8 p.24)

Pin settings: At reset / After reset. IE = input enabled, WPU/WPD = weak pull-up/down, USB_PU = USB pull-up.

| Pin | Name | GPIO | Type | Power domain ("Pin Providing Power") | At reset / after reset | Notes |
|---|---|---|---|---|---|---|
| 1 | LNA_IN | – | Analog | – | – | RF in/out (DS Table 2-10: "Low Noise Amplifier (RF LNA) input/output signals") |
| 2 | VDD3P3 | – | Power | Analog power domain | – | |
| 3 | VDD3P3 | – | Power | Analog power domain | – | |
| 4 | CHIP_PU | – | Analog | VDD3P3_RTC | – | "Do not leave the CHIP_PU pin floating." |
| 5 | GPIO0 | 0 | IO | VDD3P3_RTC | WPU, IE / WPU, IE | **strap** |
| 6 | GPIO1 | 1 | IO | VDD3P3_RTC | IE / IE | ADC1_CH0, TOUCH1 |
| 7 | GPIO2 | 2 | IO | VDD3P3_RTC | IE / IE | |
| 8 | GPIO3 | 3 | IO | VDD3P3_RTC | IE / IE | **strap** (no internal pull) |
| 9–13 | GPIO4–GPIO8 | 4–8 | IO | VDD3P3_RTC | – / – | |
| 14–19 | GPIO9–GPIO14 | 9–14 | IO | VDD3P3_RTC | – / IE | |
| 20 | VDD3P3_RTC | – | Power | "RTC and part of Digital power domains" (RTC IO) | – | |
| 21 | XTAL_32K_P | 15 | IO | VDD3P3_RTC | – / – | 32 kHz xtal; U0RTS |
| 22 | XTAL_32K_N | 16 | IO | VDD3P3_RTC | – / – | 32 kHz xtal; U0CTS |
| 23 | GPIO17 | 17 | IO | VDD3P3_RTC | – / IE | U1TXD |
| 24 | GPIO18 | 18 | IO | VDD3P3_RTC | – / IE | U1RXD |
| 25 | GPIO19 | 19 | IO | VDD3P3_RTC | – / – | **USB_D−** (analog F0; default function set = Analog) |
| 26 | GPIO20 | 20 | IO | VDD3P3_RTC | USB_PU / USB_PU | **USB_D+** (default function set = Analog) |
| 27 | GPIO21 | 21 | IO | VDD3P3_RTC | – / – | |
| 28 | SPICS1 | 26 | IO | VDD_SPI | WPU, IE / WPU, IE | PSRAM CE# |
| 29 | VDD_SPI | – | Power | In: "In-package memory (backup power line)"; Out: "In-package and off-package flash/PSRAM" (SPI IO) | – | |
| 30 | SPIHD | 27 | IO | VDD_SPI | WPU, IE / WPU, IE | |
| 31 | SPIWP | 28 | IO | VDD_SPI | WPU, IE / WPU, IE | |
| 32 | SPICS0 | 29 | IO | VDD_SPI | WPU, IE / WPU, IE | flash CS# |
| 33 | SPICLK | 30 | IO | VDD_SPI | WPU, IE / WPU, IE | |
| 34 | SPIQ | 31 | IO | VDD_SPI | WPU, IE / WPU, IE | |
| 35 | SPID | 32 | IO | VDD_SPI | WPU, IE / WPU, IE | |
| 36 | SPICLK_N | 48 | IO | VDD_SPI/VDD3P3_CPU | IE / IE | |
| 37 | SPICLK_P | 47 | IO | VDD_SPI/VDD3P3_CPU | IE / IE | |
| 38–42 | GPIO33–GPIO37 | 33–37 | IO | VDD_SPI/VDD3P3_CPU | – / IE | octal DQ4–DQ7, DQS |
| 43 | GPIO38 | 38 | IO | VDD3P3_CPU | – / IE | |
| 44 | MTCK | 39 | IO | VDD3P3_CPU | – / IE (note 7: WPU if EFUSE_DIS_PAD_JTAG=0, floating if 1) | |
| 45 | MTDO | 40 | IO | VDD3P3_CPU | – / IE | |
| 46 | VDD3P3_CPU | – | Power | Digital power domain (Digital IO) | – | |
| 47 | MTDI | 41 | IO | VDD3P3_CPU | – / IE | |
| 48 | MTMS | 42 | IO | VDD3P3_CPU | – / IE | |
| 49 | U0TXD | 43 | IO | VDD3P3_CPU | WPU, IE / WPU, IE | UART0 TX |
| 50 | U0RXD | 44 | IO | VDD3P3_CPU | WPU, IE / WPU, IE | UART0 RX |
| 51 | GPIO45 | 45 | IO | VDD3P3_CPU | WPD, IE / WPD, IE | **strap** (VDD_SPI) |
| 52 | GPIO46 | 46 | IO | VDD3P3_CPU | WPD, IE / WPD, IE | **strap** |
| 53 | XTAL_N | – | Analog | – | – | main crystal |
| 54 | XTAL_P | – | Analog | – | – | main crystal |
| 55 | VDDA | – | Power | Analog power domain | – | |
| 56 | VDDA | – | Power | Analog power domain | – | |
| 57 | GND (EPAD) | – | Power | "External ground connection" | – | |

- USB D−/D+: DS Table 2-8 (p.24): "25 RTC_GPIO19 USB_D- ADC2_CH8", "26 RTC_GPIO20 USB_D+ ADC2_CH9". TRM Fig 33.3-1 (p.1246, rendered): "D- ↔ GPIO19, D+ ↔ GPIO20". ESPUSB: "routes the USB 1.1 peripheral D+ and D- signals to GPIOs 20 and 19 respectively". IDF-SIG usb_pins.h: `USBPHY_DP_NUM 20`, `USBPHY_DM_NUM 19`.
- XTAL pin order history: DS Revision v0.6 (2021-09-30): "Updated to chip revision 1 by swapping pin 53 and pin 54 (XTAL_P and XTAL_N)". Current: 53 = XTAL_N, 54 = XTAL_P.
- Default drive strengths (DS note 5 p.18): GPIO17/18 10 mA; GPIO19/20 40 mA; all others 20 mA.
- USB pins as GPIO (DS §2.3.4 p.25): "USB_D+/- – by default, connected to the USB Serial/JTAG Controller. To function as GPIOs, these pins need to be reconfigured via the IO_MUX_MCU_SEL bit". DS note 6 (p.18): when USB function disabled, "the pin's internal weak pull-up and pull-down resistors are disabled by default".
- Power-up glitches (DS Table 2-2 pp.18-19): GPIO1–14, XTAL_32K_P/N, GPIO17 low-level glitch 60 µs; GPIO18 low+high; GPIO19 low + high; GPIO20 pull-down + high. "GPIO19 and GPIO20 pins both have two high-level glitches during chip power-up, each lasting for about 60 µs. The total duration for the glitches and the delay are 3.2 ms and 2 ms respectively for GPIO19 and GPIO20." HDG p.19: "upon power-up, the USB_D+ signal will fluctuate between high and low states."
- **CONFLICT (DS internal)**: DS Table 2-4 (p.22): pin 36 GPIO48 F0 = SPICLK_N_DIFF, pin 37 GPIO47 F0 = SPICLK_P_DIFF. DS Table 7-1 Consolidated Pin Overview (p.79, rendered): row "SPICLK_N" (pin 36) shows F0 "SPICLK_P_DIFF", F1 GPIO48; row "SPICLK_P" (pin 37) shows F0 "SPICLK_N_DIFF", F1 GPIO47. PICO datasheet agrees with Table 2-4. (Irrelevant unless the differential SPI clock is used.)

---------------------------------------------------------------------------------------------------

## 4. Strapping pins GPIO0 / GPIO3 / GPIO45 / GPIO46

- Functions (DS §3 p.32): Chip boot mode – GPIO0 and GPIO46; VDD_SPI voltage – GPIO45 (+ EFUSE_VDD_SPI_FORCE, EFUSE_VDD_SPI_TIEH); ROM message printing – GPIO46 (+ EFUSE_UART_PRINT_CONTROL, EFUSE_DIS_USB_SERIAL_JTAG_ROM_PRINT); JTAG signal source – GPIO3 (+ EFUSE_DIS_PAD_JTAG, EFUSE_DIS_USB_JTAG, EFUSE_STRAP_JTAG_SEL). "The default values of all the above eFuse parameters are 0".
- Defaults (DS Table 3-1 p.32; TRM Table 8.1-1 p.534): GPIO0 weak pull-up → 1; GPIO3 floating → "–"; GPIO45 weak pull-down → 0; GPIO46 weak pull-down → 0.
- GPIO3 (DS §3.4 p.34): "This pin does not have any internal pull resistors and the strapping value must be controlled by the external circuit that cannot be in a high impedance state." But per DS Table 3-5/TRM Table 8.5-1 (p.538), GPIO3 is **Ignored** unless EFUSE_STRAP_JTAG_SEL=1 (default 0) — with default eFuses JTAG source = USB Serial/JTAG regardless of GPIO3.
- Latching (DS p.32): "All strapping pins have latches. At Chip Reset, the latches sample the bit values of their respective strapping pins and store them until the chip is powered down or shut down." TRM §8.1 (p.534): "During Chip Reset … hardware captures samples … Software can read the latch status (strapping value) from the register GPIO_STRAPPING." TRM v1.7 revision note: "Updated the latching condition for strapping pins".
- GPIO_STRAP_REG (TRM Reg 6.15, offset 0x0038 of GPIO base 0x6000_4000 → 0x6000_4038; ET-SRC `GPIO_STRAP_REG = 0x60004038`): "bit2: GPIO46, bit3: GPIO0, bit4: GPIO45, bit5: GPIO3".
- Boot modes (TRM Table 8.2-1 p.535):
  | Boot mode | GPIO0 | GPIO46 | GPIO1 | GPIO2 |
  |---|---|---|---|---|
  | SPI Boot | 1 | Ignored | Ignored | Ignored |
  | Joint Download Boot | 0 | 0 | Ignored | Ignored |
  | SPI Download Boot | 0 | 1 | 1 | 0 |
  DS Table 3-3 (p.33) lists only SPI Boot (GPIO0=1, GPIO46 "Any value") and Joint Download (0,0) and says SPI Download Boot also exists. TRM p.535 Note: "Only documented patterns should be used. If some pattern is not documented, it may trigger unexpected behavior." ⇒ GPIO0=0 with GPIO46=1 is only valid with GPIO1=1/GPIO2=0 (SPI Download Boot); other GPIO0=0/GPIO46=1 combinations are undocumented. ET-BOOT: "GPIO46 must also be either left unconnected/floating, or driven Low, in order to enter the serial bootloader. In normal boot mode (GPIO0 high), GPIO46 is ignored."
- Timing (DS Table 3-2 p.33; HDG Table 8 p.15): tSU min **0 ms** ("time reserved for the power rails to stabilize before the CHIP_PU pin is pulled high"); tH min **3 ms** ("time reserved for the chip to read the strapping pin values after CHIP_PU is already high and before these pins start operating as regular IO pins").
- HDG p.15 Attention: "It is recommended to place a pull-up resistor at the GPIO0 pin." "Do not add high-value capacitors at GPIO0, or the chip may enter download mode."
- ROM printing to UART0 vs GPIO46: EFUSE_UART_PRINT_CONTROL (TRM Reg 5.16): "00: Enabled. 01: Enabled when GPIO46 is low at reset. 10: Enabled when GPIO46 is high at reset. 11: Disabled." Temporary disable via RTC_CNTL_RTC_STORE4_REG[0] (TRM Table 8.3-1 p.536).
- Internal pull strength: RPU/RPD typ 45 kΩ (DS Table 5-4) — no min/max given. ET-BOOT: "The ESP32-S3 has a 45k ohm internal pull-up/pull-down resistor at GPIO0 (and other pins)."

---------------------------------------------------------------------------------------------------

## 5. VDD_SPI voltage selection

- DS §3.2 + Table 3-4 (p.34, rendered): "(Default) 3.3 V supplied by VDD3P3_RTC via RSPI"; "1.8V supplied by the Flash Voltage Regulator"; "The voltage is determined by EFUSE_VDD_SPI_FORCE, GPIO45, and EFUSE_VDD_SPI_TIEH."
  | Source | Voltage | EFUSE_VDD_SPI_FORCE | GPIO45 | EFUSE_VDD_SPI_TIEH |
  |---|---|---|---|---|
  | VDD3P3_RTC via RSPI | 3.3 V | 0 (default) | 0 (default) | Ignored |
  | VDD3P3_RTC via RSPI | 3.3 V | 1 | Ignored | 1 |
  | Flash Voltage Regulator | 1.8 V | 0 | 1 | Ignored |
  | Flash Voltage Regulator | 1.8 V | 1 | Ignored | 0 |
  Same table in HDG Table 1 (p.7) and PICO Table 2-5, WROOM1 Table 4-4.
- TRM §8.4 (p.537): "GPIO45 = 0, VDD_SPI pin is powered directly from VDD3P3_RTC via resistor RSPI … GPIO45 = 1, VDD_SPI pin is powered from internal 1.8 V LDO. This functionality can be overridden by setting eFuse bit EFUSE_VDD_SPI_FORCE to 1, in which case the EFUSE_VDD_SPI_TIEH determines the VDD_SPI voltage: EFUSE_VDD_SPI_TIEH = 0, VDD_SPI connects to 1.8 V LDO. EFUSE_VDD_SPI_TIEH = 1, VDD_SPI connects to VDD3P3_RTC."
- Exact eFuse names (TRM Table 5.3-1 p.411; Reg 5.14 p.433): **EFUSE_VDD_SPI_XPD** ("whether Flash Voltage Regulator is powered up. 1: Powered up"), **EFUSE_VDD_SPI_TIEH** ("1: Short connected to VDD3P3_RTC_IO. 0: connect to 1.8 V Flash Voltage Regulator"), **EFUSE_VDD_SPI_FORCE** ("whether or not to force using the parameters in eFuse, including EFUSE_VDD_SPI_XPD and EFUSE_VDD_SPI_TIEH"). IDF-EF bits: VDD_SPI_XPD BLK0 bit 68, VDD_SPI_TIEH 69, VDD_SPI_FORCE 70. ET-SRC: `EFUSE_VDD_SPI_REG = EFUSE_BASE + 0x34; VDD_SPI_XPD = 1 << 4; VDD_SPI_TIEH = 1 << 5; VDD_SPI_FORCE = 1 << 6`.
- **Note**: DS Table 3-4 omits XPD. TRM §10.3.4.3 (p.574): "When the chip is in active mode, RTC_CNTL_SDIO_FORCE == 0 and EFUSE_VDD_SPI_FORCE == 1, the XPD_SDIO_REG voltage is defined by EFUSE_VDD_SPI_XPD"; XPD "0: the voltage regulator outputs high-impedance. In this case, the voltage is provided by the external power supply." ET-VDD: "Fixed 1.8V … Efuses VDD_SPI_FORCE and VDD_SPI_XPD are burned"; "Fixed 3.3V … VDD_SPI_FORCE, VDD_SPI_XPD, VDD_SPI_TIEH are burned"; "OFF … eFuse VDD_SPI_FORCE is burned … Flash must be powered externally". ET-VDD: "This is an irreversible operation!"; "Once an eFuse is burned it cannot be un-burned." Allowed later transitions: OFF→1.8 V/3.3 V and 1.8 V→3.3 V (one-way).
- Runtime override registers: RTC_CNTL_RTC_SDIO_CONF_REG (0x007C): RTC_CNTL_SDIO_FORCE, RTC_CNTL_SDIO_TIEH, RTC_CNTL_XPD_SDIO_REG, RTC_CNTL_SDIO_REG_PD_EN (TRM Reg 10.27 p.609).
- **Factory eFuse on 1.8 V parts (R8V/R16V)**:
  - DS note 4 (p.18): "For ESP32-S3R8V and ESP32-S3R16V chip, as the VDD_SPI voltage has been set to 1.8 V …" (states it *has been set*, does not name the mechanism for the bare chip).
  - PCN-W2 §2 (p.1): "The VDD_SPI voltage of the ESP32-S3R8V chip on the ESP32-S3-WROOM-2 has been set to 1.8 V by eFuse VDD_SPI_TIEH and VDD_SPI_FORCE, and is no longer controlled by GPIO45. Therefore the external pull up resistor R1 on the module is changed to be not mounted." §8: "The default output of IO45 will be changed from 1 to 0."
  - WROOM1 §8 (p.39): "For modules with PSRAM, the VDD_SPI voltage is fixed to 3.3 V or 1.8 V via eFuse, so their VDD_SPI voltage will not be affected by the GPIO45 level. However, for other modules, please ensure that GPIO45 is not pulled high when the module is powered up by the external circuit."
  - HDG §1.3.1 (p.4): "If an in-package SPI flash/PSRAM is used and VDD_SPI is configured to 1.8 V or 3.3 V via the VDD_SPI_FORCE eFuse, the GPIO45 strapping pin no longer affects the VDD_SPI voltage. In these cases, the presence of R1 is optional. For all other cases, refer to … Table VDD_SPI Voltage Control to determine whether R1 should be populated or not."
  - IDF-FP (Error Handling): FLASH_TYPE eFuse — "Espressif guarantees this bit is burnt during module manufacturing, but if the module is manufactured by others, this may happen." (illustrates that some eFuses are burned at *module* manufacturing).
  - ⇒ **UNVERIFIED** whether a *bare* ESP32-S3R16V reel part ships with VDD_SPI_FORCE/XPD burned (TIEH=0). Verify with `espefuse summary` on first samples (fields VDD_SPI_FORCE / VDD_SPI_XPD / VDD_SPI_TIEH, PSRAM_VENDOR).
- Damage warning: IDF-XRAM "Hardware" note: "Some PSRAM chips are 1.8 V devices and some are 3.3 V. The working voltage of the PSRAM chip must match the working voltage of the flash component. … For a 1.8 V PSRAM chip, make sure to either set the GPIO45 strapping pin to a high signal level on boot-up, or program ESP32-S3 eFuses to always use the VDD_SPI level of 1.8 V. **Not doing this can damage the PSRAM and/or flash chip.**" DS Table 5-12 PSRAM VCC (1.8 V parts): 1.62 / 1.80 / 1.98 V (min/typ/max). Abs-max of the in-package PSRAM: not published (**UNVERIFIED**).
- RSPI / LDO (DS Table 5-3 p.65): RSPI typ **14 Ω** ("VDD_SPI powered by VDD3P3_RTC via RSPI for 3.3 V flash/PSRAM"); ISPI typ **40 mA** ("Output current when VDD_SPI is powered by Flash Voltage Regulator for 1.8 V flash/PSRAM"). Note 2: "VDD3P3_RTC must be more than VDD_flash_min + I_flash_max * RSPI". HDG p.7: "When VDD_SPI operates at 1.8 V, it is powered by ESP32-S3's internal LDO. The typical current this LDO can offer is 40 mA. When VDD_SPI operates at 3.3 V, it is driven directly by VDD3P3_RTC through a 14 Ω resistor". DS Table 2-12: Flash regulator output 1.8 V.
- VDD_SPI as input (DS Table 5-2 p.64): min 1.8, typ 3.3, max 3.6 V. HDG p.7: "VDD_SPI can also be driven by an external power supply." DS Table 2-11 (p.29, rendered): pin 29 VDD_SPI Input = "In-package memory (backup power line)", Output = "In-package and off-package flash/PSRAM".
- Decoupling (HDG §1.3.2 p.7): "It is recommended to add extra 0.1 μF and 1 μF decoupling capacitors close to VDD_SPI. Please do not add excessively large capacitors." HDG Attention: "please ensure that VDD3P3_RTC remains above 3.0 V to meet the operating voltage requirements of the flash/PSRAM" (3.3 V mode); "VDD3P3_RTC cannot supply power alone; all power supplies must be powered on at the same time."
- IDF example espefuse summary for a generic ESP32-S3 (docs/en/api-reference/system/inc/espefuse_summary_ESP32-S3.rst): "Flash voltage (VDD_SPI) determined by GPIO45 on reset (GPIO45=High: VDD_SPI pin is powered from internal 1.8V LDO / GPIO45=Low or NC: VDD_SPI pin is powered directly from VDD3P3_RTC_IO via resistor Rspi."
- **CONFLICT (naming)**: ET-VDD page for ESP32-S3 refers to the strap as "MTDI" ("MTDI pin (GPIO45) is ignored"); on ESP32-S3 MTDI is GPIO41 (pin 47); the VDD_SPI strap is GPIO45 (DS/TRM).

---------------------------------------------------------------------------------------------------

## 6. External memory

- Pin mapping (DS Table 2-14 p.31): Single/Dual/Quad: SPICS0 (pin 32) = flash CS#; SPICS1 (pin 28, GPIO26) = PSRAM CE#; SPICLK (33) CLK; SPID (35) DI/SIO0; SPIQ (34) DO/SIO1; SPIWP (31) WP#/SIO2; SPIHD (30) HOLD#/SIO3. Octal adds GPIO33..36 (pins 38..41) = DQ4..DQ7 and GPIO37 (pin 42) = DQS/DM. Notes: "CS0 is for in-package flash", "CS1 is for in-package PSRAM"; "For off-package flash/PSRAM, these are the recommended pin mappings."
- IDF-PSR: octal and quad drivers use `MSPI_IOMUX_PIN_NUM_CS1` for PSRAM CS ("OCT_PSRAM_CS1_IO", "PSRAM_QUAD_CS_IO").
- SPI0/1 (DS §4.2.1.5 p.53): "Supports Single SPI, Dual SPI, Quad SPI, Octal SPI, QPI, and OPI modes"; "8-line SPI mode supports single data rate (SDR) and double data rate (DDR)"; "maximum of 120 MHz for 8-line SPI SDR/DDR modes".
- Max sizes / address space: TRM §4.2 (p.400): "Supports up to 1 GB external flash; Supports up to 1 GB external RAM"; "32 MB of external memory virtual address space accessed from the instruction bus; 32 MB external memory virtual address space accessed from the data bus". TRM Table 4.3-2 (p.405): DCache 0x3C00_0000–0x3DFF_FFFF (32 MB, data bus); ICache 0x4200_0000–0x43FF_FFFF (32 MB, instruction bus); mapped in 64 KB blocks (TRM §4.3.3.1 p.404). DS §4.1.2.2 (p.39): "ESP32-S3 supports up to 1 GB of external flash and RAM" (combined wording — minor wording difference vs TRM).
- IDF-XRAM: "ESP32-S3 has the ability to use up to 32 MB of virtual addresses for external PSRAM … The 32 MB virtual addresses are shared with flash instructions and rodata."
- Supported combinations (IDF-FP): hardware tables given only for **F8R8** (Octal flash + Octal PSRAM), **F4R8** (Quad flash + Octal PSRAM), **F4R4** (Quad flash + Quad PSRAM). "Quad PSRAM only supports STR mode, while Octal PSRAM only supports DTR mode." "Flash and PSRAM share the same internal clock." (No F8R4 table — not documented as supported; inference only.) HDG p.9: at most one flash + one PSRAM on these pins. IDF-XRAM: "The working voltage of the PSRAM chip must match the working voltage of the flash component."
- PSRAM sizes in ESP-IDF drivers (IDF-PSR):
  - Octal (ESP32-S3, `esp_psram_impl_octal.c`): density 0x1→4 MB, 0x3→8 MB, 0x5→16 MB, 0x7→32 MB, 0x6→64 MB; vendor IDs accepted AP (0x0D) and UnilC (0x1A) (else "fallback to use default driver pattern"); with ECC available size = 15/16.
  - Quad (`device/esp_psram_impl_ap_quad.c`, built for ESP32-S3 per device/CMakeLists.txt): EID size 16/32/64 Mbit → 2/4/8 MB; 16 MB and 32 MB only for QEMU fake IDs ("QEMU has a simulated 16MB and 32MB Quad SPI PSRAM"). ⇒ (inference) a real 16 MB PSRAM on ESP32-S3 under ESP-IDF requires **Octal** PSRAM.
- Discrete vs in-package PSRAM:
  - HDG §1.3.1 Fig 2 "ESP32-S3 Schematic for Off-Package 1.8 V Octal Flash/PSRAM" and the GPIO33-37 note above ⇒ hardware supports off-package octal flash/PSRAM.
  - IDF-XRAM: "ESP32-S3 supports PSRAM connected in parallel with the SPI flash chip. While ESP32-S3 is capable of supporting several types of RAM chips, **ESP-IDF currently only supports Espressif branded PSRAM chips (e.g., ESP-PSRAM32, ESP-PSRAM64, etc).**" and "If you are using a custom PSRAM chip, ESP-IDF SDK might not be compatible with it."
  - HDG p.10: "To reduce the risk of software compatibility issues, it is recommended to use flash and PSRAM models officially validated by Espressif." Also recommends zero-ohm series footprints on SPI lines.
- Octal-flash eFuse: FLASH_TYPE (TRM Reg 5.16: "0: four lines. 1: eight lines"); IDF-FP: ROM "relies on an eFuse bit FLASH_TYPE to reset the flash into the default mode (SPI mode)".
- IDF-FP: 120 MHz DDR is "an experimental feature"; risk: after temperature change >~20 °C accesses "will crash randomly".
- DS Table 5-11/5-12 (in-package memory, from vendor datasheets): flash VCC 1.65–2.00 V (1.8 V) / 2.7–3.6 V (3.3 V); FC 80 MHz; 100,000 P/E cycles; 20-year retention. PSRAM VCC 1.62–1.98 V / 2.7–3.6 V; FC 80 MHz.
- In-package capability eFuses (IDF-EF; ET-SRC): FLASH_CAP {1: 8M, 2: 4M}; PSRAM_CAP {1: 8M, 2: 2M, 3: 16M, 4: 4M}; PSRAM_VENDOR {1: AP_3v3, 2: AP_1v8}; FLASH_VENDOR {1 XMC, 2 GD, 3 FM, 4 TT, 5 BY}; PSRAM_TEMP / FLASH_TEMP {1: 105C, 2: 85C}.

---------------------------------------------------------------------------------------------------

## 7. USB (OTG FS + USB Serial/JTAG, shared PHY)

### 7.1 Controllers
- USB OTG (DS §4.2.1.7 p.55; TRM §32.1-32.2 p.1227): full-speed OTG with integrated transceiver; FS 12 Mbit/s & LS 1.5 Mbit/s; device mode: EP0 + 6 endpoints configurable IN/OUT, "Maximum of five IN endpoints concurrently active at any time (including EP0 IN)"; host: 8 channels. "Can choose integrated transceiver or external transceiver"; "Utilizing integrated transceiver with USB Serial/JTAG by time-division multiplexing when only integrated transceiver is used"; "Support USB OTG using one of the transceivers while USB Serial/JTAG using the other one when both integrated transceiver or external transceiver are used". TRM §32.5 (p.1242): OTG register specs "are subject to a Non-Disclosure Agreement (NDA)".
- USB Serial/JTAG (DS §4.2.1.8 p.56; TRM §33.2 p.1243): FS device; "Can be configured to either use internal USB PHY of ESP32-S3 or external PHY via GPIO matrix"; "Fixed function device, hardwired for CDC-ACM … and JTAG adapter functionality"; "2 OUT Endpoints, 3 IN Endpoints"; "CDC-ACM supports host controllable chip reset and entry into download mode". IDF-USJCON: "a fixed-function USB device that is implemented entirely in hardware, meaning that it cannot be reconfigured to perform any function other than a serial port and JTAG debugging functionality." TRM p.1253: "an APB_CLK of 40 MHz or more is required for proper USB compliant operation".
- ESPUSB: "both controllers share a single PHY, which means only one can operate at a time. To use USB Device functionality while the USB-Serial-JTAG is active … an external PHY is required". Tested external PHY: "TUSB1106 — Directly supported by ESP32-S3."

### 7.2 PHY routing / selection (TRM §33.3.1 pp.1244-1246, Fig 33.3-1 rendered; §33.4.1 p.1252)
- "The ESP32-S3 has an internal PHY, which is shared between the USB-OTG and the USB Serial/JTAG hardware. Either one of these can use the internal PHY. Optionally, the signals from the unit not using the internal PHY can be routed out via the GPIO matrix to IO pads. Adding an external USB PHY to these pads results in a second usable USB port."
- Fig 33.3-1: phy_sel = mux(efuse_usb_phy_sel [0], RTC_CNTL_SW_USB_PHY_SEL_REG [1]) selected by RTC_CNTL_SW_HW_USB_PHY_SEL_REG. phy_sel=0: internal PHY ↔ USB Serial/JTAG, GPIO-matrix (external PHY) ↔ OTG; phy_sel=1: internal PHY ↔ OTG, external ↔ Serial/JTAG. Per-controller muxes USB_WRAP_PHY_SEL (OTG) and USB_SERIAL_JTAG_PHY_SEL (USJ). External PHY pads in figure: "VP ↔ MTMS, VM ↔ MTDI, OEN ↔ MTDO, VPO ↔ MTCK, VMO ↔ GPIO38".
- Default: TRM p.1252: "by default (phy_sel = 0), ESP32-S3 USB Serial/JTAG Controller is connected to internal PHY and USB-OTG is connected to external PHY." TRM §32.3.1 p.1229: "In default, internal transceiver is connected to USB Serial/JTAG."
- TRM Table 33.4-1 (p.1252) use cases: USB serial/JTAG on internal PHY only → no eFuse; USB OTG on internal PHY only → EFUSE_USB_PHY_SEL + EFUSE_DIS_USB_JTAG ("JTAG on GPIO pins"); **"USB serial/JTAG on internal PHY, OTG on external PHY → None"**; USB OTG on internal PHY, USB serial/JTAG on external → EFUSE_USB_PHY_SEL. "Note that this is mostly relevant for the configuration in download mode and the bootloader as the configuration can be altered at runtime as soon as user code is running." ⇒ **Yes, USJ on internal PHY + OTG on external PHY simultaneously is a documented configuration (default routing).**
- Runtime override (TRM p.1252): "RTC_CNTL_SW_HW_USB_PHY_SEL can be used to have software override the effect of EFUSE_USB_PHY_SEL: if this bit is set, the USB PHY selection logic will use the value of the RTC_CNTL_SW_USB_PHY_SEL bit in place of that of EFUSE_USB_PHY_SEL."
- Register RTC_CNTL_RTC_USB_CONF_REG, offset 0x0120 (TRM Reg 10.56 pp.626-627, rendered; RTC_CNTL base 0x6000_8000 per TRM Table 4.3-3 ⇒ 0x6000_8120). Bits (all reset 0): [20] RTC_CNTL_SW_HW_USB_PHY_SEL ("Set this bit to control the internal USB transceiver selection via software (RTC_CNTL_SW_USB_PHY_SEL). Clear this bit to control … via hardware (eFuse)"); [19] RTC_CNTL_SW_USB_PHY_SEL ("Set this bit to allow USB OTG to use the internal USB transceiver. Clear this bit to allow USB-Serial-JTAG to use the internal USB transceiver."); [18] RTC_CNTL_IO_MUX_RESET_DISABLE; [17] RTC_CNTL_USB_RESET_DISABLE ("Set this bit to disable reset USB OTG"); [16] TX_EN_OVERRIDE; [15] TX_EN; [14] TXP; [13] TXM; [12] USB_PAD_ENABLE; [11] USB_PAD_ENABLE_OVERRIDE; [10] USB_PULLUP_VALUE; [9] DM_PULLDOWN; [8] DM_PULLUP; [7] DP_PULLDOWN; [6] DP_PULLUP; [5] USB_PAD_PULL_OVERRIDE; [4] VREF_OVERRIDE; [3:2] VREFL; [1:0] VREFH. IDF-REG confirms `RTC_CNTL_USB_CONF_REG (DR_REG_RTCCNTL_BASE + 0x120)`, `RTC_CNTL_SW_HW_USB_PHY_SEL_S 20`, `RTC_CNTL_SW_USB_PHY_SEL_S 19`.
- IDF-LL (`usb_wrap_ll_phy_enable_external`, `usb_serial_jtag_ll_phy_enable_external`): sets `RTCCNTL.usb_conf.sw_hw_usb_phy_sel = 1` and comment "For 'sw_usb_phy_sel': 0 - Internal USB FSLS PHY is mapped to the USJ. USB Wrap mapped to external PHY / 1 - Internal USB FSLS PHY is mapped to the USB Wrap. USJ mapped to external PHY".
- EFUSE_USB_PHY_SEL (TRM Reg 5.15 p.434): "0: internal PHY is assigned to USB Serial/JTAG while external PHY is assigned to USB OTG. 1: internal PHY is assigned to USB OTG while external PHY is assigned to USB Serial/JTAG." IDF-EF: USB_PHY_SEL BLK0 bit 121. IDF-OTGCON: "You can permanently switch the internal USB PHY to work with USB OTG peripheral instead of USB_SERIAL_JTAG by burning USB_PHY_SEL eFuse."
- **What resets the RTC_CNTL PHY-select bits?** TRM §7.1.3 (pp.526-527): "CPU Reset: only resets CPUx core"; "Core Reset: resets the whole digital system except RTC"; "System Reset: resets the whole digital system, including RTC"; "Chip Reset: resets the whole chip". TRM Table 7.1-1 (p.528): Chip reset (0x01, power-on/brown-out/SWD per footnote); System Reset: RWDT system reset 0x10, Super Watchdog 0x12, GLITCH 0x13, brown-out (0x0F, chip or system per config); Core Reset: "Software system reset … Triggered by configuring RTC_CNTL_SW_SYS_RST" 0x03, Deep-sleep reset 0x05, MWDT0/1 core 0x07/0x08, RWDT core 0x09, eFuse 0x14, USB (UART) 0x15, USB (JTAG) 0x16; CPU Reset: MWDT0 CPU 0x0B, "Software CPUx reset … RTC_CNTL_SW_PROCPU/APPCPU_RST" 0x0C, RWDT CPU 0x0D, MWDT1 CPU 0x11. ⇒ **Inference (not stated per-register; UNVERIFIED)**: RTC_CNTL_RTC_USB_CONF_REG (RTC domain) survives CPU and Core resets (incl. RTC_CNTL_SW_SYS_RST, USB-CDC/JTAG-triggered resets, MWDT, deep-sleep wake) and is cleared only by System Reset or Chip Reset.
  - Supporting code: IDF-RST `esp_restart_noos()` restarts via `esp_rom_software_reset_cpu(…)` (CPU reset) and does not touch RTC_CNTL USB conf. ARD (before restarting into the bootloader) explicitly executes `CLEAR_PERI_REG_MASK(RTC_CNTL_USB_CONF_REG, (RTC_CNTL_SW_HW_USB_PHY_SEL | RTC_CNTL_SW_USB_PHY_SEL | RTC_CNTL_USB_PAD_ENABLE));` ("Switch to hardware CDC+JTAG") and comments "After USB download the ROM leaves DWC2/PHY in persist or USJ state … nothing enumerates until a pad/EN reset."
- External PHY signals: TRM Table 33.4-2 (p.1253) ROM OTG-download pads: "VP (MTMS) INPUT; VM (MTDI) INPUT; RCV (GPIO21) INPUT; OEN (MTDO) OUTPUT HIGH; VPO (MTCK) OUTPUT LOW; VMO (GPIO38) OUTPUT LOW". "If the USB-OTG Download mode is not needed, it is suggested to disable the USB-OTG Download mode by setting the eFuse bit EFUSE_DIS_USB_OTG_DOWNLOAD_MODE to avoid IO pad state change." (Same in HDG Table 12 p.19.) IDF-SIG gpio_sig_map.h: `USB_EXTPHY_VP_IDX 55`, `USB_EXTPHY_OEN_IDX 55`, `USB_EXTPHY_VM_IDX 56`, `USB_EXTPHY_SPEED_IDX 56`, `USB_EXTPHY_RCV_IDX 57`, `USB_EXTPHY_VPO_IDX 57`, `USB_EXTPHY_VMO_IDX 58`, `USB_EXTPHY_SUSPND_IDX 59` ⇒ GPIO-matrix signals (any GPIO at runtime). IDF-PHY `usb_phy_ext_io_conf_t`: vp/vm/rcv/suspend_n/oen/vpo/vmo/fs_edge_sel "GPIO pin to USB_EXTPHY_*_IDX". ESPUSB: "Hardware configuration is handled via GPIO mapping to the PHY's pins."
  - **CONFLICT**: DS Table 2-9 note 1 (p.27): "use other fixed pins when on external PHY" (table lists GPIO21, GPIO38, MTCK, MTDO, MTDI, MTMS) vs DS §4.2.1.8 / TRM Fig 33.3-1 / IDF ("via GPIO matrix"). TRM GPIO-matrix signal table (p.485) shows signals 55–57 blank and no external-PHY outputs at 58/59 — the external-PHY signals appear only in IDF headers. Interpretation: fixed pins are what the ROM uses; at runtime any GPIO via the matrix.
- UTMI OTG signals for VBUS/ID (TRM Table 32.4-1 pp.1237-1238): usb_otg_avalid_in (Vbus <0.8 V / >2 V), usb_otg_bvalid_in (<0.8 V / >4 V), usb_otg_vbusvalid_in (<4.4 V / >4.75 V), usb_srp_sessend_in, usb_otg_iddig_in, plus outputs (drvvbus, chrgvbus, dischrgvbus, idpullup, dp/dmpulldown "15 kΩ"). "If an external transceiver is used instead, the UTMI+ OTG interface signals will be routed to the ESP32-S3's GPIOs instead through GPIO Matrix". (No VBUS pin exists on the package — pin table §3.) IDF-PHY: `USB_PHY_SELF_POWERED_DEVICE(vbus_monitor_io)` maps a GPIO to bvalid.
- D+/D− swap: eFuse **EFUSE_USB_EXCHG_PINS** (TRM Table 5.3-1 p.411; Reg 5.13 p.432): "Represents whether or not USB D+ and D- pins are swapped. 1: Swapped. 0: Not swapped." **"Note: The eFuse has a design flaw and does not move the pullup (needed to detect USB speed), resulting in the PC thinking the chip is a low-speed device, which stops communication."** IDF-EF: USB_EXCHG_PINS BLK0 bit 57. Which controller(s) the eFuse affects: **not stated** (UNVERIFIED). Register swaps: USB_SERIAL_JTAG_CONF0_REG bit 2 EXCHG_PINS + bit 1 EXCHG_PINS_OVERRIDE (TRM Reg 33.3); OTG side `USB_WRAP.otg_conf.exchg_pins/_override` (IDF-LL). DS Table 2-9 note: "the USB_D- and USB_D+ can be swapped by configuring the USB_SERIAL_JTAG_EXCHG_PINS bit".
- Internal D+ pull-up (USJ): USB_SERIAL_JTAG_CONF0_REG (offset 0x18; USJ base 0x6003_8000 ⇒ 0x6003_8018; TRM Reg 33.3 p.1257, rendered): [14] USB_PAD_ENABLE reset **1**; [13] PULLUP_VALUE reset 0 ("0: 2.2 K; 1: 1.1 K"); [12] DM_PULLDOWN; [11] DM_PULLUP; [10] DP_PULLDOWN; [9] DP_PULLUP reset **1**; [8] PAD_PULL_OVERRIDE reset 0; [7] VREF_OVERRIDE; [6:5] VREFL; [4:3] VREFH; [2] EXCHG_PINS; [1] EXCHG_PINS_OVERRIDE; [0] PHY_SEL ("1'b0: internal PHY, 1'b1: external PHY"); [16] USB_JTAG_BRIDGE_EN. IDF-REG: "USB_SERIAL_JTAG_DP_PULLUP : R/W ;bitpos:[9] ;default: 1'b1". DS note 6 (p.18): "By default, the USB function is enabled for USB pins (i.e., GPIO19 and GPIO20), and the pin pull-up is decided by the USB pull-up. The USB pull-up is controlled by USB_SERIAL_JTAG_DP/DM_PULLUP and the pull-up resistor value is controlled by USB_SERIAL_JTAG_PULLUP_VALUE." OTG side: `usb_wrap_ll_phy_enable_pull_override` / `pullup_value` (IDF-LL).
  - **CONFLICT (pull-up value)**: TRM USJ register "0: 2.2 K; 1: 1.1 K"; TRM RTC_CNTL_USB_PULLUP_VALUE "0: typical value is 2.4 kΩ; 1: typical value is 1.2 kΩ"; IDF-LL comment "True is a ~1.4K pullup, false is a ~2.4K pullup".
- USB-related eFuses — exact names (TRM Table 5.3-1 / Regs 5.13–5.16; IDF-EF BLK0 bit #):
  - EFUSE_DIS_USB_OTG (bit 45) — "whether USB OTG function is disabled"
  - EFUSE_USB_EXCHG_PINS (57)
  - EFUSE_EXT_PHY_ENABLE (58; IDF name USB_EXT_PHY_ENABLE) — TRM table says "Represents whether external USB PHY is disabled" but Reg 5.13 says "1: Enabled. 0: Disabled" (**CONFLICT, wording**)
  - EFUSE_DIS_USB_JTAG (118) — Table: "whether the function of usb_serial_jtag that switch usb to jtag is disabled"; Reg 5.15: "whether USB OTG function that can be switched to JTAG interface is disabled" (**CONFLICT, wording**)
  - EFUSE_DIS_USB_SERIAL_JTAG (119) — "whether usb_serial_jtag function is disabled"
  - EFUSE_STRAP_JTAG_SEL (120) — TRM: "through strapping GPIO3"; IDF-EF comment says "through strapping gpio10" (**CONFLICT, IDF comment error**)
  - EFUSE_USB_PHY_SEL (121)
  - EFUSE_DIS_DOWNLOAD_MODE (128)
  - EFUSE_DIS_USB_PRINT (TRM name) = DIS_USB_SERIAL_JTAG_ROM_PRINT (IDF name; DS uses EFUSE_DIS_USB_SERIAL_JTAG_ROM_PRINT) (130) (**CONFLICT, naming**)
  - EFUSE_DIS_USB_SERIAL_JTAG_DOWNLOAD_MODE (132) — AR22-004: "BLK0 B16[4]", formerly "EFUSE_DIS_USB_DOWNLOAD"
  - EFUSE_ENABLE_SECURITY_DOWNLOAD (133)
  - EFUSE_UART_PRINT_CONTROL (134, 2 bits)
  - EFUSE_DIS_USB_OTG_DOWNLOAD_MODE (159) — AR22-004: "BLK0 B19[7]", formerly "EFUSE_ERR_RST_ENABLE"
  - EFUSE_DIS_FORCE_DOWNLOAD (44), EFUSE_DIS_PAD_JTAG (51)
- Errata USBOTG-4289 (ERR §3.5 p.9): chips before Date Code 2219 have EFUSE_DIS_USB_OTG_DOWNLOAD_MODE "set by default and cannot be modified. Therefore, the USB-OTG Download function is unavailable"; "fixed in some batches of chip revision v0.2" (Date Code ≥2219). AR22-004 recommends programming EFUSE_DIS_USB_OTG_DOWNLOAD_MODE (and separately EFUSE_DIS_USB_SERIAL_JTAG_DOWNLOAD_MODE) for firmware-security-sensitive products.
- Sleep: TRM p.1253: "the USB serial/JTAG Controller (as well as the attached Xtensa CPUs) will be entirely powered down in Deep-sleep mode". IDF-USJCON: in Deep-sleep "the USB PHY's D+ line no longer being pulled up"; in Light-sleep the device is unresponsive and "the USB PHY's D+ line remains pulled up".

---------------------------------------------------------------------------------------------------

## 8. ROM boot / download

- Interfaces in Joint Download Boot (DS Table 3-3 note 2 p.33; TRM Table 8.2-1 note 1): "USB Download Boot: USB-Serial-JTAG Download Boot; USB-OTG Download Boot; UART Download Boot". TRM p.535: "In Joint Download Boot mode, users can download binary files into flash using UART0 or USB interface. It is also possible to download binary files into SRAM and execute it in this mode." SPI Download Boot: "download binary files into flash using SPI interface".
- IDF-OTGCON: "ESP32-S3 ROM code contains a USB CDC implementation … Bidirectional serial console … Flashing using esptool … Device Firmware Update (DFU) interface". "By default, the USB_SERIAL_JTAG module is connected to the internal PHY of ESP32-S3, while the USB OTG peripheral can be used only if the external USB PHY is connected." TRM p.1252: "only USB-OTG supports the DFU protocol and only the USB Serial/JTAG controller supports JTAG debugging over USB."
- Forcing download boot by software (TRM §8.2 pp.535-536): "EFUSE_DIS_FORCE_DOWNLOAD – If this eFuse is 0 (default), software can force switch the chip from SPI Boot mode to Joint Download Boot mode by setting register RTC_CNTL_FORCE_DOWNLOAD_BOOT and triggering a CPU reset. In this case, hardware overwrites GPIO_STRAPPING[3:2] from "1x" to "00". If this eFuse is 1, RTC_CNTL_FORCE_DOWNLOAD_BOOT is disabled." "EFUSE_DIS_DOWNLOAD_MODE: If this eFuse is 1, Joint Download Boot mode is disabled." EFUSE_ENABLE_SECURITY_DOWNLOAD = secure download mode.
  - Register: RTC_CNTL_RTC_OPTION1_REG (offset 0x012C ⇒ 0x6000_812C) bit 0 RTC_CNTL_FORCE_DOWNLOAD_BOOT, R/W, reset 0: "Set this bit to force chip enters download boot by sw." (TRM Reg 10.58 p.628; IDF-REG `RTC_CNTL_OPTION1_REG (DR_REG_RTCCNTL_BASE + 0x12C)`, `RTC_CNTL_FORCE_DOWNLOAD_BOOT_S 0`; ET-SRC `RTC_CNTL_OPTION1_REG = 0x6000812C`, mask 0x1).
  - ET-SRC `hard_reset`: "Clear force download boot mode to avoid chip being stuck in download mode after reset. Workaround for issue: https://github.com/espressif/arduino-esp32/issues/6762" ⇒ the bit is sticky across the reset used.
  - ARD example: `REG_WRITE(RTC_CNTL_OPTION1_REG, RTC_CNTL_FORCE_DOWNLOAD_BOOT);` in a shutdown handler, then `esp_restart()`; for ESP32-S3 it first calls `usb_switch_to_cdc_jtag()` (moves internal PHY back to USJ).
  - TRM §8.2: "USB Serial/JTAG Controller can also force the chip into Joint Download Boot mode from SPI Boot mode, as well as force the chip into SPI Boot mode from Joint Download Boot mode." CDC-ACM control lines (TRM Table 33.3-2 p.1248): RTS=0/DTR=0 clear download flag; RTS=0/DTR=1 set download flag; RTS=1/DTR=0 reset; RTS=1/DTR=1 no action; sequences in Tables 33.4-3/33.4-4 (p.1254).
- ROM messages (DS §3.3): default printed to "UART0 and USB Serial/JTAG controller".

---------------------------------------------------------------------------------------------------

## 9. Electrical

- Abs max (DS Table 5-1 p.64): "Input power pins … –0.3 … 3.6 V"; "Cumulative IO output current … 1500 mA"; storage –40…150 °C. **No per-GPIO absolute-maximum input voltage is given** (UNVERIFIED value).
- Recommended (DS Table 5-2 p.64): VDDA, VDD3P3, VDD3P3_RTC, VDD3P3_CPU: 3.0 / 3.3 / 3.6 V; VDD_SPI (as input) 1.8/3.3/3.6 V; IVDD cumulative input current min **0.5 A**; note 4 "If you use a single power supply, the recommended output current is 500 mA or more."; note 3 "If writing to eFuses, the voltage on VDD3P3_CPU should not exceed 3.3 V as the circuits responsible for burning eFuses are sensitive to higher voltages." HDG p.5: "the recommended power supply voltage is 3.3 V and the output current is no less than 500 mA"; "add an ESD protection diode and at least 10 μF capacitor at the main power entrance".
- Peak current (DS Table 5-7 p.66, rendered; 3.3 V, 25 °C, TX at 100 % duty): 802.11b 1 Mbps @21 dBm **340 mA**; 802.11g 54 Mbps @19 dBm 291 mA; HT20 MCS7 @18.5 dBm 283 mA; HT40 MCS7 @18 dBm 286 mA; RX 88/91 mA. BLE (Table 5-8 p.67): @21 dBm 335 mA; @9 dBm 193; @0 dBm 176; @–15 dBm 116; RX 93 mA.
- HDG p.8: VDD3P3 (pins 2/3) "when ESP32-S3 is transmitting signals, there may be a sudden increase in the current draw, causing power rail collapse. Therefore, it is highly recommended to add a 10 μF capacitor"; "Add an LC circuit to the VDD3P3 power rail … inductor's rated current is preferably 500 mA and above." Layout (HDG §1.4.2 p.22): "place a 10 µF capacitor for each pin" (2 and 3); "The ground pad at the bottom of the chip should be connected to the ground plane through at least nine ground vias."
- CHIP_PU (DS §2.5.3 Table 2-13 p.30): tSTBL ≥ 50 µs ("Time reserved for the power rails of VDDA, VDD3P3, VDD3P3_RTC, and VDD3P3_CPU to stabilize before the CHIP_PU pin is pulled high"); tRST ≥ 50 µs ("Time reserved for CHIP_PU to stay below VIL_nRST to reset the chip"); Fig 2-3 shows rails reference 2.8 V. DS Table 5-4: VIH_nRST 0.75×VDD … VDD+0.3; VIL_nRST –0.3 … 0.25×VDD. HDG p.8: "The recommended setting for the RC delay circuit is usually R = 10 kΩ and C = 1 μF"; for slow/unstable supplies "reserve a power monitor chip … threshold … around 3.0 V".
- Brown-out (TRM §10.3.4.4 p.574): monitors VDD3P3, VDD3P3_RTC, VDD3P3_CPU; "predefined threshold (2.7 V by default)".
- DC (DS Table 5-4 p.65, 3.3 V, 25 °C): CIN 2 pF; VIH 0.75×VDD … **VDD+0.3**; VIL –0.3 … 0.25×VDD; IIH/IIL ≤50 nA; VOH ≥0.8×VDD; VOL ≤0.1×VDD; IOH 40 mA typ (VOH≥2.64 V, PAD_DRIVER=3); IOL 28 mA typ; **RPU 45 kΩ typ, RPD 45 kΩ typ** (no min/max).
- 5 V tolerance: ESPUSB (Self-Powered Device): "ESP32-S3 pins are 3.3 V tolerant." and recommends VBUS via comparator or "a resistor voltage divider that outputs (0.75 x Vdd) if VBUS is 4.4 V"; "the voltage on the sensing pin must be logic low within 3 ms after the device is unplugged". ⇒ GPIOs are **not** 5 V tolerant (consistent with VIH max = VDD+0.3 V).
- Low-power (DS Table 5-10 p.68): Deep-sleep 7–8 µA; Power off (CHIP_PU low) 1 µA; Light-sleep 240 µA (+PSRAM e.g. "200 µA for 8 MB 8-line PSRAM (1.8 V)").

---------------------------------------------------------------------------------------------------

## 10. Package

- DS Fig 7-1 (p.77, rendered) "QFN56 (7×7 mm) Package": A 0.800/0.850/0.900; A1 0.000/–/0.050; A3 0.203 Ref; D, E 6.950/7.000/7.050; **D2, E2 (EPAD) 3.950/4.000/4.050 mm**; **e 0.400 BSC**; b 0.150/0.200/0.250; L 0.350/0.400/0.450; pin-1 ID C0.50; tolerances aaa 0.10, bbb 0.10, ccc 0.10, ddd 0.05, eee 0.08, fff 0.10; "DIMENSIONING AND TOLERANCING PER JEDEC MO-220". "The pins of the chip are numbered in anti-clockwise order starting from Pin 1 in the top view."
- FH4R2 only (DS Fig 7-2 p.78): EP 5.6/5.7/5.8 mm.
- Land pattern (DS §7): "The recommended land pattern source file (asc) is available for download. You can import the file with software such as PADS and Altium Designer." Link → ASC. Decoded from ASC (PADS BASIC units; 1 mm = 1,500,000 units, consistent with 0.4 mm pitch): decal "QFN56_0P4_7B"; signal pads **0.22 × 0.65 mm** (330000 × 975000) at **0.4 mm** pitch, pad centres **±3.425 mm** from body centre (pads span 3.10–3.75 mm); EPAD (pin 57) = 3×3 array of **1.0 × 1.0 mm** copper squares with 0.5 mm gaps spanning **4.0 × 4.0 mm** (matching paste-layer squares); 12 Ø0.4 mm circles in the gaps (likely via markers — layer meaning **UNVERIFIED**). Internal JOBNAME in the file reads "ESP32-S2 Footprint.pcb" (cosmetic; dimensions match S3 Fig 7-1). Decoding is mine — verify by importing into CAD.
- HDG §1.4.2: "employ a square grid on the EPAD, cover the gaps with solder paste, and place ground vias in the gaps" (stated for module EPAD); ≥9 ground vias for chip ground pad.
- Reliability preconditioning (DS Table 5-13 p.69): "Moisture soak (level 3: 192 hours @30 °C, 60% RH)", "IR reflow solder: 260 + 0 °C, 20 seconds, three times". ESD HBM ±2000 V, CDM ±1000 V.

---------------------------------------------------------------------------------------------------

## 11. Crystal

- DS §4.1.3.3 (p.42): "ESP32-S3 is unable to operate without an external main crystal clock." DS gives no crystal frequency/tolerance spec.
- TRM §7.2.3 (p.529): "XTAL_CLK (40 MHz): external crystal clock". HDG §1.3.5 (p.10): "**The ESP32-S3 firmware only supports 40 MHz crystal.**" "the accuracy of the selected crystal should be within **±10 ppm**." Series component on XTAL_P: "initially, it is suggested to use an inductor of 24 nH"; "It is recommended that the amplitude of the crystal is greater than 500 mV." Frequency offset tune target ±10 ppm. ET-SRC: "ESP32S3 XTAL is fixed to 40MHz".
- Crystal pins: 53 XTAL_N, 54 XTAL_P (DS Table 2-1).
- 32 kHz (HDG p.11): "ESP32-S3 supports an external 32.768 kHz crystal to act as the RTC clock"; pins XTAL_32K_P (pin 21, GPIO15) / XTAL_32K_N (pin 22, GPIO16) (DS Table 2-8); "Equivalent series resistance (ESR) ≤ 70 kΩ"; parallel R "5 MΩ < R ≤ 10 MΩ … In general, you do not need to populate the resistor."; "If the RTC clock source is not required, then the pins for the 32.768 kHz crystal can be used as GPIOs." Without it, RTC slow clock can use internal ~136 kHz RC or RC_FAST/256 (DS §4.1.3.3).
- Layout (HDG §1.4.3): crystal ≥2.0 mm from clock pin; no vias on clock traces; series components near chip; no signal traces under crystal.

---------------------------------------------------------------------------------------------------

## 12. Errata summary (ERR v1.3 Table 2.1 p.5) — all affect v0.0/v0.1/v0.2
CACHE-126 (cache hit error during write-backs; bypassed in IDF v4.4.6+/v5.0.4+/v5.1.1+/v5.2+), RTC-126, ANALOG-160 ("Chip Will Be Damaged When BIAS_SLEEP = 0 and PD_CUR = 1"; bypassed IDF v4.4.2+, v5.0+), LCD-239, USBOTG-4289 (Y* some batches), RMT-176, TOUCH-100, ADC-183 (DIG ADC2 DMA cannot work). "No fix scheduled" for all except USBOTG-4289.

---------------------------------------------------------------------------------------------------

## 13. Consolidated list — UNVERIFIED / CONFLICTS

UNVERIFIED
1. Whether bare ESP32-S3R16V (reel parts) ship with VDD_SPI_FORCE/XPD burned (TIEH=0). Evidence only: DS "has been set to 1.8 V"; WROOM1 (modules) "fixed … via eFuse"; PCN-W2 (R8V inside WROOM-2) "set to 1.8 V by eFuse VDD_SPI_TIEH and VDD_SPI_FORCE".
2. Whether EFUSE_PIN_POWER_SELECTION is burned at factory on R16V (no source).
3. Reset domain of RTC_CNTL_RTC_USB_CONF_REG and RTC_CNTL_RTC_OPTION1_REG — inferred from TRM reset-level definitions, not stated per register.
4. Which controller(s) EFUSE_USB_EXCHG_PINS applies to; whether register-based swaps share the pull-up flaw.
5. Per-GPIO absolute-max input voltage (not in DS Table 5-1).
6. Min/max of internal pull resistors (only typ 45 kΩ).
7. Whether the ROM's external-PHY pad initialisation (MTDO high, MTCK/GPIO38 low) occurs only in download boot or also on normal SPI boot when OTG download is not disabled (TRM wording "when starts up" is ambiguous).
8. Abs-max/damage threshold of the 1.8 V in-package PSRAM (only 1.62–1.98 V operating given; IDF warns damage).
9. EOL announcement document for ESP32-S3R8V (not found; status from DS + PS).
10. Whether System Reset (vs only Chip Reset) re-latches strapping pins (TRM says Chip Reset).
11. Meaning of the 12 Ø0.4 mm circles in the ASC land pattern.

CONFLICTS
A. DS Table 2-4 vs DS Table 7-1: pins 36/37 IO-MUX F0 names (SPICLK_N_DIFF/SPICLK_P_DIFF) swapped.
B. USB pull-up value: 2.2k/1.1k (TRM USJ reg) vs 2.4k/1.2k (TRM RTC_CNTL reg) vs ~2.4k/~1.4k (IDF LL comment).
C. External PHY pins "fixed" (DS Table 2-9 note) vs "via GPIO matrix" (DS §4.2.1.8, TRM Fig 33.3-1, IDF); TRM signal table lacks the USB_EXTPHY signals that IDF defines at indices 55–59.
D. eFuse naming: EFUSE_DIS_USB_PRINT (TRM) vs EFUSE_DIS_USB_SERIAL_JTAG_ROM_PRINT (DS, IDF); EFUSE_EXT_PHY_ENABLE described as "disabled" in TRM table vs "1: Enabled" in TRM register; EFUSE_DIS_USB_JTAG description differs between TRM table and register; IDF STRAP_JTAG_SEL comment says "gpio10" (TRM/DS: GPIO3).
E. TRM §32 uses RTC_CNTL_SW_HW_USB_PHY_SEL_CFG / RTC_CNTL_SW_USB_PHY_SEL_CFG; register chapter & IDF use RTC_CNTL_SW_HW_USB_PHY_SEL / RTC_CNTL_SW_USB_PHY_SEL.
F. TRM Table 7.1-1: footnote lists Super Watchdog as a Chip Reset source, table row 0x12 lists it as System Reset.
G. esptool "Set Flash Voltage" (ESP32-S3) calls the VDD_SPI strap "MTDI"; on S3 the strap is GPIO45.
H. DS p.67 names non-existent parts "ESP32-S3FH8"/"ESP32-S3FN4R2".
I. DS "up to 1 GB of external flash and RAM" vs TRM "up to 1 GB external flash" + "up to 1 GB external RAM".
J. DS Table 3-4 omits EFUSE_VDD_SPI_XPD, which TRM §10.3.4.3 and esptool show is also required when FORCE=1.
K. EFUSE_FLASH_TPUW: TRM "Otherwise, the waiting time is always 30 ms" vs IDF "Otherwise; the waiting time is twice the configurable value" (not design-relevant).
