# R2: ESP32-S3 hardware design guidance and reference schematics (for a chip-down design)

Research date: 2026-11-09. Every fact below was read from an Espressif primary document that was downloaded on this date. Schematic values were read from rendered PDF pages or from Espressif's native-resolution figure PNGs, zoomed in. Anything not found in a primary source is marked **UNVERIFIED**. Conclusions I drew myself are marked **[inference]**.

## 0. Sources used (version, date, URL)

| ID | Document | Version / date | URL |
|---|---|---|---|
| HDG | ESP32-S3 Hardware Design Guidelines (HTML + PDF) | "latest" = *Release master*. The PDF title page says "Nov 05, 2026" (PDF CreationDate 2026-11-05). The newest revision-history entry is **v1.8, 2025-07-03**. Built from GitHub commit `05b77be`. | https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32s3/index.html ; PDF: https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32s3/esp-hardware-design-guidelines-en-master-esp32s3.pdf |
| HDG-IMG | Native-resolution HDG figure PNGs (same build) | as above | `.../latest/esp32s3/_images/<name>.png` (for example `esp32s3-sche-core.png`) |
| CDS | ESP32-S3 Series Datasheet | **v2.2, 2026-03-05** | https://www.espressif.com/sites/default/files/documentation/esp32-s3_datasheet_en.pdf (redirects to https://documentation.espressif.com/esp32-s3_datasheet_en.pdf) |
| WDS | ESP32-S3-WROOM-1 & WROOM-1U Datasheet | **v1.8, 2026-03-02**. Its module schematic title block reads "V1.4, Tuesday, November 21, 2023". | https://documentation.espressif.com/esp32-s3-wroom-1_wroom-1u_datasheet_en.pdf |
| MDS | ESP32-S3-MINI-1 & MINI-1U Datasheet | **v1.7, 2026-03-02**. Its module schematic is dated "Wednesday, November 22, 2023". | https://documentation.espressif.com/esp32-s3-mini-1_mini-1u_datasheet_en.pdf |
| WREF | ESP32-S3-WROOM-1 module reference design (zip linked from HDG §1.6.1) | SCH V1.3 2022-07-05; PCB/Gerber V1.3 2022-07-04; **BOM(V0.8)** last saved 2022-07-04 | https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32s3/_downloads/5d315514773a508dd7cc7d4021d42783/esp32-s3-wroom-1_reference_design.zip |
| MREF | ESP32-S3-MINI-1 module reference design (zip linked from HDG §1.6.1) | SCH V1.1 2022-07-04; **BOM(V0.5)** last saved 2022-07-04 | https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32s3/_downloads/0cb69045f07bb2a06dee1fc87489d169/esp32-s3-mini-1_reference_design.zip |
| DKC | ESP32-S3-DevKitC-1 v1.1 schematic (the one linked under "Related Documents") | Rev V1.1, title block "Wednesday, November 30, 2022". An older 2022-04-13 file has identical relevant content. | https://dl.espressif.com/dl/schematics/SCH_ESP32-S3-DevKitC-1_V1.1_20221130.pdf (from https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s3/esp32-s3-devkitc-1/user_guide_v1.1.html) |
| DKM | ESP32-S3-DevKitM-1 schematic | Rev V1.0, 2021-03-10 | https://dl.espressif.com/dl/schematics/SCH_ESP32-S3-DEVKITM-1_V1_20210310A.pdf (from https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s3/esp32-s3-devkitm-1/user_guide.html) |
| TRM | ESP32-S3 Technical Reference Manual | **v1.8, 2026-03-04** | https://www.espressif.com/sites/default/files/documentation/esp32-s3_technical_reference_manual_en.pdf |
| SEL | Espressif Product Selector, backing JSON API (queried 2026-11-09) | live data | https://products.espressif.com/api/user/products (UI: https://products.espressif.com/#/product-selector). The old "ordering information" PDF URL now redirects here. |
| IDF-USJ | ESP-IDF Programming Guide **v6.1** (stable), "USB Serial/JTAG Controller Console" (ESP32-S3) | v6.1 | https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-guides/usb-serial-jtag-console.html |
| IDF-OTG | ESP-IDF v6.1, "USB OTG Console" (ESP32-S3) | v6.1 | https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-guides/usb-otg-console.html |
| IDF-SER | ESP-IDF v6.1, "Establish Serial Connection" (ESP32-S3) | v6.1 | https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/get-started/establish-serial-connection.html |
| FAQ | ESP-FAQ, "USB" (latest, © 2020–2026, no version number) | retrieved 2026-11-09 | https://docs.espressif.com/projects/esp-faq/en/latest/software-framework/peripherals/usb.html |
| ESPT | esptool docs (latest, ESP32-S3): "Boot Mode Selection", "Advanced Options", "espefuse set-flash-voltage" | latest, retrieved 2026-11-09 | https://docs.espressif.com/projects/esptool/en/latest/esp32s3/advanced-topics/boot-mode-selection.html ; .../esptool/advanced-options.html ; .../espefuse/set-flash-voltage-cmd.html |

HDG page numbers below are the printed page numbers in the PDF. The PDF page index is the printed number plus 3.

---

## 1. HDG schematic recommendations (HDG §1.3, Schematic Checklist)

### 1.1 Reference schematic (HDG §1.3.1, p.4–5, Fig. 1 "ESP32-S3 Reference Schematic"; HDG-IMG `esp32s3-sche-core.png`, 1800×1154, read zoomed)
- Overview, verbatim: "The integrated circuitry of ESP32-S3 requires only 20 electrical components (resistors, capacitors, and inductors) and a crystal, as well as an SPI flash."
- Fig. 1 "shows the connection for 3.3 V, quad, off-package SPI flash/PSRAM."
- Values in Fig. 1 (all legible):
  - **Power entrance (VDD33):** D1 "ESD" plus C21 **10uF**.
  - **VDDA (pins 55, 56):** C3 **1uF**, C2 **10nF**, both on the VDD33 net that feeds pins 55/56.
  - **VDD3P3 (pins 2, 3), RF-related:** VDD33 → C6 **10uF**, C7 **1uF**, C8 **0.1uF** → L1 **"2.0nH(0.1nH) 500 mA"** in series → C9 **0.1uF** → pins 2/3. This forms a CLC filter.
  - **VDD3P3_CPU (pin 46):** C10 **0.1uF**.
  - **VDD3P3_RTC (pin 20):** C15 **0.1uF**.
  - **VDD_SPI (pin 29):** C13 **0.1uF**, C14 **1uF**.
  - **Crystal:** Y1 "40MHz(±10ppm)", 4-pin (XIN pin 1, GND 2, XOUT 3, GND 4). C1 = **TBD** at XIN, C4 = **TBD** at XOUT. **L4 = TBD** in series on XTAL_P (pin 54). The note says "The value of L4 varies with the actual PCB board. The initial value is suggested to be 24 nH." XTAL_N (pin 53) goes directly to XOUT.
  - **GPIO45:** R1 "10K(NC)", a pull-up to VDD33 that is not populated.
  - **U0TXD:** R3 **499** (Ω) in series.
  - **SPI:** 0 Ω series resistors R16 (SPID), R15 (SPIQ), R10 (SPICLK), R14 (SPIWP), R13 (SPIHD). **SPICS0 has no series resistor.** U2 "FLASH-3V3" and U3 "PSRAM-3V3 (Optional)" take VDD from VDD_SPI. There is no CS pull-up and no local decoupling capacitor drawn at the flash or PSRAM.
  - **RF:** see §1.6.
  - **CHIP_PU:** the figure shows only a net label and the note "H Activate chip; L Disable chip. This pin could not be float." **The figure has no RC on CHIP_PU.** The RC values are given in the text (see §1.3).
- Bullets under the figure, verbatim:
  - "In cases where 1.8 V or 3.3 V, octal, in-package or off-package SPI flash/PSRAM is used, GPIO33 ~ GPIO37 are occupied and cannot be used for other functions."
  - "If an in-package SPI flash/PSRAM is used and VDD_SPI is configured to 1.8 V or 3.3 V via the VDD_SPI_FORCE eFuse, the GPIO45 strapping pin no longer affects the VDD_SPI voltage. In these cases, the presence of R1 is optional. For all other cases, refer to ESP32-S3 Chip Series Datasheet > Section VDD_SPI Voltage Control > Table VDD_SPI Voltage Control to determine whether R1 should be populated or not."
  - "When only in-package flash/PSRAM is used, there is no need to populate the resistor on the SPI traces or to care the SPI traces."
- **Fig. 2 "ESP32-S3 Schematic for Off-Package 1.8 V Octal Flash/PSRAM"** (p.6, `esp32s3-sche-ext-1v8-spi8.png`):
  - **R1 10K pull-up on GPIO45 to VDD33 is POPULATED.**
  - 0 Ω series resistors on SPI_DQS (R5) and SPI_IO7..IO4 (R6–R9), plus R16/R15/R10/R14/R13 as in Fig. 1. SPI_CS0 is direct.
  - U2 FLASH-1V8: RESET# has an R11 **10K** pull-up to VDD_SPI, and WP# has an R12 **10K** pull-up.
  - U3 PSRAM-1V8: RST# has an R2 **10K** pull-up.
  - C13 0.1uF and C14 1uF at VDD_SPI.

### 1.2 Power supply (HDG §1.3.2, p.5–8)
- Verbatim: "When using a single power supply, the recommended power supply voltage is 3.3 V and the output current is no less than 500 mA."
- Verbatim: "It is suggested to add an ESD protection diode and at least 10 μF capacitor at the main power entrance (where the external power supply enters the PCB)."
- Digital supply, verbatim: "pin46 VDD3P3_CPU as the digital power supply pin, and pin 20 VDD3P3_RTC as the RTC and partial digital power supply pin, with an operating voltage range of 3.0 V ~ 3.6 V. It is recommended to add a 0.1 μF capacitor close to the digital power supply pins".
- VDD_SPI, verbatim: "Pin VDD_SPI serves as the power supply for the external device at either 1.8 V or 3.3 V (default). It is recommended to add extra 0.1 μF and 1 μF decoupling capacitors close to VDD_SPI. Please do not add excessively large capacitors."
  - Verbatim: "When VDD_SPI operates at 1.8 V, it is powered by ESP32-S3's internal LDO. The typical current this LDO can offer is 40 mA."
  - Verbatim: "When VDD_SPI operates at 3.3 V, it is driven directly by VDD3P3_RTC through a 14 Ω resistor".
  - Attention box, verbatim: "...please ensure that VDD3P3_RTC remains above 3.0 V..." (when VDD_SPI powers 3.3 V flash/PSRAM). The source has a typo here: "VDDVDD_SPI_SPI" appears in both the HTML and the PDF.
  - Verbatim: **"Note that VDD3P3_RTC cannot supply power alone; all power supplies must be powered on at the same time."**
  - **Table 1 "VDD_SPI Voltage Control"** (agrees with CDS Table 3-4, p.34, and TRM §8.4, p.537):

    | EFUSE_VDD_SPI_FORCE | GPIO45 | EFUSE_VDD_SPI_TIEH | VDD_SPI | Source |
    |---|---|---|---|---|
    | 0 | 0 | ignored | 3.3 V | VDD3P3_RTC via RSPI (default) |
    | 0 | 1 | ignored | 1.8 V | Flash Voltage Regulator |
    | 1 | ignored | 0 | 1.8 V | Flash Voltage Regulator |
    | 1 | ignored | 1 | 3.3 V | VDD3P3_RTC via RSPI |

  - Verbatim: "VDD_SPI can also be driven by an external power supply." and "It is recommended to use the VDD_SPI output to supply power to external or internal flash/PSRAM."
  - Fig. 3 "ESP32-S3 Power Scheme" (as drawn): the Flash Voltage Regulator and RSPI both hang off the VDD3P3_RTC rail.
- Analog supply, verbatim:
  - "VDD3P3 pins (pin2 and pin3) and VDDA pins (pin55 and pin56) are the analog power supply pins, working at 3.0 V ~ 3.6 V."
  - "For VDD3P3 ... it is highly recommended to add a 10 μF capacitor to the power rail, which can work in conjunction with the 1 μF capacitor(s)..."
  - "It is suggested to add an extra 10 μF capacitor at the main power entrance. If the main power entrance is close to VDD3P3, then the two 10 μF capacitors can be merged into one."
  - **"Add an LC circuit to the VDD3P3 power rail to suppress high-frequency harmonics. The inductor's rated current is preferably 500 mA and above."**
- Supporting sources:
  - CDS Table 5-2 (p.64): VDDA/VDD3P3/VDD3P3_RTC/VDD3P3_CPU are 3.0 / 3.3 / 3.6 V (min/typ/max). "VDD_SPI (as input)" is 1.8 to 3.6 V. "IVDD Cumulative input current 0.5 A (min)". Footnote 4: "If you use a single power supply, the recommended output current is 500 mA or more." Footnote 3: **"If writing to eFuses, the voltage on VDD3P3_CPU should not exceed 3.3 V as the circuits responsible for burning eFuses are sensitive to higher voltages."**
  - CDS Table 5-3 (p.65): RSPI = **14 Ω** typ; ISPI = **40 mA** typ ("Output current when VDD_SPI is powered by Flash Voltage Regulator for 1.8 V flash/PSRAM"). Note 2: "VDD3P3_RTC must be more than VDD_flash_min + I_flash_max * RSPI".
  - WDS Table 6-2 (p.27): module "IVDD Current delivered by external power supply" is at least 0.5 A.

### 1.3 CHIP_PU, power-up and reset (HDG §1.3.3, p.8–9; Fig. 4; Table 2)
- Verbatim: "keep the reset voltage VIL_nRST in the range of (–0.3 ~ 0.25 × VDD3P3_RTC) V. To avoid reboots caused by external interferences, make the CHIP_PU trace as short as possible."
- Table 2 minimums: **tSTBL ≥ 50 µs** (rails stable before CHIP_PU goes high) and **tRST ≥ 50 µs** (CHIP_PU below VIL_nRST to reset). Fig. 4 measures tSTBL from the point where the supply crosses **2.8 V**. CDS §2.5.3 Fig. 2-3 / Table 2-13 (p.30) agree.
- Attention, verbatim:
  - "CHIP_PU must not be left floating."
  - **"The recommended setting for the RC delay circuit is usually R = 10 kΩ and C = 1 μF."**
  - For "Slow power rise or fall ... Frequent power on/off operations ... Unstable power supply ... the RC circuit alone may not meet the timing requirements, which may prevent the chip from entering normal operating mode or cause flash erase operations to occasionally fail to complete. In this case, please reserve a power monitor chip to reset the chip when the power supply is abnormal, and the threshold of the power monitor chip is recommended to be around 3.0 V."
- Corroboration:
  - WDS and MDS §9, text under Fig. 9-1 (p.41): "R = 10 kΩ and C = 1 μF". In the figure itself R1 and C2 are shown as "TBD".
  - DKC and DKM: R5 **10K(1%)** to ESP_3V3, C6 **1uF/16V(10%)** to GND.

### 1.4 Flash/PSRAM (HDG §1.3.4, p.9–10)
- Verbatim: "it is recommended to use flash and PSRAM models officially validated by Espressif. For detailed model selection, consult the sales or technical support team. If VDD_SPI is used to supply power, make sure to select the appropriate off-package flash and RAM according to the power voltage on VDD_SPI (1.8 V/3.3 V). It is recommended to add zero-ohm resistor footprints in series on the SPI communication lines."
- HDG Table 5: ESP32-S3R8 and R8V in-package octal PSRAM use SPICLK, SPICS1, SPID/Q/WP/HD and GPIO33..GPIO37 (DQ4..DQ7, DQS/DM).
- The HDG has **no explicit statement on CS pull-ups** for quad flash. Fig. 1 shows none. Fig. 2 (1.8 V octal) shows 10K pull-ups on RESET#/WP# (flash) and RST# (PSRAM). See §2.6 for layout decoupling.
- CDS §2.6, Table 2-14 (p.31): for quad SPI, flash uses SPICS0 (CS#), SPICLK, SPID (DI), SPIQ (DO), SPIWP (WP#), SPIHD (HOLD#). PSRAM uses SPICS1. Octal adds GPIO33–37. Verbatim: "Notice: Do not use the pins connected to in-package flash/PSRAM for any other purposes."
- HDG §1.3.8 SPI (p.13–14), verbatim: "When using the SPI function, to improve EMC performance, add a series resistor (or ferrite bead) and a capacitor to ground on the SPI_CLK trace. If space allows ... also add a series resistor and capacitor to ground on other SPI traces." It is ambiguous whether this applies to the flash bus or only to general SPI peripherals.

### 1.5 40 MHz crystal (HDG §1.3.5, p.10–11, Fig. 5)
- Verbatim: "The ESP32-S3 firmware only supports 40 MHz crystal." and "the accuracy of the selected crystal should be within ±10 ppm."
- Verbatim: **"Please add a series component on the XTAL_P clock trace. Initially, it is suggested to use an inductor of 24 nH ... and the value should be adjusted after an overall test."**
- C1 and C4 come from CL = C1×C4/(C1+C4) + Cstray. Tune with the "Certification and Test Tool" in TX tone mode to within ±10 ppm. Positive offset means increase the load capacitance; negative offset means decrease it.
- Verbatim: "It is recommended that the amplitude of the crystal is greater than 500 mV."
- 32.768 kHz crystal (optional): ESR ≤ 70 kΩ; parallel R between 5 and 10 MΩ, "In general, you do not need to populate the resistor." The pins can be used as GPIO if the crystal is not used.
- Module BOM values (WREF BOM V0.8 and MREF BOM V0.5):
  - Y1 "40 MHz, **±7 ppm**, 15 pF, 100 uW, XTAL3225" (WROOM-1); "40 MHz, ±10 ppm, 15 pF, 100 uW, XTAL3225" (MINI-1).
  - C1, C4: "TBD, C0201, Defined by RF Test".
  - **R4 (the XTAL_P series part): "24 nH (3%), 140 mA", R0201 footprint, "Inductor".**

### 1.6 RF matching (HDG §1.3.6, p.12–13, Fig. 7, Table 6)
- Verbatim:
  - "For the RF traces on the PCB board, 50 Ω impedance control is required."
  - "For the chip matching circuit, it must be placed close to the chip. A CLC structure is preferred."
  - "the antenna's characteristic impedance must be around 50 Ω. Adding a CLC matching circuit near the antenna is recommended".
  - "It is recommended to include ESD protection devices for the antenna".
- Fig. 7 topology, from LNA_IN (pin 1) outward:
  - Chip-side π: **C12 shunt** (circled: "Add a stub to the ground pad") → **L2 series** → **C11 shunt**.
  - Antenna side: **C23 shunt → L5 series → C22 shunt**, then RF_ANT with **D2 "ESD(NC)"** → ANT1 PCB_ANT.
  - All values are TBD: "The values of L5, C22, C23, C11, L2 and C12 vary with the actual PCB board."
- Tuning target, verbatim: "If S11 is close to the chip conjugate point 35+j0 and S21 is less than -35 dB at 4.8 GHz and 7.2 GHz, the matching circuit can satisfy transmission requirements."
- **Table 6 "Recommended Value Ranges for Components"** (applies "If your PCB design ... strictly follows the PCB design stated in Chapter PCB Layout Design"):
  - C11: **1.2 ~ 1.8 pF** (GRM0335C1H1RXBA01D)
  - L2: **2.0 ~ 3.0 nH** (LQP03TN2NXB02D)
  - C12: **"1.8 ~ 1.2 pF"**, written with the range reversed in both the HTML and the PDF (GRM0335C1H1RXBA01D)
  - The "X" in those Murata part numbers looks like a value placeholder **[inference]**.
- Verbatim: "Please use 0201 packages for RF matching components and add a stub to the first capacitor in the matching circuit at the chip end."
- Module reference designs (WDS Fig. 8-1, MDS Fig. 8-1, WREF/MREF) use a different antenna-side network:
  - RF_ANT has a **shunt series-LC (L3 + C5) to GND**, then C11 shunt → L2 series → C12 shunt → LNA_IN. All are TBD.
  - The BOMs say "Defined by RF Test" and "*Please be noted that C5, C11, C12, L2 and L3 are recommended to use Murata for good quality and accuracy."
  - **No released numeric RF matching values exist in any Espressif document I found. UNVERIFIED.**

### 1.7 UART0 (HDG §1.3.7, p.13)
- Verbatim: "U0TXD and U0RXD are GPIO43 and GPIO44 by default ... Usually, UART0 is used as the serial port for download and log printing ... It is recommended to connect a 499 Ω series resistor to the U0TXD line to suppress harmonics."
- WREF BOM: R3 "499 Ω (1%), 1/20 W, R0201".

### 1.8 Strapping pins (HDG §1.3.9, p.14–15; CDS §3, p.32–35)
- Strapping pins are GPIO0, GPIO3, GPIO45 and GPIO46. Defaults (CDS Table 3-1): GPIO0 weak pull-up (1), GPIO3 floating, GPIO45 weak pull-down (0), GPIO46 weak pull-down (0).
- Boot mode: SPI Boot needs GPIO0 = 1 (GPIO46 any). Joint Download Boot needs GPIO0 = 0 and GPIO46 = 0. Joint Download Boot covers USB-Serial-JTAG, USB-OTG and UART download.
- Timing: tSU ≥ 0 ms; **tH ≥ 3 ms** (HDG Table 8).
- Attention, verbatim: **"It is recommended to place a pull-up resistor at the GPIO0 pin." "Do not add high-value capacitors at GPIO0, or the chip may enter download mode."** The HDG gives no resistor value.
- GPIO3 / JTAG: CDS §3.4 says GPIO3 "does not have any internal pull resistors and the strapping value must be controlled by the external circuit that cannot be in a high impedance state". Per CDS Table 3-5, though, GPIO3 is "Ignored" when EFUSE_STRAP_JTAG_SEL = 0, which is the default.
- esptool Boot Mode Selection (ESPT): a boot button on GPIO0 "has to be a strong pull-down. For example a 10k resistor to GND."

### 1.9 GPIO and unused pins (HDG §1.3.10, p.15–17)
- Verbatim: "For unused pins in the high-impedance state without an internal pull-up or pull-down, it is recommended to add a pull-up or pull-down resistor or enable the internal pull during software initialization to avoid extra power consumption".
- Verbatim: "SPICLK_N, SPICLK_P, and GPIO33 ~ GPIO37 work in the same power domain, so if octal 1.8 V flash/PSRAM is used, then SPICLK_P and SPICLK_N also work in the 1.8 V power domain."
- Verbatim: "Only GPIOs in the VDD3P3_RTC power domain can be controlled in Deep-sleep mode."
- Table 10: power-up glitches of about 60 µs on GPIO1–14, 17–20 and XTAL_32K. GPIO19/20 show two high-level glitches during power-up.
- CDS p.18: "For ESP32-S3R8V and ESP32-S3R16V chip, as the VDD_SPI voltage has been set to 1.8 V, the working voltage for pins SPICLK_N and SPICLK_P (GPIO47 and GPIO48) would also be 1.8 V". The power for GPIO33–37/47/48 comes from VDD3P3_CPU or VDD_SPI as set by EFUSE_PIN_POWER_SELECTION (TRM Ch.5, p.435: "while ROM code is executed. 0: VDD3P3_CPU. 1: VDD_SPI.") and can be changed with IO_MUX_PAD_POWER_CTRL.

### 1.10 USB (HDG §1.3.13, p.18–19, Fig. 10)
- Verbatim: **"GPIO19 and GPIO20 can be used as D- and D+ of USB respectively. It is recommended to reserve series resistors (initial value can be 22/33 Ω) and capacitors to ground on the traces (initially can be unpopulated), and place them close to the chip."**
- Fig. 10: R13/R14 "22/33" in series on USB_DP and USB_DM; C32/C33 "NC" to GND on the connector side of the resistors. This R13/R14 is a different part from the SPI 0 Ω R13/R14 in Fig. 1.
- Verbatim: "upon power-up, the USB_D+ signal will fluctuate between high and low states. The high-level signal is relatively strong and requires a robust pull-down resistor to drive it low. Therefore, if you need a stable initial state, adding an external pull-up resistor is recommended to ensure a consistent high-level output voltage at startup." It is unclear whether this targets GPIO20 used as a GPIO. **[inference]** On a USB device, an external D+ pull-up would assert attach to the host.
- USB-OTG Download Boot drives some pads (Table 12): MTDO (GPIO40) output HIGH; MTCK (GPIO39) and GPIO38 output LOW; MTMS, MTDI and GPIO21 become inputs. Verbatim: "it is suggested to disable the USB-OTG Download Boot mode by setting the eFuse bit EFUSE_DIS_USB_OTG_DOWNLOAD_MODE". TRM Table 33.4-2 (p.1253) says the same.
- **The HDG gives no ESD guidance for the USB data lines.** The only ESD advice is at the power entrance and the antenna.
- TRM Ch.5 eFuse table (p.412): `EFUSE_USB_EXCHG_PINS` "Represents whether USB D+ and D- pins are swapped". This is a layout option and is not mentioned in the HDG.

---

## 2. HDG PCB layout guidance (HDG §1.4)

### 2.1 Layer count and stack-up
- §1.4.1 (p.20): "It is recommended to use a four-layer PCB design":
  - L1 signals and components.
  - L2 GND with "No signal traces".
  - L3 power, with a GND plane under the RF and crystal.
  - L4 "a few signal traces ... not recommended to place any components".
- A two-layer design is allowed: "Do not place any components on this layer [bottom] ... complete GND plane for the chip, RF, and crystal". §1.4.2 adds: "Note that there are no official two-layer modules."
- **Fig. 18 "ESP32-S3 PCB Stack-up Design"** (p.26, `shared-stackup-design__en.png`):

  | Layer | Material | Base Cu | Finished thickness | DK |
  |---|---|---|---|---|
  | Solder mask (CM) | | | 0.4 mil | 4 |
  | L1_Top | finished Cu 1 oz | 0.33 oz | 0.8 mil min | |
  | PP | 7628 TG150 RC50% | | 8.22 mil | 4.6 |
  | L2_Gnd | | 1 oz | 1.2 mil | |
  | Core | | | "Adjustable" | 4.6 |
  | L3_Power | | 1 oz | 1.2 mil | |
  | PP | 7628 | | 8.22 mil | 4.6 |
  | L4_Bottom | finished 1 oz | | | |
  | Solder mask (SM) | | | 0.4 mil | 4 |

  The 50 Ω line is **12.6 mil wide with 12.2 mil gap on each side** (coplanar). Total thickness is shown as "-".
- Both module PCBs are "4L ... 0.8 mm ... 50 Ω impedance control" (WREF BOM V0.8; MREF BOM V0.5).

### 2.2 Power and EPAD (§1.4.2, p.20–23; Figs. 12–14)
- Verbatim: "at least two vias if the main power traces need to cross layers. The drill diameter on other power traces should be no smaller than the width of the power traces."
- Trace widths: **main power ≥ 25 mil; VDD3P3 pins 2/3 ≥ 20 mil; others 10 mil (recommended)**, surrounded by ground copper.
- ESD diodes go near the power input. A 10 µF capacitor goes before the power enters the chip, optionally with 0.1 or 1 µF in parallel. Branch the supply in a star.
- Verbatim: "The power supply for pin2 and pin3 is RF related, so please place a 10 µF capacitor for each pin." See the conflicts section.
- CLC/LC filter near pins 2/3. Use 0201 parts "Except for the 10 µF capacitor". Place a via to the bottom layer at the first capacitor and keep out the other layers there.
- **"The ground pad at the bottom of the chip should be connected to the ground plane through at least nine ground vias."** Fig. 13 shows 9 vias inside the EPAD.
- "The ground pads of the chip and surrounding circuit components should make full contact with the ground copper pour rather than being connected via traces."
- A square-grid EPAD with paste in the gaps and vias is described for a *module's* bottom EPAD.

### 2.3 Crystal (§1.4.3, p.24–25)
- Verbatim:
  - "Ensure a complete GND plane for the RF, crystal, and chip."
  - "The crystal should be placed far from the clock pin to avoid interference on the chip. **The gap should be at least 2.0 mm.**"
  - "There should be no vias for the clock input and output traces."
  - "Components in series to the crystal trace should be placed close to the chip side."
  - Load capacitors go "on the two sides of the crystal ... not connected directly to the series components".
  - "It is best not to route any signal trace under the crystal."
  - No magnetic parts nearby.
  - "If there is sufficient ground on the top layer, it is recommended to maintain a keep-out area around the crystal".

### 2.4 RF trace and π-network (§1.4.4, p.24–28)
- 50 Ω, referenced to the layer next to the chip.
- "A CLC matching circuit is required for chip tuning. Please use 0201 components and place them close to the pin in a zigzag".
- **Stub** on the ground pad of the chip-side shunt capacitor: "preferable to keep the stub length 15 mil ... characteristic impedance of the stub is 100 Ω ± 10%. The reference plane is the third layer, so the area under the trace on the second layer should be cleared ... a stub is not required for package types of 0402 and above."
- The RF trace should have consistent width with no branches, be as short as possible, sit on the outer layer with no vias, and use 135° bends or arcs. Keep a complete adjacent ground plane with dense ground vias.
- Verbatim: "the USB port, USB-to-serial chip, UART signal lines (including traces, vias, test points, header pins, etc.) must be as far away from the antenna as possible."
- Verbatim: "For PCB antennas, make sure to validate them through both simulation and real-world testing on a development board. It is recommended to include an additional CLC matching circuit for antenna tuning. Place this circuit as close to the antenna as possible."
- Keep all layers clear under an IPEX connector.

### 2.5 Antenna keep-out
- §1.4.7 (p.28–31, Figs. 24–26) is written for **modules**:
  - Place the antenna feed at the board edge, or outside the board.
  - Do not hollow out all four sides.
  - Fig. 26 labels, in mm: "Min15", "6", "Max 2", "Max 1".
  - Verbatim: **"A clearance of at least 15 mm is recommended in all directions."** (antenna clearance inside the housing)
- **No chip-down-specific antenna keep-out dimensions are given. UNVERIFIED.** The antenna or vendor data has to be used.

### 2.6 Flash/PSRAM routing (§1.4.5, p.28)
- 0 Ω resistors go close to the ESP32-S3. Route SPI on an inner layer such as L3, with ground copper and vias around the clock and data lines separately.
- "Octal SPI traces should have matching lengths."
- **"If the flash and PSRAM are located far from ESP32-S3, it is recommended to place appropriate decoupling capacitors both at VDD_SPI and near the flash and PSRAM power supply."**

### 2.7 UART (§1.4.6): put the U0TXD series resistor near the chip and away from the crystal. Keep the traces short and ground-guarded.

### 2.8 USB (§1.4.8, p.30)
- Verbatim:
  - "Reserve space for resistors and capacitors on the USB traces close to the chip side."
  - **"Use differential pairs and route them in parallel at equal lengths. Maintain a differential pair impedance of 90 Ω with a tolerance of ±10%."**
  - Minimize vias, and if a via is unavoidable "add a pair of ground return vias at each transition point".
  - Keep a continuous ground reference and surround the pair with ground.
- **No maximum length is given. UNVERIFIED.**

---

## 3. Espressif reference schematics: exact values

### 3.1 Module schematics (WDS Fig. 8-1, p.39, sch rev V1.4 dated 2023-11-21; MDS Fig. 8-1, p.39, dated 2023-11-22)
These are the same as the HDG Fig. 1 core, with these differences:

| Function | WROOM-1 (WDS) | MINI-1 (MDS) |
|---|---|---|
| U1 | "ESP32-S3 / ESP32-S3R2 / ESP32-S3R8 / ESP32-S3R16V" | "ESP32-S3FN8" (SPI pins not connected) |
| VDD3P3 (pins 2/3) | C6 10uF, C7 1uF, C8 0.1uF, L1 "2.0nH(0.1nH)", C9 0.1uF | same |
| VDDA | C3 1uF, C2 10nF | same |
| VDD3P3_CPU | C10 0.1uF | same |
| VDD3P3_RTC | C15 0.1uF | same |
| VDD_SPI | C13 0.1uF, C14 1uF (feeds U2 "FLASH" VDD) | C13 0.1uF, C14 1uF |
| Crystal | Y1 40MHz(±10ppm), C1/C4 TBD; **R4 drawn as a resistor valued "0"** on XTAL_P, with note "R4 could be a resistor or inductor, the initial value is suggested to be 24 nH." | same |
| GPIO45 | R1 10K(NC) | same |
| U0TXD | R3 499 | same |
| Flash series R | R16/R15/R10/R14/R13 = 0 (SPICS0 direct) | n/a |
| RF | ANT1 PCB_ANT, "50 ohm Impedance Control"; L3 + C5 shunt (TBD), C11 shunt, L2 series, C12 shunt (TBD) | same |
| Module-level ESD | D1 "ESD" on VDD33 | same |

- WDS §8 text, verbatim: **"For modules with PSRAM, the VDD_SPI voltage is fixed to 3.3 V or 1.8 V via eFuse, so their VDD_SPI voltage will not be affected by the GPIO45 level. However, for other modules, please ensure that GPIO45 is not pulled high when the module is powered up by the external circuit."**
- Flash vendor and part number: **not stated anywhere in WDS. UNVERIFIED.**
  - WREF BOM (2022, 3.3 V era) U2: "2.3 ~ 3.6 V, Standard & Dual & Quad SPI flash, SOP8_1P27_6P6", with no vendor.
  - WDS §6.5 Table 6-8 (p.30) flash VCC: 1.8 V version 1.65 / 1.80 / 2.00 V; 3.3 V version 2.7 / 3.3 / 3.6 V; FC max 80 MHz; 100,000 P/E cycles; 20-year retention. Verbatim: "sourced from the memory vendor datasheet" (vendor not named).

### 3.2 Module reference design BOMs (exact values)
**WREF BOM(V0.8)_ESP32-S3-WROOM-1.xls**, parsed from the binary .xls:
- C2: 10 nF / 10 V (10%) C0201
- C3, C7, C14: 1 uF / 6.3 V (20%) C0201
- C6: 10 uF / 6.3 V (20%) **C0402**
- C8, C9, C10, C13, C15: 0.1 uF / 10 V (10%) C0201
- C1, C4, C5, C11, C12, L2, L3: TBD ("Defined by RF Test")
- **L1: "2.0 nH (0.1 nH), 600 mA" L0201**. In the BOM's "ICs" column this item is mislabelled "Resistor / Chip Resistors".
- R3: 499 Ω (1%) 1/20 W R0201
- **R4: "24 nH (3%), 140 mA" (Inductor) on an R0201 footprint**
- R10, R13, R14, R15, R16: 0 Ω R0201
- D1: "TVS Diode, Bi-Direction, 3.3V" SOD882
- U1: QFN56_0P4_7
- Y1: "40 MHz, ±7 ppm, 15 pF, 100 uW" XTAL3225
- PCB: "4L, 18 mm * 23 mm * 0.8 mm ... 50 Ω impedance control". The PCB drawing in the same zip says 25.50 mm × 18.00 mm (see conflicts).

**MREF BOM(V0.5)** is the same except:
- C8, C9, C10, C13, C15 are 0.1 uF / **6.3 V**.
- L1 is correctly typed as "Inductor".
- U1 is "ESP32-S3FN8/S3FH4R2".
- Y1 is "40 MHz, ±10 ppm, 15 pF, 100 uW".
- PCB is "4L, 15.4 mm * 20.5 mm * 0.8 mm" (the PCB drawing agrees).

### 3.3 Module peripheral schematics (WDS Fig. 9-1 / MDS Fig. 9-1, p.41)
- 3V3: C1 **22uF** and C3 **0.1uF**.
- EN: R1 TBD pull-up and C2 TBD, plus SW1 with C8 0.1uF and R7 0 Ω.
- **USB: USB_D-/USB_D+ through R6/R4 = 0 Ω to IO19/IO20, with C6/C5 "TBD" (grey, NC) to GND.** No ESD on USB.
- 32.768 kHz crystal and its parts are NC (C4/C7 12pF(NC), X1 ESR max 70 kΩ).
- WDS note: "For ESP32-S3-WROOM-1-N16R16V and ESP32-S3-WROOM-1U-N16R16V, IO47/IO48 operates in the 1.8V voltage domain." This note still uses the old name without the "A".

### 3.4 Development boards (DKC V1.1 2022-11-30; DKM V1.0 2021-03-10; same circuit topology)
- **LDO: U2 `SGM2212-3.3XKC3G/TR`** (VIN pin 3, GND/ADJ pin 1, VOUT pins 2 and 4).
  - Input: C7 **10uF/25V(20%)** and C8 **0.1uF/50V(10%)**.
  - Output: C9 **0.1uF/50V(10%)** and C10 **10uF/25V(20%)**.
  - VCC_3V3 → R24 0(1%) → ESP_3V3. Module rail: C1 10uF/25V(20%) and C2 0.1uF/50V(10%).
- **Native USB ("ESP USB:") section:**
  - Micro-USB J4. **D- goes directly to GPIO19 and D+ directly to GPIO20, with no series resistors and no capacitors.**
  - **ESD: D8 (VBUS), D9 (D-), D10 (D+) = `LESD5D5.0CT1G`** to GND.
  - VBUS → **D7 `1N5819HW-7-F`** → VCC_5V. C15 10uF/25V(20%)(NC).
  - The UART bridge section uses the same ESD part (D2–D4) and diode (D1). The bridge is CP2102N-A02-GQFN28.
- CHIP_PU: R5 10K(1%) and C6 1uF/16V(10%).
- Auto-program circuit: Q1/Q2 L8050QLT1G, R10/R12 10K(1%), R8/R13 0 Ω. The truth table is "DTR RTS-->EN IO0".
- Buttons: SW1 (GPIO0) and SW2 (CHIP_PU) NTC013-AT1J-A160T, each with C13/C14 0.1uF (NC).

### 3.5 Chip-level reference design
- Espressif publishes **module** reference designs only, linked from HDG §1.6.1:
  - WROOM-1 V1.3: OrCAD .DSN, PDF schematic, PADS .pcb/.asc and PDF, Gerbers, BOM.
  - MINI-1 V1.1: same set of files.
- These are chip-down designs internally. They are 4-layer, 0.8 mm boards.
- HDG §1.9.1 Terms of Use: they "may be used in product development, including commercial applications" but Espressif trademarks must be removed.
- I found **no separate bare-chip reference design**, and no V1.4 package matching the 2023 datasheet schematic.

---

## 4. ESP32-S3-WROOM-1 ordering row for N16R16VA (WDS v1.8, Table 1-1, p.3; notes p.4)
- Row: **ESP32-S3-WROOM-1-N16R16VA** (note 7): Flash **16 MB (Quad SPI)**, PSRAM **16 MB (Octal SPI)**, ambient **–40 ~ 65 °C**, size **18.0 × 25.5 × 3.1 mm**.
- Note 7, verbatim: **"Please note that the VDD_SPI voltage is 1.8 V for ESP32-S3-WROOM-1-N16R16VA and ESP32-S3-WROOM-1U-N16R16VA only."**
- Note 4: "The modules use PSRAM integrated in the chip's package."
- Note 3: the flash is "80 MHz" maximum by default, with no auto-suspend; contact Espressif for 120 MHz.
- Note 2: "For customization of ... ESP32-S3-WROOM-1U-N16R16VA, please contact us."
- Chip used: WDS Table 3-1 note c (p.12) says "For modules embedded with ESP32-S3R16V, as the VDD_SPI voltage of the ESP32-S3R16V chip is set to 1.8 V ...". The block diagram lists ESP32-S3R16V. CDS Table 1-1 shows ESP32-S3R16V is the only variant with 16 MB PSRAM: in-package 16 MB Octal, **VDD_SPI 1.8 V**, –40~65 °C, chip revision v0.2. So N16R16VA uses **ESP32-S3R16V [inference from these combined statements; no single sentence says it]**.
- Flash voltage: 1.8 V. The flash is powered from VDD_SPI in Fig. 8-1, and VDD_SPI is 1.8 V per note 7.
- Thermal note (p.3): "R8 and R16V series modules operate at –40~65 °C ... if the PSRAM ECC function is enabled, the maximum ambient temperature can be improved to 85 °C, while the usable size of PSRAM will be reduced by 1/16."
- Name history (WDS revision history, p.51–52):
  - v1.4 (2024-11-14): "Renamed module variants ESP32-S3-WROOM-1-N16R16V ... to ESP32-S3-WROOM-1-N16R16VA".
  - The v1.3 (2023-11-24) entry already uses the "VA" name, which is internally inconsistent.
  - **The reason for the "A" suffix is not stated. UNVERIFIED.** No PCN was found.
- **Lifecycle (SEL API, 2026-11-09):** `ESP32-S3-WROOM-1-N16R16VA`: **Mass Production**, releaseTime 2023/11/8, leadTime "12 weeks", SPQ 650 / MOQ 3250.
  - Also listed: `ESP32-S3R16V` **Mass Production** (6 weeks); `ESP32-S3` (plain) **Mass Production** (5 weeks).
  - EOL: ESP32-S3R8V, ESP32-S3R2 (upgraded to S3RH2), ESP32-S3-WROOM-2-N16R8V and N32R8V. CDS v2.2 cover page agrees for R8V and R2.
  - WROOM-1U-N16R16VA is **not listed** in the selector.
  - The datasheet carries no NRND or EOL watermark.

---

## 5. Guidance for boards where native USB is the only programming interface
- **ESP-FAQ (USB)**, entry "What should I pay attention to if I want to use the USB interface of ESP32-C3/ESP32-S3 as the unique download interface of firmware?", verbatim:
  - "DO NOT use USB pins of ... ESP32-S3 (GPIO19 and GPIO20) as other peripheral functions."
  - **"If the USB pins have to be reused as other functions in the application, the BOOT pin (... GPIO0 in ESP32-S3) must be wired to manually enter the chip into the download mode."**
- **ESP-FAQ, empty flash**, verbatim:
  - "if it cannot start normally (due to empty flash, no correct data/firmware in flash, the power-on sequence problem of flash, etc.), the internal timer will trigger the chip to restart every few seconds ... the chip tries to connect to and disconnects from the PC every few seconds."
  - Fixes: **"You need to boot the chip to enter the download mode manually before the first download or after flash is erased"**, or pre-burn stable firmware over UART.
  - **"If there is no strap pin test point reserved for booting manually, you may need to try several times in the initial USB download."**
- **ESP-FAQ, USB-OTG**, verbatim: "If the USB-OTG peripheral is used in the application, the automatic programming function implemented by the USB-Seial-JTAG peripheral will not be available. But you can manually enter the download mode".
- **HDG §1.5 Download Guidelines** (p.35–36):
  - For USB: "If the flash is empty, set the chip or module to Joint Download Boot mode".
  - "The USB auto-download will be disabled if ... USB PHY is disabled by the application; USB is configured for other USB functions, e.g., USB host, USB standard device; USB IOs are configured to other peripherals".
  - **"It is recommended that the user retains control of the strapping pins"**
  - **"It is recommended to retain the UART download interface, as the current RF test firmware only supports the UART interface."**
- **IDF-USJ (v6.1)**: "The USB Serial/JTAG Controller is able to put the ESP32-S3 into download mode automatically." Under Limitations: "If the application accidentally reconfigures the USB peripheral pins or disables the USB Serial/JTAG Controller, the device disappears ... you need to manually put the ESP32-S3 into download mode by pulling low GPIO0 and resetting the chip." Deep-sleep and light-sleep also drop the device.
- **IDF-SER (v6.1)**: "If you are flashing for the first time, you need to get the ESP32-S3 into the download mode manually."
- **IDF-OTG (v6.1)**: "When developing applications which use USB peripheral ... using the UART console for flashing and monitoring provides a much better development experience." The internal PHY is the USB-Serial/JTAG's by default. It can be switched permanently to OTG with the USB_PHY_SEL eFuse.
- **TRM v1.8 §33.3.2, Table 33.3-2 (p.1248)**: the CDC-ACM RTS/DTR lines control reset and a "download mode flag". RTS=0/DTR=1 sets the flag; RTS=1/DTR=0 resets the chip. The recommended sequences are in Tables 33.4-3 and 33.4-4 (p.1254).
- **TRM §8.2 (p.536)**: "USB Serial/JTAG Controller can also force the chip into Joint Download Boot mode from SPI Boot mode". The eFuses EFUSE_DIS_FORCE_DOWNLOAD and EFUSE_DIS_DOWNLOAD_MODE disable these paths.
- **esptool Advanced Options**:
  - "--before usb-reset ... Esptool should be able to detect connection through USB-JTAG-Serial."
  - "With USB-Serial/JTAG, the peripheral interprets the RTS serial control signal as a core reset. This reset does not re-sample the boot strapping pins ... --after watchdog-reset can be used".
- **esptool Boot Mode Selection**: with a DTR/RTS auto-reset circuit, "adding a capacitor between the EN pin and GND (in the 1uF-10uF range) is necessary for the reset circuitry to work reliably." This applies to UART-bridge auto-reset.
- **Test-point list**: Espressif gives no explicit list of required test pads (UART0, GPIO0, CHIP_PU). The FAQ refers to a "strap pin test point", and the HDG recommends retaining "control of the strapping pins" and "the UART download interface". **UNVERIFIED**: no official pad list or layout exists.

---

## 6. Conflicts and inconsistencies found
1. **XTAL_P series part.** HDG text and Fig. 1/5 say "inductor of 24 nH", as do WREF and MREF BOMs ("24 nH (3%), 140 mA"). The WDS and MDS 2023 module schematics *draw* R4 as a resistor valued **"0"** but carry a note saying the initial value is 24 nH.
2. **L1 current rating.** HDG Fig. 1 says "500 mA" and the HDG text says "preferably 500 mA and above". The WREF and MREF BOMs say **600 mA**. Both say 2.0 nH (0.1 nH).
3. **Crystal tolerance.** HDG and all schematics say ±10 ppm. The WROOM-1 BOM uses ±7 ppm, a tighter part that still complies.
4. **10 µF at VDD3P3.** HDG §1.4.2 says "place a 10 µF capacitor for each pin" (pins 2 and 3). The same section and Fig. 1 use **one** shared 10 µF (C6) for both pins and the power entrance.
5. **USB series parts.** HDG recommends reserving 22/33 Ω series resistors and NC capacitors. WDS and MDS Fig. 9-1 use 0 Ω with C TBD/NC. DKC and DKM have **no** series parts at all, only ESD diodes.
6. **RF network topology.** HDG Fig. 7 antenna side is C22–L5–C23 (π). The module schematics use an L3+C5 series-LC shunt. Both use a C–L–C π at the chip side. HDG Table 6 lists C12 as "1.8 ~ 1.2 pF", with the range reversed.
7. **WROOM-1 reference package.** BOM V0.8 says the PCB is 18 × 23 mm. The PCB drawing in the same zip and WDS say 18 × 25.5 mm. The downloadable package is V1.3 (2022), older than the V1.4 schematic in WDS (2023) that adds ESP32-S3R16V.
8. **N16R16V vs N16R16VA naming** in WDS, as described in §4. The peripheral-schematic note still says "N16R16V".
9. **esptool espefuse doc labels GPIO45 as "MTDI pin (GPIO45)".** In CDS and WDS, MTDI is GPIO41 and the VDD_SPI strap is GPIO45. The behaviour described in the esptool doc matches the GPIO45 strap. The same doc says `set-flash-voltage 1.8V` burns VDD_SPI_FORCE + VDD_SPI_XPD, while HDG and CDS tables mention only FORCE and TIEH. TRM lists all three eFuses.
10. **CDS strapping figure label.** CDS Fig. 3-1 labels the threshold "VIH_nRST", while WDS Fig. 4-1 uses "VIL_nRST". This is cosmetic.

## 7. Design-relevant caveats for the dongle
- **Shared footprint is supported.** CDS §7 (p.77), verbatim: "All ESP32-S3 chip variants have identical land pattern ... except ESP32-S3FH4R2 has a bigger EPAD." The CDS nomenclature (Fig. 1-1, p.13) says the "V" suffix means **"1.8 V external SPI flash only"**.
- **GPIO45 on the no-PSRAM build [inference from HDG Table 1 / CDS Table 3-4 / WDS §8].** The plain ESP32-S3 build with 1.8 V flash needs GPIO45 = 1 at every reset (R1 10K pull-up populated, as in HDG Fig. 2), or VDD_SPI_FORCE plus 1.8 V eFuses. The default GPIO45 pull-down gives 3.3 V on VDD_SPI, which would over-volt a 1.8 V flash (spec 1.65–2.00 V, WDS Table 6-8). On R16V the VDD_SPI is "set to 1.8 V" (CDS p.18), so GPIO45 is ignored. A populated R1 therefore suits both builds.
- **eFuse burning voltage.** If eFuses are burned (for example set-flash-voltage), keep VDD3P3_CPU ≤ 3.3 V (CDS Table 5-2 note 3). A USB-powered 3.3 V LDO usually meets this, but check its tolerance.
- **1.8 V regulator budget.** The 1.8 V VDD_SPI regulator is **40 mA typical** (HDG; CDS Table 5-3). On R16V it powers the in-package 16 MB PSRAM and the external flash. The N16R16VA module does exactly this, so it is an Espressif-shipped configuration, but no worst-case current figure was found. UNVERIFIED margin.
- **GPIO33–37, 47, 48.** On R16V these are tied to the octal PSRAM or the 1.8 V domain. On plain ESP32-S3 their supply depends on eFuse or register settings. **[inference]** Avoid using them on a board that must accept both chips.
- **Temperature.** R16V and N16R16VA are rated **–40~65 °C ambient** (85 °C only with PSRAM ECC and 1/16 capacity loss). This matters inside a plastic case plugged into a warm host.
- **Width vs. Espressif antennas [inference from dimensions].** Espressif's own PCB antennas sit on 18 mm (WROOM-1) and 15.4 mm (MINI-1) wide boards, both wider than 14 mm. A different antenna design and its own matching or validation is needed. The HDG gives no chip-down antenna keep-out, and recommends a CLC tuning network at the antenna plus ≥15 mm clearance inside the housing.
- **RF component values are not published.** The chip-side π starting ranges (C 1.2–1.8 pF, L 2.0–3.0 nH) apply only if the HDG layout and stack-up are followed. Everything else is "Defined by RF Test", which needs a VNA.
- **Crystal tuning needs UART.** Load-capacitor tuning uses the Certification and Test Tool in TX tone mode, and "RF test firmware only supports the UART interface" (HDG §1.5). **[inference]** Expose U0TXD/U0RXD pads.
- **Blank-flash first programming.** Per FAQ, HDG and IDF, blank flash needs GPIO0 held low at reset or several retries. Provide a GPIO0 pad or button and a CHIP_PU pad. **[inference]** If firmware uses USB-OTG (TinyUSB HID, MSC or CDC), auto-download over USB is lost (FAQ), so GPIO0 access becomes mandatory.
- **Plug cycling.** HDG names "Frequent power on/off operations" as a case where the 10k/1µF RC may be insufficient and suggests a reset supervisor with a threshold around 3.0 V. A USB dongle is plugged and unplugged often.
- **Not checked here (out of R2 scope):** JLCPCB/LCSC availability of SGM2212-3.3XKC3G/TR, LESD5D5.0CT1G and 1N5819HW-7-F; ESP-IDF version support for R16V; the errata.

## 8. Local artifacts (scratchpad)
- PDFs: `/private/tmp/claude-501/-Users-athul-Workspace-Poytle-esp-s3-dongle/8a5133a7-8352-4435-aa04-cab7a74cb041/scratchpad/r2/{hdg_pdf,chip_ds,wroom1_ds,mini1_ds,trm,devkitc_sch_20221130,devkitc_sch_20220413,devkitm_sch}/`
- Extracted reference designs: `.../scratchpad/r2/wroom1_refdes_x/`, `.../scratchpad/r2/mini1_refdes_x/`
- Extracted text: `.../scratchpad/r2/text/`
- Rendered and cropped figures: `.../scratchpad/r2/crops/`
- HDG figure PNGs: `.../scratchpad/r2/hdg_img/`
- Selector JSON: `.../scratchpad/r2/selector_api/products.json`
