# R6 — Firmware / USB facts for the dual-plug ESP32-S3 dongle

Research date: 2026-11-09. Every fact below was taken from a primary source that was fetched and read in this session (no build, no clone; individual files only). Anything that could not be confirmed is marked **UNVERIFIED**. Conflicts are marked **CONFLICT**.

---

## 0. Versions and sources used

| Item | Version / commit | How determined |
|---|---|---|
| ESP-IDF (latest stable) | **v6.1**, tag commit `fff9895c82d744c7237be8847347bdd1b07c6643`, released 2026-08-27 | `gh api repos/espressif/esp-idf/releases/latest`. Other maintained releases: v6.0.3 (2026-09-02), v5.5.6 (2026-10-16). |
| esp_tinyusb (latest) | **3.0.0**, published 2026-10-20 to the component registry. Source: `espressif/esp-usb` commit `68bf7f9613dbb1a31094fdb903209ae3e4bf388d`, path `device/esp_tinyusb` (from the archive's `idf_component.yml` `repository_info`) | Registry API; archive downloaded. The archive files were diffed against the GitHub commit and are identical (tinyusb.c, usb_descriptors.c, descriptors_control.c, include/tinyusb.h). Latest 2.x is 2.4.0 (2026-10-05). |
| TinyUSB bundled in esp_tinyusb 3.0.0 | **0.21.0~2**, `espressif/tinyusb` @ `894ea01409e0407a7dbe0ee29b2d58a4691f9046` (git submodule) | esp-usb tree at 68bf7f9 (submodule entry); `tusb_option.h` L32-34 (0.21.0). hid_device.c was diffed against that commit and is identical. |
| esptool | **v5.6.0** (2026-10-15). The legacy line v4.13.0 was released 2026-11-03. | GitHub releases |
| esp-pylib (holds esptool's reset sequences) | v1.2.1 | GitHub tags |
| Arduino-ESP32 | **3.3.12** (2026-09-18). 4.0.0-RC1 is a pre-release. | GitHub releases |
| espressif/usb-pids | main @ `888907545d5cf8e9d9411c57d3c05efe42dde38e` (2026-11-06) | GitHub API |
| ESP32-S3 Technical Reference Manual | **v1.8** (PDF, https://documentation.espressif.com/esp32-s3_technical_reference_manual_en.pdf). PDF page numbers equal the printed page numbers. | Downloaded; text extracted with macOS PDFKit |
| ESP32-S3 Datasheet | **v2.2** (2026-03-05) | Downloaded |
| ESP32-S3 errata | esp-chip-errata web "latest", built from commit `0875216` | HTML fetched |
| Security advisory AR2022-004 | V1.1 (2022-12-21) | PDF fetched |
| OpenOCD-esp32 | v0.12.0-esp32-20260831 | GitHub release |
| USB HID 1.11 spec | usb.org hid1_11.pdf (dated 6/27/01) | Downloaded |
| Linux kernel | v7.3, drivers/usb/class/cdc-acm.c | raw GitHub |

URL patterns used below:
- IDF: `https://github.com/espressif/esp-idf/blob/v6.1/<path>#Lx-Ly`
- esp_tinyusb: `https://github.com/espressif/esp-usb/blob/68bf7f9613dbb1a31094fdb903209ae3e4bf388d/device/esp_tinyusb/<file>#L..`
- TinyUSB: `https://github.com/espressif/tinyusb/blob/894ea01409e0407a7dbe0ee29b2d58a4691f9046/src/<path>#L..`
- esptool: `https://github.com/espressif/esptool/blob/v5.6.0/<path>#L..`
- Arduino: `https://github.com/espressif/arduino-esp32/blob/3.3.12/<path>#L..`

---

## Q1. esp_tinyusb on ESP32-S3: HID, HID+CDC, how the PHY is set up, switching at runtime

### 1.1 Component facts
- esp_tinyusb 3.0.0 lists `esp32s3` among its targets and requires `idf >=5.3` (idf_component.yml in the archive).
- The CHANGELOG 3.0.0 breaking changes include:
  - "Removed DCD Slave/IRQ mode. Only Buffer DMA mode is supported."
  - Suspend and resume callbacks are always registered internally. Applications "must not define `tud_suspend_cb()` or `tud_resume_cb()`".
  - `CONFIG_TINYUSB_DESC_SERIAL_STRING` is removed. The default serial number comes from the eFuse MAC.
  - "This release uses TinyUSB 0.21.0~2." (CHANGELOG.md L5-9)
- **Version note:** the IDF v6.1 example `examples/peripherals/usb/device/tusb_hid/main/idf_component.yml` still pins `espressif/esp_tinyusb: version: "^2.0.1~1"`. IDF's own examples are therefore one major version behind esp_tinyusb 3.0.0.
- The USB PHY driver moved between IDF major versions. esp_tinyusb CMakeLists.txt L50-55 says: "For IDF 6.x and later, usb_phy driver is moved from usb to esp_hw_support". In IDF v6.1 the files are `components/esp_hw_support/usb_phy/usb_phy.c` and `components/esp_hw_support/include/esp_private/usb_phy.h`. The header is under **esp_private**, so it is not a public, stable API.

### 1.2 HID support
- esp_tinyusb Kconfig L312-317: `config TINYUSB_HID_COUNT ... range 0 4 ... "Setting value greater than 0 will enable TinyUSB HID feature."` In `tusb_config.h` L248, `#define CFG_TUD_HID CONFIG_TINYUSB_HID_COUNT`.
- esp-usb README L41 says "Support for other USB classes (MIDI, HID, etc.) directly via TinyUSB." README L84 says "Default descriptors are provided for the following USB classes: CDC, MSC, and NCM." No default HID descriptor is provided.
- **Gotcha (descriptors_control.c L204-213):** if `full_speed_config == NULL` and CDC, MSC, MTP or NCM is enabled, the driver logs "No Full-speed configuration descriptor provided, using default." and uses the **CDC/MSC default configuration descriptor**. A HID interface enabled in Kconfig would then be silently missing. With HID only, it fails with "Full-speed configuration descriptor must be provided for this device". For HID or HID+CDC you must always pass `tinyusb_config_t.descriptor.full_speed_config`.
- IDF v6.1 ships the example `tusb_hid`. It uses **one** HID interface carrying keyboard and mouse with report IDs (`TUD_HID_REPORT_DESC_KEYBOARD(HID_REPORT_ID(...))`, L35-36) and `TUD_HID_DESCRIPTOR(0, 4, false, ...)` (L61), where `false` means boot protocol NONE. That layout is not usable by a boot device (see Q7).

### 1.3 Composite HID + CDC-ACM
- `TUD_CDC_DESCRIPTOR` emits an Interface Association Descriptor first (TinyUSB usbd.h L262-264): `8, TUSB_DESC_INTERFACE_ASSOCIATION, _itfnum, 2, TUSB_CLASS_CDC, CDC_COMM_SUBCLASS_ABSTRACT_CONTROL_MODEL, CDC_COMM_PROTOCOL_NONE, 0`.
- The esp_tinyusb default device descriptor uses IAD class codes when CDC is enabled (usb_descriptors.c L32-37): "Use Interface Association Descriptor (IAD) for CDC ... `.bDeviceClass = TUSB_CLASS_MISC, .bDeviceSubClass = MISC_SUBCLASS_COMMON, .bDeviceProtocol = MISC_PROTOCOL_IAD`".
- tinyusb.h L132-134: "When supplying a custom composite device descriptor with an Interface Association Descriptor, keep `bDeviceClass` as `TUSB_CLASS_MISC` and `bDeviceSubClass` as `MISC_SUBCLASS_COMMON`."
- CDC count is 1-2 (Kconfig L269-275).

### 1.4 How esp_tinyusb configures the PHY
- tinyusb.c L275-302: when `!config->phy.skip_setup`, it builds `usb_phy_config_t phy_conf = { .controller = USB_PHY_CTRL_OTG, .target = USB_PHY_TARGET_INT, .otg_mode = USB_OTG_MODE_DEVICE, .otg_speed = USB_PHY_SPEED_FULL }`. If `self_powered` is set it adds `otg_io_conf = USB_PHY_SELF_POWERED_DEVICE(vbus_monitor_io)`, then calls `usb_new_phy(&phy_conf, &phy_hdl)`.
- `usb_phy.h` (IDF v6.1) L23-39:
  - `USB_PHY_TARGET_INT` = "internal FSLS PHY"; also `USB_PHY_TARGET_UTMI` and `USB_PHY_TARGET_EXT`.
  - `USB_PHY_CTRL_OTG`; and `USB_PHY_CTRL_SERIAL_JTAG`, which exists only under `#if SOC_USB_SERIAL_JTAG_SUPPORTED`. ESP32-S3 sets `SOC_USB_SERIAL_JTAG_SUPPORTED 1` (soc_caps.h L56).
  - L44-49: `USB_PHY_MODE_DEFAULT = 0`, `USB_OTG_MODE_HOST`, `USB_OTG_MODE_DEVICE`.
- What `usb_new_phy()` does in IDF v6.1 (usb_phy.c):
  - L280-294: only one handle can exist per PHY target. A second request fails with `ESP_ERR_INVALID_STATE` "selected PHY is in use".
  - L300-305: for a non-UTMI target it calls `usb_wrap_hal_init()`. That enables the USB_WRAP bus clock, pulses its reset and enables automatic PHY clock control (usb_wrap_hal.c L9-18). This runs for **both** controllers.
  - L318-322, controller OTG: `usb_wrap_hal_phy_set_external(&wrap_hal, target==EXT)`. For the internal PHY this leads to `usb_wrap_ll_phy_enable_external(hw,false)` plus `usb_wrap_ll_phy_enable_pad(hw,true)` (usb_wrap_hal.c L25-35). usb_wrap_ll.h L55-66 then writes `hw->otg_conf.phy_sel = enable; RTCCNTL.usb_conf.sw_hw_usb_phy_sel = 1; RTCCNTL.usb_conf.sw_usb_phy_sel = !enable;` The comment there reads: "1 - Internal USB FSLS PHY is mapped to the USB Wrap. USJ mapped to external PHY".
  - L323-328, controller SERIAL_JTAG (guarded by `SOC_USB_SERIAL_JTAG_SUPPORTED && USB_SERIAL_JTAG_LL_EXT_PHY_SUPPORTED`; S3 defines `USB_SERIAL_JTAG_LL_EXT_PHY_SUPPORTED 1` in usb_serial_jtag_ll.h L21): `usb_serial_jtag_hal_phy_set_external(NULL, target==EXT)`. For the internal PHY this leads to `usb_serial_jtag_ll_phy_enable_external(false)` plus `usb_serial_jtag_ll_phy_enable_pad(true)` (usb_serial_jtag_hal.c L18-28). usb_serial_jtag_ll.h L209-220 writes `USB_SERIAL_JTAG.conf0.phy_sel = enable; RTCCNTL.usb_conf.sw_hw_usb_phy_sel = 1; RTCCNTL.usb_conf.sw_usb_phy_sel = enable;` The comment reads: "0 - Internal USB FSLS PHY is mapped to the USJ".
  - L331-335: sets drive strength 3 on D+ and D- for the internal PHY.
  - **L345-347 gotcha:** `if (config->otg_mode != USB_PHY_MODE_DEFAULT) ESP_ERROR_CHECK(usb_phy_otg_set_mode(...))`. `usb_phy_otg_set_mode` returns `ESP_FAIL` when the controller is not OTG (L137: "phy source is not USB_OTG"). The SERIAL_JTAG config must therefore leave `otg_mode = USB_PHY_MODE_DEFAULT`, otherwise `ESP_ERROR_CHECK` aborts.
- The TRM confirms the hardware mux. TRM v1.8 §32.3.1 (p.1229): "In default, internal transceiver is connected to USB Serial/JTAG. When RTC_CNTL_SW_HW_USB_PHY_SEL_CFG is 0, the connection of internal transceiver is controlled by efuse bit EFUSE_USB_PHY_SEL ... When RTC_CNTL_SW_HW_USB_PHY_SEL_CFG is 1, the connection switching is controlled by RTC_CNTL_SW_USB_PHY_SEL_CFG (it has the same meaning with EFUSE_USB_PHY_SEL)."
  - Register 10.56 RTC_CNTL_RTC_USB_CONF_REG (0x0120), p.626-627: "RTC_CNTL_SW_USB_PHY_SEL Set this bit to allow USB OTG to use the internal USB transceiver. Clear this bit to allow USB-Serial-JTAG to use the internal USB transceiver. This field is valid when RTC_CNTL_SW_HW_USB_PHY_SEL is set." and "RTC_CNTL_SW_HW_USB_PHY_SEL Set this bit to control the internal USB transceiver selection via software ... Clear this bit to control ... via hardware (eFuse)." Both reset to 0.
  - IDF header rtc_cntl_reg.h L3071-3080: `RTC_CNTL_USB_CONF_REG (DR_REG_RTCCNTL_BASE + 0x120)`; `RTC_CNTL_SW_HW_USB_PHY_SEL (BIT(20))`, default 0; `RTC_CNTL_SW_USB_PHY_SEL (BIT(19))`, default 0.

### 1.5 Can the app switch the internal PHY from OTG back to USB-Serial/JTAG at runtime? Yes, with caveats
- Path A (esp_private API):
  1. `tinyusb_driver_uninstall()` (tinyusb.c L349-365). It stops the task and runs `tusb_deinit`, which calls `tud_deinit`, which does `dcd_int_disable; dcd_disconnect; dcd_deinit` (TinyUSB usbd.c L604-616; dcd_dwc2.c L531-535 `dcd_disconnect(); dwc2_core_deinit()`). It then calls `usb_del_phy(s_ctx.phy_hdl)`. Do **not** call `usb_del_phy` yourself on top of this.
  2. `usb_new_phy(&(usb_phy_config_t){ .controller = USB_PHY_CTRL_SERIAL_JTAG, .target = USB_PHY_TARGET_INT }, &h)`, leaving `otg_mode` at DEFAULT.
- Path B (public API): `usb_serial_jtag_driver_install()`. In IDF v6.1 `components/esp_driver_usb_serial_jtag/src/usb_serial_jtag.c` L200-208 it enables the USJ bus clock, calls `usb_serial_jtag_ll_phy_enable_external(false); // Use internal PHY` and `usb_serial_jtag_ll_phy_enable_pad(true);`. That re-routes the mux to USJ through the same RTC bits. It bypasses the usb_phy bookkeeping, so TinyUSB must be uninstalled first; otherwise it simply takes the PHY away from OTG.
- History and evidence:
  - esp-idf issue #9826 (closed 2023-09-13). The workaround found there was `usb_del_phy(...)` followed by `usb_new_phy({.controller = USB_PHY_CTRL_SERIAL_JTAG})`. That led to `tinyusb_driver_uninstall()` (idf-extra-components PR #229; esp_tinyusb 1.4.1).
  - esp-idf issue #15912 (IDFGH-15248, closed 2025-05-15): "ESP-IDF v5.3.3 TinyUSB can't be switched back to USB/JTAG (regression since 5.3.2)". The `USB_PHY_CTRL_SERIAL_JTAG` branch had been removed from `usb_new_phy` in a refactor. It was restored by commit c9c8560169460f94b6f7c7c204f102298c4c7afb (PR #15932). The Espressif collaborator wrote: "Indeed, I did not test this case when I was cleaning-up the PHY driver."
  - v6.1 contains the branch (usb_phy.c L323-328, verified above).
  - **Test coverage:** the IDF v6.1 PHY test app (`components/esp_hw_support/test_apps/usb_phy/main/test_app_main.c`) has **no** `USB_PHY_CTRL_SERIAL_JTAG` test case, so this path could regress again.
  - In #15912 a user (jrahlf) reported that on Windows "the switching actually worked, but the PC would not re-enumerate the device". This is a host-side re-enumeration risk.

### 1.6 What `usb_del_phy()` restores (IDF v6.1 usb_phy.c L366-409)
- L392-399 decrements the refcount. For the INT target it calls `usb_wrap_hal_phy_disable_pull_override()`, which is just `hw->otg_conf.pad_pull_override = 0` (usb_wrap_ll.h L129-132), then frees the handle.
- L366-385 `phy_uninstall()`: when the refcount reaches 0 it calls `usb_wrap_hal_disable()`, which is `_usb_wrap_ll_enable_bus_clock(false)` (usb_wrap_hal.c L20-23; usb_wrap_ll.h L232-235 `SYSTEM.perip_clk_en0.usb_clk_en = clk_en`). The code comment says "Disable USB peripheral without reset the module".
- **It does NOT restore** `RTCCNTL.usb_conf.sw_hw_usb_phy_sel` or `sw_usb_phy_sel`, so the internal PHY stays routed to OTG/USB_WRAP. It does not clear `otg_conf.pad_enable` and does not re-enable USJ.
- **CONFLICT (comment vs code):** usb_phy.c L397 says "Clear pullup and pulldown loads on D+ / D-, and disable the pads", but only the pull override is cleared.
- This matches #9826, where johnboiles reported that "`usb_del_phy` before reboot" did not bring USJ back.

---

## Q2. PHY selection across esp_restart, watchdog and panic resets

### 2.1 Reset levels (TRM v1.8 §7.1, p.526-528)
- "CPU Reset: only resets CPUx core." "Core Reset: resets the whole digital system except RTC, including CPU0, CPU1, peripherals, Wi-Fi, Bluetooth LE (BLE), and digital GPIOs." "System Reset: resets the whole digital system, including RTC." "Chip Reset: resets the whole chip."
- Table 7.1-1, by reset type:
  - Chip reset: 0x01 (power-on, brown-out or Super WDT).
  - Brown-out (0x0F): chip or system reset.
  - System reset: RWDT system reset (0x10), Super Watchdog (0x12), clock GLITCH (0x13).
  - Core reset: software system reset `RTC_CNTL_SW_SYS_RST` (0x03), deep-sleep (0x05), MWDT0 or MWDT1 core reset (0x07, 0x08), RWDT core reset (0x09), eFuse (0x14), "**USB (UART) reset**" (0x15, "Triggered when external USB host sends a specific command to the Serial interface of USB-Serial-JTAG"), USB (JTAG) reset (0x16).
  - CPU reset: MWDT0 CPU reset (0x0B), "**Software CPUx reset**" (0x0C, `RTC_CNTL_SW_PROCPU/APPCPU_RST`), RWDT CPU reset (0x0D), MWDT1 CPU reset (0x11).
- IDF soc/esp32s3/include/soc/reset_reasons.h L17-27 uses the same definitions, for example "Core Reset: Reset the whole digital system except RTC sub-system"; L48 `RESET_REASON_CPU0_SW = 0x0C`; L59-60 `RESET_REASON_CORE_USB_UART = 0x15`, `RESET_REASON_CORE_USB_JTAG = 0x16`.
- The mux bits live in the RTC_CNTL block (TRM Chapter 10 "Low-power Management (RTC_CNTL)", Reg 10.56). They are therefore cleared only by **System** or **Chip** reset.
  - **Inference:** the TRM does not give a per-register reset-domain table. The conclusion rests on the register being in RTC_CNTL plus the reset-level definitions, and it is consistent with the observed behaviour in #9826.

### 2.2 What `esp_restart()`, panic and watchdogs do in IDF v6.1
- `esp_restart()` (components/esp_system/esp_system.c L40-57) runs the shutdown handlers in reverse order, suspends the scheduler and calls `esp_restart_noos()`.
- `esp_restart_noos()` for S3 (components/esp_system/port/soc/esp32s3/system_internal.c L75-172):
  - It arms the RWDT: stage 0 `WDT_STAGE_ACTION_RESET_SYSTEM` after 1 s, stage 1 `WDT_STAGE_ACTION_RESET_RTC` after 1 s (L80-91).
  - It calls `esp_system_reset_modules_on_exit()` (L37-69). That resets wifi/bt, timers, SPI01, UART, systimer, PWM, DMA, crypto, SDIO host and EDMA. **It does not touch USB-OTG, USJ or RTC_CNTL_USB_CONF.**
  - It then calls `esp_rom_software_reset_cpu(1); esp_rom_software_reset_cpu(0);` (L154-160), which is a **CPU reset**.
- esp_system.h L71-79: "After successful restart, CPU reset reason will be SW_CPU_RESET. Peripherals (except for Wi-Fi, BT, UART0, SPI1, and legacy timers) are not reset."
- misc_system_api.rst L12-14: `esp_register_shutdown_handler` routines are "automatically called before a restart (that is triggered by `esp_restart`)".
- Panic: `panic_restart()` (components/esp_system/port/panic_handler.c L310-319) calls `esp_restart_noos()` directly. Shutdown handlers are **not** run, and the result is a CPU reset.
- wdt_types.h (components/esp_hal_wdt/include/hal/wdt_types.h L41-42):
  - `WDT_STAGE_ACTION_RESET_SYSTEM`: "... The RTC is an exception and will not be reset."
  - `WDT_STAGE_ACTION_RESET_RTC`: "Reset the main system and the RTC ... ONLY AVAILABLE FOR RWDT".
- No code on the restart path, the 2nd-stage bootloader or app startup rewrites the mux:
  - I read system_internal.c, cpu_start.c, bootloader_esp32s3.c and bootloader_console.c at v6.1. `bootloader_console.c` touches the USB_WRAP routing only for `CONFIG_ESP_CONSOLE_USB_CDC` (L129-131: "Ensure that the USB FSLS PHY is mapped to the USB WRAP").
  - A GitHub code search of esp-idf (master) for `sw_usb_phy_sel`, `SW_USB_PHY_SEL`, `sw_hw_usb_phy_sel` and `RTC_CNTL_USB_CONF_REG` returns only register headers and the S3 HAL headers `usb_wrap_ll.h` and `usb_serial_jtag_ll.h`.
- App startup does reset the OTG block. In components/esp_system/port/soc/esp32s3/clk.c `esp_perip_clk_init()`, L302-311 adds `SYSTEM_USB_CLK_EN` to the "Reset the communication peripherals ..." mask, and L332-333 clock-gates it and asserts reset. That removes any stale OTG device, but the mux is not changed.

### 2.3 Answer
- After `esp_restart()`, a panic, a task or interrupt WDT panic, MWDT CPU or core resets, an RWDT core reset, or a USB-UART/JTAG reset, the RTC mux bits persist. If the app had routed the PHY to OTG, the **ROM and 2nd-stage bootloader run with the internal PHY still on OTG, and USB-Serial/JTAG is NOT available** to them.
- Only system or chip resets restore the eFuse-default routing (USJ): power-on, brown-out, RWDT stage-1 system reset, Super WDT, or glitch.
- Espressif's position in #9826, from tore-espressif (collaborator), 2023-09-05: "The restart behavior you see is actually intentional. If a user wants to perform a software reset, he usually does not want to re-enumerate as different device (JTAG debug) during the process. Moreover, changing this would be a functional breaking change". The reporter observed: "When the TinyUSB has been loaded once, calling esp_reset() or forcing a watchdog reset does not make the device to be recognized as USB-JTAG any more. Only when the reset button is pressed..."
- Arduino-ESP32 confirms the same behaviour in practice. Before rebooting into the ROM bootloader on S3 it explicitly restores USJ (see Q4.4).

---

## Q3. Boot-time behaviour with default eFuses, and ways to hide USJ from the Type-A host

### 3.1 USJ owns the PHY at power-on and enumerates before the app runs
- TRM §32.3.1 (p.1229): "In default, internal transceiver is connected to USB Serial/JTAG."
- TRM §33.4.1 (p.1252) Table 33.4-1: "USB serial/JTAG on internal PHY only — eFuses: None". Also: "this is mostly relevant for the configuration in download mode and the bootloader as the configuration can be altered at runtime as soon as user code is running."
- espefuse summary for S3 in IDF v6.1 (docs/en/api-reference/system/inc/espefuse_summary_ESP32-S3.rst L167-168): `USB_PHY_SEL ... = internal PHY is assigned to USB Device while external PHY is assigned to USB OTG R/W (0b0)`. Here "USB Device" is the USJ.
- TRM §33.4.2 (p.1253): "the USB hardware is self-initializing and after boot-up, if a host is connected ... data can be exchanged ... without any specific setup".
- TRM §8.3 (p.536): "During the boot process, ROM messages are printed to both UART0 and USB Serial/JTAG controller by default."
- IDF v6.1 Kconfig `USJ_ENABLE_USB_SERIAL_JTAG` (components/esp_driver_usb_serial_jtag/Kconfig L4-15): "The USB-Serial-JTAG module on ESP chips is turned on by default after power-on ... This will disable USB-Serial-JTAG only in the application; it will still be enabled during the bootloader stage ... To disable it completely, you must burn the EFUSE_DIS_USB_SERIAL_JTAG eFuse."
- If this option is n and the console is not on USJ, clk.c L292-299 disables the USJ pad and clock at startup on non-CPU resets.

### 3.2 VID/PID of the USJ: 0x303A:0x1001 (verified, but not from the TRM)
- esp-pylib v1.2.1 `esp_pylib/constants.py` L19 `ESPRESSIF_VID = 0x303A`; L22 `USB_JTAG_SERIAL_PID = 0x1001`.
- esptool v5.6.0 docs/en/esptool/advanced-options.rst L179: "`--port-filter vid=0x303A --port-filter pid=0x1001` matches Espressif USB-Serial/JTAG unit used by multiple chips".
- OpenOCD-esp32 v0.12.0-esp32-20260831 `tcl/interface/esp_usb_jtag.cfg` L3-8: "Espressif builtin USB-JTAG adapter ... `adapter usb vid_pid 0x303a 0x1001`".
- The TRM v1.8 text does not state the VID/PID; I searched for "0x1001" and "303A".
- The USJ cannot be reconfigured. IDF usb-serial-jtag-console.rst L17: "a fixed-function USB device that is implemented entirely in hardware, meaning that it cannot be reconfigured". So its VID/PID and descriptors are fixed.
- The product string "USB JTAG/serial debug unit" appears only in user reports (#15912) and is **UNVERIFIED** from an Espressif document.

### 3.3 Documentation of the disconnect and re-enumeration
- esp-usb docs/en/usb_device.rst L67 (S3): "both controllers share a **single PHY**, which means only one can operate at a time."
- IDF usb-serial-jtag-console.rst L81: "If the application accidentally reconfigures the USB peripheral pins or disables the USB Serial/JTAG Controller, the device disappears from the system."
- #9826 describes the sequence observed by the user: the device enumerates as USB-JTAG, then switches to the TinyUSB device after `tinyusb_driver_install()`.
- esptool reset.py L132-135: "Chips talking over their internal USB peripheral disappear from the bus during reset".
- **UNVERIFIED:** how long the USJ stays visible on the bus, from power-on through ROM and bootloader until the app switches, and whether a given host fully enumerates it within that window. It must be measured on the real board and with the real hosts.

### 3.4 Options so the Type-A host never sees USJ (exact eFuse names from IDF v6.1 components/efuse/esp32s3/esp_efuse_table.csv and TRM Table 5.3-1)

| eFuse (espefuse name / TRM name) | BLK0 bit | Effect (primary-source quote) | Consequence for this design |
|---|---|---|---|
| `USB_PHY_SEL` / EFUSE_USB_PHY_SEL | 121 (csv L165) | csv: "{0: internal PHY is assigned to USB Device while external PHY is assigned to USB OTG; 1: internal PHY is assigned to USB OTG while external PHY is assigned to USB Device}" | At boot, GPIO19/20 belong to OTG, so nothing enumerates until TinyUSB starts (in SPI boot; see UNVERIFIED below). ROM USB download on GPIO19/20 becomes **USB-OTG** (CDC + DFU, PID 0x0009), and the errata below applies. COM mode can still switch the PHY to USJ in software (TRM p.1252: "RTC_CNTL_SW_HW_USB_PHY_SEL can be used to have software override the effect of EFUSE_USB_PHY_SEL"). Table 33.4-1 pairs "USB OTG on internal PHY only" with "EFUSE_USB_PHY_SEL + EFUSE_DIS_USB_JTAG — JTAG on GPIO pins". |
| `DIS_USB_SERIAL_JTAG` (alias `DIS_USB_DEVICE`) | 119 (csv L163) | csv: "Set this bit to disable usb device"; TRM: "Represents whether usb_serial_jtag function is disabled" | Removes USJ entirely, so **COM mode via USJ is impossible**, along with USJ download and JTAG. With USB_PHY_SEL still 0, OTG sits on the external-PHY pads at ROM time, so ROM USB download on GPIO19/20 would be gone (inference). Incompatible with the plan. |
| `DIS_USB_SERIAL_JTAG_DOWNLOAD_MODE` (alias `DIS_USB_DOWNLOAD_MODE`) | 132 | csv: "Set this bit to disable UART download mode through USB" | USJ still enumerates, so it does not solve the problem; it only blocks USJ download. |
| `DIS_USB_OTG_DOWNLOAD_MODE` | 159 (csv L180) | "Set this bit to disable download through USB-OTG" | Relevant if USB_PHY_SEL is used, because it would remove USB download altogether. |
| `DIS_USB_JTAG` | 118 | "disable function of usb switch to jtag" | JTAG only. |
| `DIS_USB_OTG` (alias `DIS_USB`) | 45 | "Set this bit to disable USB function" | Would kill HID. Never burn it. |
| `DIS_DOWNLOAD_MODE` | 128 | "disable download mode (boot_mode[3:0] = 0; 1; 2; 3; 6; 7)" | Kills all ROM download modes. |
| `DIS_FORCE_DOWNLOAD` | 44 | "disable the function that forces chip into download mode" | Kills app-triggered download (Q4.3). |

- All eFuses are irreversible. TRM §5.1 (p.410): "Once an eFuse bit is programmed to 1, it can never be reverted to 0." esptool docs/en/espefuse/burn-efuse-cmd.rst L43: "This is an irreversible operation!" The command is `espefuse burn-efuse USB_PHY_SEL 1` (L6/L26 syntax).
- **Errata USBOTG-4289** ("The USB-OTG Download Function Is Unavailable"; affects v0.0, v0.1 and some batches of v0.2): "For ESP32-S3 series chips manufactured before the Date Code 2219 ... the EFUSE_DIS_USB_OTG_DOWNLOAD_MODE (BLK0 B19[7]) bit of eFuse is set by default and cannot be modified. Therefore, the USB-OTG Download function is unavailable". Fixed for Date Code ≥ 2219, where the bit is "not ... programmed by default".
  - On an older chip, burning USB_PHY_SEL would leave **no** ROM USB download on GPIO19/20.
  - Advisory AR2022-004 V1.1 adds: "the USB OTG Download function will be disabled if any of the EFUSE_ENABLE_SECURITY_DOWNLOAD, EFUSE_DIS_USB_OTG, or EFUSE_DIS_DOWNLOAD_MODE is programmed."
- **Hardware gating** (no eFuse): keep the Type-A D+/D- disconnected (analog switch, with default state set by resistor) until the app has TinyUSB HID running. All recovery paths are kept.
  - TRM §33.4.1 Table 33.4-2 (p.1252-1253) gives a pin hazard. In USB-OTG download mode the ROM sets VP (MTMS = GPIO42), VM (MTDI = GPIO41) and RCV (GPIO21) as inputs, OEN (MTDO = GPIO40) as output HIGH, and VPO (MTCK = GPIO39) and VMO (GPIO38) as outputs LOW. The TRM recommends: "If the USB-OTG Download mode is not needed, it is suggested to disable the USB-OTG Download mode by setting the eFuse bit EFUSE_DIS_USB_OTG_DOWNLOAD_MODE to avoid IO pad state change."
  - The MTxx-to-GPIO mapping is from Datasheet v2.2 p.22.
  - Do not use those pins, or the strapping pins GPIO0/3/45/46 (TRM §8.1), to drive the switch select or OE.
  - **CONFLICT / ambiguity:** the TRM says "when USB-OTG Download mode is enabled, the chip initializes the IO pad ... in ROM when starts up". It is unclear whether this happens on every boot or only in download boot. The table title says "in the USB-OTG Download Mode".
- **Firmware-only mitigation (effectiveness UNVERIFIED):** move the mux away from USJ as early as possible. IDF v6.1 supports 2nd-stage bootloader hooks (examples/custom_bootloader/bootloader_hooks/README.md: "how to add hooks to the 2nd stage bootloader"). That would shrink the USJ window to roughly ROM time. Whether a host still enumerates USJ in that window is unmeasured.

---

## Q4. Flashing and recovery

### 4.1 esptool over USB-Serial/JTAG
- Strategy selection, esptool v5.6.0 esptool/loader.py L849-851: `# USB-JTAG/Serial mode` / `if mode == "usb-reset" or self.get_usb_vid_pid()[1] == self.USB_JTAG_SERIAL_PID: return (USBJTAGSerialReset(self._port),)`. Detection is by PID 0x1001.
- Sequence, esp-pylib v1.2.1 serial_reset.py L367-391, `usb_jtag_bootloader_reset`. Using `PIN_LOW = True` (asserted) and `PIN_HIGH = False`, L27-33, the steps are:
  1. RTS=0, DTR=0 (idle)
  2. DTR=1 ("Set IO0")
  3. RTS=1, then DTR=0 ("Reset ... traverse (1,1) instead of (0,0)")
  4. RTS re-write ("so Windows propagates the DTR change")
  5. DTR=0, RTS=0 ("Chip out of reset")
- TRM semantics, Table 33.3-2 (p.1248): "RTS DTR → 0 0 Clear download mode flag; 0 1 Set download mode flag; 1 0 Reset ESP32-S3; 1 1 No action." Also: "if the download mode flag is set when the ESP32-S3 is reset, the ESP32-S3 will reboot into download mode." Table 33.4-3 (p.1254) gives the recommended sequence. TRM §8.2: "USB Serial/JTAG Controller can also force the chip into Joint Download Boot mode from SPI Boot mode".
- esptool docs advanced-options.rst L46-48: "With USB-Serial/JTAG, the peripheral interprets the RTS serial control signal as a core reset. This reset does not re-sample the boot strapping pins, so a chip that entered download mode manually may remain there."
- IDF usb-serial-jtag-console.rst L59: "The USB Serial/JTAG Controller is able to put the {IDF_TARGET_NAME} into download mode automatically."
- Line coding is ignored by the USJ. TRM Table 33.3-1 (p.1247): "SET_LINE_CODING Accepted but ignored (dummy)"; "GET_LINE_CODING Always returns 9600 baud". A 1200-bps "touch" therefore cannot work on the USJ.
- No register in the S3 USJ header (IDF v6.1 usb_serial_jtag_reg.h) disables the DTR/RTS chip reset. A terminal program that toggles RTS will reset the chip. The TRM (p.1248) only says these functions "can also be disabled by programming various eFuses".

### 4.2 ROM download over USB-OTG
- TRM §8.2 Table 8.2-1 (p.535): Joint Download Boot (GPIO0=0, GPIO46=0) "supports ... USB-Serial-JTAG Download Boot, USB-OTG Download Boot ... UART Download Boot".
- TRM §33.4.1 (p.1252): "while both USB-OTG as well as the USB Serial/JTAG controller allows serial programming, only USB-OTG supports the DFU protocol and only the USB Serial/JTAG controller supports JTAG debugging over USB."
- Selection on GPIO19/20 follows the PHY routing, i.e. the eFuse. IDF v6.1 dfu.rst L16-18 and usb-otg-console.rst L41-43 (S3): "By default, the USB_SERIAL_JTAG module is connected to ... internal USB PHY, while the USB OTG peripheral can be used only if an external USB PHY is connected ... you can permanently switch the internal USB PHY to work with USB OTG peripheral ... by burning the USB_PHY_SEL eFuse."
- PIDs:
  - ROM DFU uses PID 9 (IDF v6.1 tools/cmake/dfu.cmake L10-11 `esp32s3 → set(dfu_pid "9")`).
  - esptool treats VID/PID (0x303A, IMAGE_CHIP_ID) as "USB-OTG" (loader.py L1355-1359), with `IMAGE_CHIP_ID = 9` for S3 (targets/esp32s3.py L17).
- dfu.rst L22: "enabling Secure Boot or flash encryption disables the USB-OTG USB stack in the ROM".
- usb-otg-console.rst L75: initial upload over ROM USB CDC requires "keep GPIO0 low while toggling reset".
- esptool `hard_reset` for USB-OTG (esp32s3.py L359-369) uses an RTC-WDT reset when GPIO0 is strapped low.
- See errata USBOTG-4289 in Q3.
- **UNVERIFIED:** how the ROM arbitrates between UART0, USJ and OTG in Joint Download Boot. Also whether ROM download mode honours a *software* RTC mux override that differs from the eFuse (relevant only if USB_PHY_SEL is burned).

### 4.3 Forcing ROM download from the application
- TRM §8.2 (p.535-536): "EFUSE_DIS_FORCE_DOWNLOAD – If this eFuse is 0 (default), software can force switch the chip from SPI Boot mode to Joint Download Boot mode by setting register RTC_CNTL_FORCE_DOWNLOAD_BOOT and triggering a CPU reset. In this case, hardware overwrites GPIO_STRAPPING[3:2] from "1x" to "00"."
- Register 10.58 RTC_CNTL_RTC_OPTION1_REG (0x012C) (p.628): "RTC_CNTL_FORCE_DOWNLOAD_BOOT Set this bit to force chip enters download boot by sw." It resets to 0.
- IDF header rtc_cntl_reg.h L3209-3212: `RTC_CNTL_OPTION1_REG (DR_REG_RTCCNTL_BASE + 0x12C)`; `RTC_CNTL_FORCE_DOWNLOAD_BOOT (BIT(0))`. esptool esp32s3.py L99-100 uses `RTC_CNTL_OPTION1_REG = 0x6000812C`, mask `0x1`.
- IDF's own use: components/esp_usb_cdc_rom_console/usb_console.c L253-267 `esp_usb_console_before_restart()`: `REG_WRITE(RTC_CNTL_OPTION1_REG, RTC_CNTL_FORCE_DOWNLOAD_BOOT);`, triggered by an RTS falling edge while DTR=1 (L154-167).
- The bit **persists** across non-system resets because it is in RTC_CNTL. esptool clears it in `hard_reset` (esp32s3.py L347-354): "Clear force download boot mode to avoid chip being stuck in download mode after reset. Workaround for issue: https://github.com/espressif/arduino-esp32/issues/6762".
- On S3 the PHY must be routed back to USJ **before** the CPU reset for the ROM to be reachable over USJ (Q2 and Q4.4).

### 4.4 Arduino-ESP32 3.3.12
- boards.txt L1283-1286: `esp32s3.menu.USBMode.hwcdc=Hardware CDC and JTAG` (`build.usb_mode=1`) and `esp32s3.menu.USBMode.default=USB-OTG (TinyUSB)` (`usb_mode=0`). The base default is `esp32s3.build.usb_mode=1` (L1203).
- boards.txt L1303-1308: `UploadMode.default=UART0 / Hardware CDC` has `use_1200bps_touch=false`; `UploadMode.cdc=USB-OTG CDC (TinyUSB)` has `use_1200bps_touch=true` and `wait_for_upload_port=true`.
- cores/esp32/USBCDC.cpp L280-284: "ArduinoIDE sends LineCoding with 1200bps baud to reset the device"; `if (reboot_enable && _bit_rate == 1200) usb_persist_restart(RESTART_BOOTLOADER);`. L216-258 adds an esptool-style DTR/RTS state machine that ends in the same call (L254-256).
- cores/esp32/esp32-hal-tinyusb.c L697-709 `usb_persist_restart()`: registers a shutdown handler, then `#if CONFIG_IDF_TARGET_ESP32S3 if (mode == RESTART_BOOTLOADER) usb_switch_to_cdc_jtag();` and finally `esp_restart()`. The shutdown handler (L659-694) writes `REG_WRITE(RTC_CNTL_OPTION1_REG, RTC_CNTL_FORCE_DOWNLOAD_BOOT)`.
- `usb_switch_to_cdc_jtag()` (L590-655, S3 only) does the following, in order:
  1. `deinit_usb_hal()`, which is `usb_del_phy`.
  2. Resets and disables the USB-OTG module clock.
  3. `CLEAR_PERI_REG_MASK(RTC_CNTL_USB_CONF_REG, (RTC_CNTL_SW_HW_USB_PHY_SEL | RTC_CNTL_SW_USB_PHY_SEL | RTC_CNTL_USB_PAD_ENABLE));`, which hands selection back to the eFuse, i.e. USJ.
  4. Clears `USB_SERIAL_JTAG_PHY_SEL` and the USJ pad enable.
  5. "Force the host to re-enumerate (BUS_RESET)" by driving GPIO19/20 low (open-drain).
  6. Arms the USJ BUS_RESET interrupt, re-enables the USJ pad, and waits up to 1000 ms for the host's bus reset.

---

## Q5. VBUS detection

- tinyusb.h (3.0.0) L42-49 `tinyusb_phy_config_t { bool skip_setup; bool self_powered; int vbus_monitor_io; }`. Default (tinyusb_default_config.h L97-103): `.skip_setup = false, .self_powered = false, .vbus_monitor_io = -1`.
- On S3 the VBUS GPIO is wired through the GPIO matrix to the OTG **BVALID** input:
  - usb_phy.h L65-78: `USB_PHY_SELF_POWERED_DEVICE(vbus_monitor_io)` sets `.bvalid_io_num = vbus_monitor_io` and everything else to -1.
  - usb_phy.c L110-131 / L348-351 configures that pin.
  - Without `self_powered`, device mode forces BVALID=1 (usb_phy.c L173-177).
  - The separate GPIO-ISR VBUS monitor is used only for P4 high-speed and S31 (tinyusb.c L308-329).
- esp-usb docs/en/usb_device.rst (68bf7f9):
  - L254: "VBUS is considered valid if it rises above 4.75 V and invalid if it falls below 4.35 V."
  - L256: "{IDF_TARGET_NAME} pins are 3.3 V tolerant."
  - L259: "Use a resistor voltage divider that outputs (0.75 x Vdd) if VBUS is 4.4 V (see figure below)."
  - L263: "the voltage on the sensing pin must be logic low within 3 ms after the device is unplugged from the USB host."
  - The figure `usb_vbus_voltage_monitor.png` shows only R1/R2 with **no values**.
- esp_tinyusb README L268-269: "VBUS valid range is 4.40 V to 5.25 V at the device port (USB 2.0). ESP pins are not 5 V tolerant ... If using a resistor divider, the divider output should be at least 0.75 * Vdd when VBUS is 4.4 V."
- Datasheet v2.2 Table 5-4 (p.65): "VIH High-level input voltage 0.75 × VDD — VDD + 0.3 V", where "VDD – voltage from a power pin of a respective power domain". Table 5-1: input power pins −0.3 to 3.6 V.
- Design note: only **one** GPIO can drive BVALID. For two plugs, map the active plug's sense pin at TinyUSB install, or just read both pins as plain GPIOs for mode logic. A bus-powered device does not strictly need BVALID monitoring.

---

## Q6. USB VID/PID

- espressif/usb-pids README (888907545d5c):
  - "This is a repository for customer-allocated PIDs under the Espressif VID (0x303A)."
  - "You can use this service if your device contains an Espressif chip with a USB interface and the requested PID is used for that interface."
  - "You would need a custom PID if you use a custom USB class ... If you use e.g. TinyUSB with the standard drivers it comes with, you would not need a custom PID as TinyUSB by default already uses a pre-allocated PID specific to the classes selected."
  - Process: fork, take the **next** PID in `allocated-pids.txt`, open a PR with a description, the chip, why a custom PID is needed, the company name and a URL.
  - Disclaimer: "Espressif reserves the right to deny a pull request ... does not mean endorsment ... does not entitle you to anything".
  - Customer range starts at 0x8000. The last entry is 0x83EB ("Dashu - USB HID keyboard and mouse remote automation tool"). Devboard list is 0x7000+.
- esp_tinyusb defaults:
  - VID `TINYUSB_ESPRESSIF_VID 0x303A` (tinyusb.h L22; Kconfig `TINYUSB_DESC_USE_ESPRESSIF_VID` default y, "helpful at product develop stage").
  - PID `0x4000 | CDC<<0 | MSC<<1 | HID<<2 | MIDI<<3 | AUDIO<<4 | VENDOR<<5 | MTP<<6` (usb_descriptors.c L20-22). With one interface per class that gives HID-only = 0x4004 and HID+CDC = 0x4005.
  - Comment at L13-15: "A combination of interfaces must have a unique product id, since PC will save device driver after the first plug."
  - Custom VID/PID via Kconfig `TINYUSB_DESC_CUSTOM_VID/PID` or your own device descriptor.
- Fixed PIDs to know:
  - USJ = 0x303A:0x1001 (Q3).
  - ROM USB-OTG on S3 = 0x303A:0x0009 (Q4.2).
- Implications:
  - Default 0x4004/0x4005 are shared by every default TinyUSB-on-ESP device.
  - Each interface set the product exposes (HID-only on Type-A; HID or HID+CDC on Type-C) should have its own PID. You can request two PIDs under 0x303A or use your own USB-IF VID.
  - COM mode via USJ will always show as 0x303A:0x1001 and cannot be rebranded.

---

## Q7. HID specifics in TinyUSB, and composite enumeration on the hosts

- Boot interface: `TUD_HID_DESCRIPTOR(_itfnum, _stridx, _boot_protocol, ...)` sets `bInterfaceSubClass = HID_SUBCLASS_BOOT` when `_boot_protocol != HID_ITF_PROTOCOL_NONE` (usbd.h L342-349). The codes are in hid.h: `HID_SUBCLASS_BOOT = 1` (L64), `HID_ITF_PROTOCOL_KEYBOARD = 1`, `HID_ITF_PROTOCOL_MOUSE = 2` (L70-72), `HID_PROTOCOL_BOOT = 0`, `HID_PROTOCOL_REPORT = 1` (L147-148).
- hid_device.c:
  - L254-258: on open, `protocol_mode = HID_PROTOCOL_REPORT; // Per Specs: default is report mode`.
  - L361-373: GET_PROTOCOL and SET_PROTOCOL are handled. SET_PROTOCOL calls the weak `tud_hid_set_protocol_cb(instance, protocol)`. The app reads the mode with `tud_hid_n_get_protocol()` (hid_device.h L61).
  - L113-124: `tud_hid_n_report()` **prepends the report ID whenever it is non-zero, regardless of protocol mode**. The app must send report-ID-free 8-byte boot reports itself.
- USB HID 1.11:
  - §4.2 (PDF p.18): Subclass "1 Boot Interface Subclass" is "for devices requiring BIOS support (Boot Devices)".
  - §7.2.6 (printed p.54): "When initialized, all devices default to report protocol. However the host should not make any assumptions about the device's state and should set the desired protocol whenever initializing a device."
  - Printed p.58: "this interface would not be acceptable for a Boot Device (use separate interfaces for keyboards and mouse devices)."
  - Appendix B (printed p.59): "the first 8 bytes of keyboard reports and the first 3 bytes of mouse reports must conform to the format defined by the Boot Report descriptor ... The report may not exceed 8 bytes in length ... the BIOS does not actually read the Report descriptors".
  - Appendix C (printed p.63): "Boot Keyboards must support the boot protocol and the Set_Protocol request."
- Consequences: use a dedicated boot keyboard interface (subclass 1, protocol 1, no report ID) and, if needed, a separate boot mouse interface. The IDF tusb_hid example (one interface with report IDs) is **not** boot-capable. Custom report descriptors are supplied via `tud_hid_descriptor_report_cb()` (hid_device.h L130).
- Windows:
  - Microsoft Learn "USB Interface Association Descriptor" (ms.date 2024-01-17): "A device descriptor must have the values ... bDeviceClass 0xEF, bDeviceSubClass 0x02, bDeviceProtocol 0x01 or the operating system doesn't detect the device's IADs or group the device's interfaces properly." The page's own example is a composite device with an HID interface (subclass 1, protocol 1).
  - "USB device class drivers included in Windows" (ms.date 2025-06-11): "For composite devices, use USB Generic Parent Driver (Usbccgp.sys)". CDC 02h is handled by Usbser.sys, Windows 10/11: "In Windows 10, Usbser.inf loads Usbser.sys automatically as the function driver". HID 03h is handled by Hidclass.sys/Hidusb.sys.
  - "USB Serial Driver (Usbser.sys)" (2025-06-11) gives compatible IDs `USB\Class_02` and `USB\Class_02&SubClass_02`, and warns that a subclass other than 02 will not auto-load.
- Linux v7.3 drivers/usb/class/cdc-acm.c L2070-2072 matches per interface: "control interfaces without any protocol set ... `USB_INTERFACE_INFO(USB_CLASS_COMM, USB_CDC_SUBCLASS_ACM, USB_CDC_PROTO_NONE)`". TinyUSB's CDC uses `CDC_COMM_PROTOCOL_NONE`.
- macOS: **UNVERIFIED.** No Apple primary document was fetched for HID+CDC composite or IAD support.

---

## Q8. ESP32-S3 OTG endpoint limits and USB errata

- TRM v1.8 §32.2.2 (p.1227): "Endpoint number 0 always present (bi-directional ...)"; "Six additional endpoints (endpoint numbers 1 to 6), configurable as IN or OUT"; "**Maximum of five IN endpoints concurrently active at any time (including EP0 IN)**"; "All OUT endpoints share a single RX FIFO"; "Each IN endpoint has a dedicated TX FIFO".
- TRM §32.3.3 (p.1231): the FIFO SPRAM has "a depth of 256 and a width of 35 bits (32 data bits plus 3 control bits)".
- esp-usb usb_device.rst L26-27: "Endpoint 0 and 6 additional endpoints configurable as IN or OUT — Up to 5 IN endpoints (including Endpoint 0) concurrently active."
- TinyUSB enforces the same limits. dwc2_esp32.h L46-51 (S2/S3) sets `.ep_count = 7, .ep_in_count = 5, .otg_dfifo_depth = 256`, and dcd_dwc2.c L256-257 has `TU_ASSERT(_dcd_data.allocated_epin_count < dwc2_controller->ep_in_count)`.
- Budget: 4 non-EP0 IN endpoints. Boot keyboard IN + boot mouse IN + CDC notification IN + CDC data IN = 4, which is the **maximum**. Any extra HID interface would not fit.
- The USJ itself has "2 OUT Endpoints, 3 IN Endpoints in addition to Control Endpoint 0" (TRM §33.2).
- Errata (esp-chip-errata @0875216, Errata Summary Table 4): the only USB item is **USBOTG-4289** "The USB-OTG Download Function Is Unavailable" (v0.0 Y, v0.1 Y, v0.2 Y\* "some batches"). Details are in Q3. The other S3 errata are Cache, RTC, Analog power, LCD, RMT, Touch and ADC.

---

## UNVERIFIED items and conflicts (summary)
1. UNVERIFIED: whether the ROM ever rewrites RTC_CNTL_USB_CONF. No ROM source exists. The evidence (#9826; Arduino explicitly clearing the bits) says it does not in SPI boot.
2. UNVERIFIED: whether ROM download mode honours a software mux override that contradicts the eFuse. This matters only if USB_PHY_SEL is burned. Bench-test before burning.
3. UNVERIFIED: time from power-on to app mux switch, and whether hosts enumerate USJ in that window. Measure on the board.
4. UNVERIFIED: ROM arbitration between UART0, USJ and OTG in Joint Download Boot.
5. UNVERIFIED: macOS composite behaviour; the USJ product string; host re-enumeration reliability after a runtime OTG-to-USJ switch (one user reports Windows failing to re-enumerate).
6. UNVERIFIED (inference): with only DIS_USB_SERIAL_JTAG burned, nothing pulls D+ at boot.
7. CONFLICT: usb_phy.c L397 comment ("disable the pads") vs code (only the pull override is cleared).
8. CONFLICT (minor): TRM Table 7.1-1 lists Super Watchdog as System Reset (0x12), while footnote 1 says SWD can trigger a Chip Reset. reset_reasons.h has both 0x01 and 0x12.
9. Ambiguity: TRM §33.4.1 ROM external-PHY pad init "when USB-OTG Download mode is enabled ... when starts up". The table title limits it to download mode.
10. Doc vs code (minor): esp_system.h says peripherals other than Wi-Fi/BT/UART0/SPI1/legacy timers are not reset, but the S3 `esp_system_reset_modules_on_exit()` also resets timers, systimer, PWM, DMA and crypto. Neither touches the USB mux.
11. Version skew: the IDF v6.1 examples pin esp_tinyusb ^2.0.1~1, while the latest is 3.0.0 with breaking changes.

---

## Recommended firmware architecture

**Principle:** USB mode is chosen once per boot, from the VBUS sense GPIOs plus a stored setting. The app always writes the mux explicitly, because RTC state survives software resets. Runtime mode changes go through a restart.

1. **Early boot** (app `app_main` start, or optionally a 2nd-stage bootloader hook if A-side USJ exposure must be minimised):
   - Read `esp_reset_reason()`, a boot-loop counter in `RTC_NOINIT_ATTR` memory, and both VBUS sense GPIOs (debounced). The sense GPIOs should use dividers giving ≥0.75·VDD at 4.4 V and ≤3.6 V at the maximum VBUS, and must avoid GPIO0/3/45/46 and GPIO21/38-42.
   - Read the stored C-port mode from NVS.
2. **Decision:**
   - **VBUS-A present → HID** on Type-A, always, ignoring the stored COM setting. If an analog switch is fitted, select A only after `tinyusb_driver_install()` has succeeded.
   - **VBUS-C only and (stored COM, or failsafe active) → COM mode via USJ.** Do not install TinyUSB. Call `usb_serial_jtag_driver_install()`, which also forces the mux to USJ through RTC_CNTL (`sw_hw_usb_phy_sel=1, sw_usb_phy_sel=0`) and enables the pad. Use the driver read/write calls for the serial channel. esptool flashing then works natively.
   - **VBUS-C only and stored HID → HID** via TinyUSB, which routes the mux to OTG.
   - **Both VBUS present** → a policy decision. Suggest A wins (HID) and the C data path is disconnected if a switch exists.
3. **Mode change requests:**
   - HID → COM, triggered by a vendor HID feature report or a key or LED sequence: write NVS, then `esp_restart()`. Do the switch-back in the next boot (step 2).
   - COM → HID, triggered by a serial command: write NVS, then `esp_restart()`.
   - Avoid live switching, but it is possible: `tinyusb_driver_uninstall()`, wait ≥100 ms (UNVERIFIED value; measure), then `usb_new_phy(SERIAL_JTAG, INT, otg_mode=DEFAULT)` or `usb_serial_jtag_driver_install()`. Optionally drive SE0 the way Arduino does.
4. **Enter ROM bootloader from HID mode (Type-C only):**
   1. `tinyusb_driver_uninstall()`.
   2. Route the mux to USJ: clear `RTC_CNTL_SW_HW_USB_PHY_SEL` and `SW_USB_PHY_SEL` as Arduino does, or `usb_serial_jtag_driver_install()`.
   3. `REG_WRITE(RTC_CNTL_OPTION1_REG, RTC_CNTL_FORCE_DOWNLOAD_BOOT)`.
   4. `esp_restart()`.
   esptool clears the flag on its hard reset. A power cycle also clears it, as a chip reset.
5. **Failsafe:**
   - Increment the RTC boot-loop counter at boot and clear it after N seconds of healthy run.
   - If the counter is ≥3 with panic or WDT reset reasons **and** only VBUS-C is present, boot into COM/USJ mode without TinyUSB, so a crashing HID build can still be reflashed over Type-C.
   - Hardware last resort: a GPIO0 pad. Pull it low during power-up to get ROM download over USJ, on the C path.
6. **Config:**
   - Keep `CONFIG_USJ_ENABLE_USB_SERIAL_JTAG=y`.
   - Prefer a UART or no console. Do not rely on a USJ console in HID mode; the USJ docs warn of a one-time 50 ms stall when its buffer fills.
   - Pin IDF v6.1 and esp_tinyusb (3.0.0, or 2.4.x to match the IDF examples).
   - Supply your own device descriptor and configuration descriptor (boot keyboard, optional boot mouse; HID+CDC only if a composite is actually wanted). Use your own PIDs.
7. **eFuses:** burn none by default. Burning USB_PHY_SEL is the only eFuse route to "A never sees USJ" without a switch. Do it only after bench-proving the recovery flow and checking chip Date Code ≥ 2219.

## Risks
- **R1 Private API.** `esp_private/usb_phy.h` moved in IDF 6.0, and the SERIAL_JTAG path regressed in 5.3.3 (#15912) with no test coverage in v6.1. Pin versions and add a hardware-in-the-loop test of HID→COM→esptool.
- **R2 Persistent mux.** After any CPU or core reset in HID mode, ROM and bootloader have no USJ. Recovery depends on app logic, a power cycle, or GPIO0.
- **R3 Transient USJ on Type-A at power-up** with default eFuses and parallel wiring. Fix with hardware gating or USB_PHY_SEL; the duration is UNVERIFIED.
- **R4 Host re-enumeration** after an in-place OTG→USJ switch may fail. Restart-based switching avoids it.
- **R5 Irreversible eFuses** and errata USBOTG-4289 for chips dated before 2219.
- **R6 FORCE_DOWNLOAD_BOOT is sticky** until a system or chip reset or until esptool clears it.
- **R7 Endpoint budget** of 4 IN endpoints beyond EP0.
- **R8 Unwanted resets in COM mode.** A host program toggling RTS can reset the chip, and the USJ ignores baud rate.
- **R9 ROM pad states in USB-OTG download mode** (GPIO38-42, GPIO21). Avoid those pins for switch control.
