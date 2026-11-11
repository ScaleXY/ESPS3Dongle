# 06 — Host-side programming: putting the dongle into programming mode

Date: 2026-11-09 (plan revision 2). This file follows four changes you made:
- **Both plugs are HID-only** in normal use.
- **Both programming paths** are wanted: an HID updater, plus a serial/esptool path.
- The host tool must run on **Windows, macOS, Linux and in a browser / ChromeOS**.
- **End users** will run it.

Tags: [V] verified (note ID) · [D] derived · [E] estimate · [U] open. The new evidence is in `research/R8-device-update-security.md` (device side) and `research/R9-host-hid-tooling.md` (host side).

---

## 1. Short answer

Yes. The dongle never needs a COM port for normal updates. A host program talks to a **separate vendor-defined HID interface** on the dongle, and through it does one of two things:

- **UPDATE (HID).** It streams a **signed** firmware image into the spare firmware slot. The dongle checks it, switches to it on the next boot, and rolls back by itself if the new firmware fails before confirming [V R8]. The dongle stays an ordinary HID device the whole time. This is the end-user path.
- **SERVICE (serial).** It tells the dongle to hand its USB port to the chip's built-in USB-Serial/JTAG. The standard Espressif flashers (esptool, esptool-js, espflash) then program it from the ROM bootloader [V R6, R9]. This is the development and lab path.

A third mode, **RECOVERY**, covers firmware that boots but whose updater is broken. Holding a pinhole button while plugging in boots a small, separately stored recovery app, which is itself HID-only [V V0.11].

## 2. Device modes and what the computer sees

| Mode | How it is entered | What the computer sees | Who uses it |
|---|---|---|---|
| NORMAL | Plug in | One composite HID device: boot keyboard, boot mouse and the vendor update interface (usage page 0xFF00) | Everyone |
| UPDATE | Command from the host tool on the vendor interface | The same HID device. No re-enumeration until the final reboot. | End users, CI |
| RECOVERY | Hold the pinhole button (GPIO8) while plugging in, for the bootloader hold time (default 5 s) [V V0.11] | A HID device with the update interface, with its own PID so tools can tell it apart [D] | End users, when the main app is broken |
| SERVICE | Host tool command (development builds, or production with Secure Boot V2), or the lab jig | Espressif USB-Serial/JTAG, VID 0x303A / PID 0x1001: COMx on Windows, `/dev/cu.*` on macOS, `/dev/ttyACM*` on Linux [V R9] | Developers, lab, factory |

Why RECOVERY uses a "test" app partition:
- ESP-IDF v6.1's bootloader option `BOOTLOADER_APP_TEST`: "GPIO triggers boot from test app partition".
- The pin is "configured as an input with internal pull-up enabled", and must be held "continuously" for `BOOTLOADER_HOLD_TIME_GPIO` (default 5 s).
- "After the GPIO input is deactivated and the device reboots, the old application will boot."
- On S3 any GPIO 0–48 is allowed [V V0.11].
- OTA never writes that partition, so the recovery app survives every field update [D].
- **Cost:** the option "depends on !BOOTLOADER_APP_ANTI_ROLLBACK" [V V0.11], and "Factory and Test partitions are not supported in anti rollback scheme" [V R8]. So eFuse anti-rollback is off. The version policy moves into the updater (§5).

## 3. The vendor HID interface (device requirements the host research produced)

1. **Its own USB interface,** not an extra collection inside the keyboard or mouse interface. Each OS blocks input usages differently [V R9]:
   - Windows opens keyboard and mouse collections for exclusive system use.
   - ChromeOS refuses hidraw nodes whose interface also has input usages.
   - macOS asks for Input Monitoring only for keyboard, mouse and touchpad devices.
2. **Report layout:**
   - Usage page **0xFF00**, usage 0x01.
   - One **64-byte Input** and one **64-byte Output** report, **no report IDs**. With an ID a report would be 65 bytes, more than one full-speed packet [V R9].
   - Interrupt IN and OUT endpoints, 1 ms interval (TinyUSB `TUD_HID_INOUT_DESCRIPTOR`) [V R8].
3. **Throughput ceiling:** 64 bytes per 1 ms frame per direction = **64,000 B/s** (USB 2.0 §5.7.3/§5.7.4) [V R8].
4. **Strings:** a non-empty, per-unit **iSerialNumber** and a non-empty **iProduct**. Chrome only keeps a WebHID permission across re-plugs when both exist [V R9].
5. **Endpoint budget:** keyboard IN + mouse IN + vendor IN/OUT fits the ESP32-S3 limit of "five IN endpoints including EP0" [V R6, R8].
6. **Firmware rule:** OUT reports arrive in `tud_hid_set_report_cb`. Copy them into a ring buffer and return; blocking there stalls the whole USB stack [V R8].
7. **TinyUSB version:** ≥ **0.21.0~3**, which fixes "severe vulnerabilities" in the DWC2 driver. esp_tinyusb 3.0.0 still bundles 0.21.0~2 [V R8].

## 4. Update protocol v1 (draft for review) [D]

Every report is 64 bytes, both directions, with no report ID.

| Bytes | Host → device | Device → host |
|---|---|---|
| 0 | opcode | status / opcode echo |
| 1 | sequence number | echoed sequence number |
| 2–3 | payload length (little-endian) | payload length |
| 4–63 | payload (≤ 60 B) | payload (≤ 60 B) |

| Command | What the device does |
|---|---|
| `GET_INFO {page}` | The reply is longer than one report, so it is split into TLV pages of ≤ 60 B; the host reads pages until an END marker [D]. Contents: protocol version, board ID / HW revision, build variant (flash size, PSRAM size), chip revision, unique ID, running app (`version`, `project_name`, `secure_version`, ELF SHA-256 from `esp_app_desc_t`), slot sizes, security state (Secure Boot / flash encryption / secure download mode), recovery-app version, window size. |
| `UPDATE_BEGIN {size u32, sha256[32]}` (36 B) | Allocates the transfer. The image's first 0x120 bytes then arrive as ordinary `UPDATE_DATA` reports and are buffered in RAM. The device pre-checks them with `esp_ota_check_image_validity` (chip ID and revision, flash mode; new in v6.1) and the downgrade floor (§5) **before erasing anything** [V R8]. `esp_ota_begin(size)` then erases in one blocking call [V R8], so the device answers `BUSY` until it finishes, then `READY`. |
| `UPDATE_DATA {offset u32, ≤ 56 B}` | Accepts data **in order only**, because `esp_ota_write` is strictly sequential [V R8]. ACKs the next expected offset every 4 KB; NAKs with the expected offset on a gap, and the host resends from there. |
| `UPDATE_END` | `esp_ota_end`, which verifies header, chip, segments, SHA-256 or the RSA signature [V R8]; then `esp_ota_set_boot_partition`. Replies OK or an error code. |
| `REBOOT {normal}` | Restarts into the new image, which boots as PENDING_VERIFY [V R8]. |
| `CONFIRM` | The new app runs its self-test and marks itself valid after the host confirms or a stable-run timer expires [V R8 rec.]. Any reset before that rolls back [V R8]. |
| `ABORT` | Abandons the transfer; the old app stays active. |
| `RESUME` (optional) | Uses v6.1's `esp_ota_resume`, which "resumes writing from the given offset", with the confirmed offset kept in NVS [V R8]. |
| `ENTER_SERVICE` | See `04` §8. **In production it needs physical presence:** the user must be holding the recovery button (SW1) when the command arrives, and Secure Boot V2 must be on. Otherwise the command is compiled out. Secure download mode still accepts flash writes [V R8], so an ungated command would let any local program install an older signed image, overwrite the recovery app or wipe the bootloader [D; review finding]. |

**Timing** [V/D R8]:
- **Estimates, not measurements:** R8 §9.3 [D], rescaled to protocol v1's 56 B of image data per report, with block erase:

  | Image | Transfer alone | Typical total | Worst case |
  |---|---|---|---|
  | 2 MiB | 37.4 s | ≈ 49–51 s | ≈ 95–126 s |
  | 4 MiB | 74.9 s | ≈ 98–102 s | ≈ 191–252 s |

- The report rate real hosts actually achieve (Windows, macOS, Linux, WebHID) is unmeasured [U R8].

- Flash erase can stall USB for **up to 2–3 s per block** in the worst case [V R8], so host timeouts must be ≥ 5 s, with "busy" status polling.
- The GUI must tell the user not to unplug.

## 5. Image format and checks

**Release artifact:** a signed app `.bin` plus a `manifest.json` (board ID, version, minimum recovery version, SHA-256, notes) [D].

**Host-side pre-checks** (the device re-checks everything) [V R8]:

| Offset | Field |
|---|---|
| 0 | magic 0xE9 |
| 12 | chip_id 0x0009 (ESP32-S3) |
| 0x20 | `esp_app_desc_t` magic 0xABCD5432 |
| 0x24 | `secure_version` |
| 0x30 | `version` |
| 0x50 | `project_name` |

The host also checks that the signature sector is present and that the image is no larger than the slot.

**Signing** [V R8]:
- ESP32-S3 supports **RSA-3072 PSS only**, with no ECDSA option.
- Command: `espsecure sign-data --version 2 --keyfile key.pem …`.
- The image is padded to 64 KB and followed by a 4 KB signature sector.
- Keep the private key offline (HSM or an air-gapped signer) [D].

**Downgrade policy** [D]: eFuse anti-rollback is off (§2), so the updater enforces a **floor**. The floor is the highest `secure_version` among the valid apps in `ota_0`/`ota_1` (read with `esp_ota_get_partition_description` [V R8]), or a floor stored in NVS, whichever is higher.
- It does **not** compare against the running app, because the recovery app is old by design.
- It is software-only, but it blocks casual downgrades, including through the recovery app.

## 6. Host tools

### 6.1 Web updater — primary tool for end users

**What it is:** a TypeScript single-page app served over **HTTPS**.
- **WebHID** for UPDATE and RECOVERY.
- **Web Serial + esptool-js** for SERVICE (advanced/lab button) [V R9].

**Where it works** [V R9]:
- **WebHID:** Chromium 89+ (Chrome/Edge 89, Opera 75) on Windows, macOS, Linux and ChromeOS. **Not** Android Chrome, Firefox or Safari.
- **Web Serial:** desktop Chromium, and also Chrome on Android 148+ and Firefox 151+ (after installing a permission add-on).

**Device access** [V R9]:
- `requestDevice` needs a user click.
- Use two filters: `{vendorId: 0x303A, productId: <product PID>, usagePage: 0xFF00}` and the same with `<recovery PID>`.
  - That such a filter grants only the update interface is derived from the spec [D R9]. Keyboard and mouse collections are blocked anyway [V R9].
  - A device in recovery mode has a different PID, so the browser asks for permission again [D].
- `getDevices()` reconnects on later visits without a click, provided the dongle reports a serial number and product name.

**OS specifics** [V R9]:
- **Linux:** Chrome needs the udev rule (§7). Without it, it falls back to read-only and writes fail.
- **ChromeOS:** should work through permission_broker with no udev rule, but only if Linux creates no input device for the update interface [D R9]. Unverified [U R9].

**esptool-js v0.7.1 gaps** [V R9]:
- Its hard reset only releases RTS, so it may not reset the chip.
- It doesn't clear the S3 force-download bit.
- It doesn't disable watchdogs, which "can then reset the board during flashing" over USB-Serial/JTAG.

**Plan for those gaps:** the page uses its own reset sequence and tells the user to unplug and replug after a SERVICE flash [D]. Treat browser SERVICE as advanced.

### 6.2 CLI — engineers, CI, factory, advanced users

**Stack** [V R9]:
- **Python 3.10+.**
- PyPI **`hidapi` 0.15.0**: wheels with hidapi compiled in; hidraw backend on Linux.
- **esptool v5** public API (`connect_esp`, `write_flash`, `reset_chip`) for SERVICE.

**Commands** [D]: `list`, `info`, `update <bin>`, `recover`, `service`, `confirm`.

**HID details:**
- **Don't use `hid_open(VID, PID)`.** It opens the *first* matching interface, which may be the keyboard. Enumerate and pick `usage_page == 0xFF00` [V R9].
- Write with `hid_write` using a **65-byte buffer** (leading report ID 0) and about **5 s timeouts** [V R9].

**Licence:** esptool is **GPL-2.0-or-later** [V R9]. Keep the CLI internal or open-source, or call esptool as a subprocess. Get legal review before shipping a closed binary that imports it.

**Alternative:** a single Rust binary built on the `hidapi` crate (MIT) and `espflash` (MIT/Apache) [V R9]. espflash doesn't clear the S3 force-download bit, so add that yourself if you use the flag [V R9].

### 6.3 Native desktop app (optional, later)

Only needed for Firefox or Safari users, or for offline installs.

**Options** [V R9]:
- **Electron:** reuses the web code; WebHID comes from Chromium; needs a `select-hid-device` handler.
- **Tauri:** Rust core shared with a Rust CLI. Its WebKit webviews on macOS/Linux have no WebHID, so HID goes through Rust.

**Distribution cost** [V R9]:
- **Windows:** Authenticode signing. SmartScreen still warns about new apps, and "EV certificates no longer bypass SmartScreen". Microsoft Artifact Signing costs about $10/month.
- **macOS:** Developer ID signing plus notarization, shipped in a .dmg/.pkg. A ticket "can't" be stapled to a bare CLI binary.
- **Linux:** a .deb/.rpm can install the udev rule; an AppImage cannot.

## 7. Per-OS checklist

| | Windows 10/11 | macOS | Linux desktop | ChromeOS | Android |
|---|---|---|---|---|---|
| HID update, web | Chrome/Edge; no driver [V R9] | Chrome/Edge. The update interface shouldn't trigger Input Monitoring [V R9; U: test on macOS 26/27] | Chrome + udev rule [V R9] | Should work if no input device is created [D R9; U] | No WebHID [V R9] |
| HID update, CLI | hidapi, no driver [V R9]; non-admin access [U: test] | hidapi; notarize if distributed [V R9] | hidraw + udev rule [V R9] | — | — |
| SERVICE (serial) | usbser.sys binds automatically → COMx [V R9] | `/dev/cu.*` via AppleUSBACM [V R9] | `/dev/ttyACM*`; needs `dialout` or `uaccess` [V R9] | Web Serial [V R9] | Web Serial on Chrome 148+ [V R9; U: this device] |

**Linux udev rule.** Install as `/etc/udev/rules.d/70-<product>.rules`. The file must sort before `73-seat-late.rules` for `uaccess` to work [V R9]. Exact match keys are [D]; bench-test them.

```
# HID update interface (replace PPPP with the allocated PID)
KERNEL=="hidraw*", ATTRS{idVendor}=="303a", ATTRS{idProduct}=="PPPP", TAG+="uaccess"
# Recovery app (replace RRRR with its PID)
KERNEL=="hidraw*", ATTRS{idVendor}=="303a", ATTRS{idProduct}=="RRRR", TAG+="uaccess"
# SERVICE mode: Espressif USB-Serial/JTAG
SUBSYSTEM=="tty", ATTRS{idVendor}=="303a", ATTRS{idProduct}=="1001", TAG+="uaccess"
```

Then run `udevadm control --reload` **and** `udevadm trigger`, or replug [V R9]. Never use `MODE=0666` [V R9].

## 8. SERVICE path (serial) in detail

- **Device entry sequence:** `04` §8. It holds the USB switch on the current plug, hands the PHY to USB-Serial/JTAG, and lets esptool's own USB-Serial/JTAG reset enter the ROM. That avoids the sticky force-download bit [V R8 rec.].
- **CLI:** `esptool --chip esp32s3 --port <port> --before default-reset --after hard-reset write-flash …`.
  - esptool picks its USB-Serial/JTAG reset sequence when the PID is 0x1001 [V R6].
- **On production units** (Secure Boot V2 + secure download mode) [V R8]:
  - esptool must use `--no-stub` and an explicit `--flash-size 16MB`.
  - Read-back verify, `erase-flash` and espefuse don't work.
  - Only signed images will boot.
- **Fallback:** if the pad hold doesn't survive the ROM [U], SERVICE on a production board only works on units with the `OE` pull-down option fitted (`02` §4.3). Recovery for those units is the RECOVERY button, or the lab jig grounding TP_OE to connect USB with no rework (`02` §6) [D].

## 9. End-user recovery flows

| Failure | What happens | Source |
|---|---|---|
| Update interrupted (unplugged, host crash) | The old app keeps booting, because the boot slot changes only after `esp_ota_end` verification. The tool restarts or resumes. | [V R8] |
| New app crashes before confirming | The bootloader marks it ABORTED on the next boot and runs the previous app. | [V R8] |
| App boots but its updater is broken | Hold the pinhole button while plugging in, ≥ hold time. The recovery app (HID) starts, the web updater reinstalls good firmware, then the user replugs. | [V V0.11] mechanism; [D] flow |
| Bootloader or partition table damaged | Never written by HID updates [D]. Lab only: BOOT pad + UART/USB jig. | [D] |

## 10. Security model (end users run this)

- **Production** [V R8]:
  - Burn: **Secure Boot V2** (RSA-3072, 2–3 key digests provisioned up front), **secure download mode**, JTAG disabled. ESP-IDF's bootloader burns these on first boot by default.
  - **Do not burn:** `DIS_DOWNLOAD_MODE`, `DIS_USB_SERIAL_JTAG(_DOWNLOAD_MODE)`, `DIS_FORCE_DOWNLOAD`, `SECURE_BOOT_AGGRESSIVE_REVOKE`.
  - **Flash encryption only if firmware confidentiality matters.** In release mode, ROM recovery needs ciphertext pre-encrypted with an escrowed per-device key.
  - **All irreversible.**
- **Development:** `CONFIG_SECURE_SIGNED_APPS_NO_SECURE_BOOT` [V R8].
  - It verifies OTA images, but not at boot on S3.
  - The trust anchor is the running app's first signature key, so keys cannot be rotated over OTA.
- **UPDATE needs no host authentication,** because the device verifies every image and enforces the downgrade floor [D]. A local program could still start an update and then abort it. That is a nuisance, not a takeover [D].
- **`ENTER_SERVICE` is different.** In production it needs physical presence (SW1 held) as well as Secure Boot V2, because secure download mode still accepts raw flash writes [V R8].
- **WebHID's spec** asks for authentic, downgrade-resistant firmware updates [V R8]. §5's signing and downgrade floor address that. The floor is software-only (no eFuse anti-rollback), so someone with physical access and SERVICE mode can still downgrade [V R8].

## 11. Build order (de-risk on a DevKit before the custom PCB exists)

1. **ESP32-S3-DevKitC-1** (native USB on GPIO19/20, wired directly [V R2]):
   - composite HID (keyboard + mouse + update interface), with custom descriptors and per-unit serial number;
   - update engine + rollback + `CONFIRM`;
   - recovery test-partition app;
   - SERVICE entry, and the GPIO-hold-through-ROM test.
2. **CLI** (Python): protocol, update, recovery, service.
3. **Web updater:** WebHID update and recovery; Web Serial service mode.
4. **OS and browser matrix** (`05` §2b): Windows (standard user), macOS (Input Monitoring check), Linux (udev), ChromeOS.
5. **Signing pipeline and release packaging;** freeze protocol v1.
6. **Port to the custom PCB at bring-up.** Add the switch control (S and OE) and the recovery button.
