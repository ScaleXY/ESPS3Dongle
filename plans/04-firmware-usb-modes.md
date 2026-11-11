# 04 — Firmware plan: HID-only USB, update, service and recovery

Revision 2, 2026-11-09. **Changed:** both plugs are now HID-only and the COM-port modes are gone. Programming goes through a host tool; the host side is in `06`.

Tags: [V] verified (note ID) · [D] derived · [E] estimate · [U] open. Sources: R6 (USB/PHY behaviour), R8 (OTA, rollback, signing, Secure Boot, pad hold), R9 (host requirements), V0.11 (bootloader recovery option).

---

## 1. Toolchain and versions (pin them)

- **ESP-IDF v6.1**, commit `fff9895c`, released 2026-08-27 [V R3, R6].
- **TinyUSB ≥ 0.21.0~3.** That release fixes "severe vulnerabilities" in the DWC2 driver (back-to-back short SETUP packets) [V R8].
  - **esp_tinyusb 3.0.0 bundles 0.21.0~2,** from before the fix [V R8].
  - esp-usb master moved to 0.21.0~3 but was unreleased on 2026-11-09 [V R8].
  - **Action:** use the first esp_tinyusb release that bundles ≥ 0.21.0~3, or override the tinyusb component version and test it [U: compatibility].
- **esptool v5.6.0** [V R6, R9].

## 2. Build configuration (one image for the N16R16 and N16 builds)

| Setting | Value | Why |
|---|---|---|
| Flash | 16 MB, QIO, 80 MHz | [V R3] |
| `CONFIG_SPIRAM_MODE_OCT`, `CONFIG_SPIRAM_SPEED_80M` | y | R16V is octal; 80 MHz is the stable pairing [V R3] |
| `CONFIG_SPIRAM_IGNORE_NOTFOUND` | y | The same image boots without PSRAM [V R3]. Needs the next row. |
| `SPIRAM_ALLOW_BSS_SEG_EXTERNAL_MEMORY`, `SPIRAM_ALLOW_NOINIT_SEG_EXTERNAL_MEMORY` | n | Required by `IGNORE_NOTFOUND` [V R3] |
| `CONFIG_SPIRAM_ECC_ENABLE` | n by default | Raises R16V's limit to 85 °C at the cost of 1/16 of the PSRAM; decide after the thermal test [V R1, R3] |
| PSRAM boot memory test | Measure the time it adds; disable it if HID enumerates too slowly | [U] |
| `CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE` | y, also in the bootloader | [V R8] |
| `CONFIG_BOOTLOADER_APP_TEST` | y; GPIO **8**; low level; `BOOTLOADER_HOLD_TIME_GPIO` 5 s (tune). Keep hold time + boot time below `BOOTLOADER_WDT_TIME_MS` (default 9000 ms), or raise it; the hold loop doesn't feed the watchdog. | Recovery app (§9) [V V0.11, V0.12] |
| `CONFIG_BOOTLOADER_APP_ANTI_ROLLBACK` | **n** | Can't be combined with the test partition [V V0.11, R8] |
| `CONFIG_BOOTLOADER_WDT_ENABLE` | y (default) | [V R8] |
| Partition-table offset | **0x10000** from day one | Leaves room for a Secure Boot bootloader; the S3 bootloader may be at most 64 KB [V R8] |
| Signing | Development: `CONFIG_SECURE_SIGNED_APPS_NO_SECURE_BOOT` + `…_ON_UPDATE_…`. Production: Secure Boot V2 (§13). | [V R8] |
| `CONFIG_USJ_ENABLE_USB_SERIAL_JTAG` | y | USB-Serial/JTAG (USJ) is needed for SERVICE mode [V R6] |
| Console | UART0 test pads in development; none in production | [D] |

**Hardware tests:**
- The octal-PSRAM image must boot correctly on a plain ESP32-S3 at full flash speed [U R3].

## 3. Partition table (proposal) [D]

| Name | Type / subtype | Offset | Size |
|---|---|---|---|
| bootloader | — | 0x0 | ≤ 0x10000 |
| partition table | — | 0x10000 | 0x1000 |
| nvs | data / nvs | 0x11000 | 0x6000 |
| otadata | data / ota | 0x17000 | 0x2000 [V R8: otadata is 0x2000] |
| phy_init | data / phy | 0x19000 | 0x1000 |
| **recovery** | app / **test** | 0x20000 | 0x180000 (1.5 MB) |
| ota_0 | app / ota_0 | 0x1A0000 | 0x600000 (6 MB) |
| ota_1 | app / ota_1 | 0x7A0000 | 0x600000 (6 MB) |
| storage | data | 0xDA0000 | 0x260000 (2.375 MB) |

Notes:
- App offsets are 64 KB-aligned, as required [V R8].
- The total is exactly 16 MB [D].
- OTA writes only `ota_0` and `ota_1`, so the recovery app survives every update [D, V R8].
- The bootloader and partition table are **never** updated over HID. Espressif notes the S3 has no recovery bootloader, so a bootloader update is "unsafe" [V R8].

## 4. USB composition (NORMAL, UPDATE and RECOVERY)

| Interface | Class | Endpoints | Notes |
|---|---|---|---|
| 0 | HID boot keyboard | IN | Own interface for BIOS/UEFI [V R6] |
| 1 | HID boot mouse | IN | [V R6] |
| 2 | **HID vendor, usage page 0xFF00** | IN + OUT, 64 B, 1 ms | Update channel, specified in `06` §3–4 [V R8, R9] |

- **Endpoints:** 3 IN + 1 OUT, within "five IN endpoints … including EP0" [V R6, R8].
- **Descriptors:** custom ones are mandatory. With CDC enabled and no custom descriptor, esp_tinyusb silently uses its CDC default and the HID interface disappears [V R6].
- **Strings:** non-empty `iProduct` and a per-unit `iSerialNumber`, e.g. derived from the factory MAC [V R9: needed for Chrome to keep its WebHID permission].
- **IDs:** VID 0x303A with **two Espressif-allocated PIDs**, one for the product and one for the recovery app [D, V R6].
- **Power:** `bMaxPower` 500 mA [D].
- **Recovery app:** may drop the keyboard and mouse interfaces [D].

## 5. Facts the firmware must respect

1. **One internal PHY, two controllers:** USB-OTG (our HID via TinyUSB) and USJ (fixed CDC + JTAG, 303A:1001) [V R1, R6].
2. **USJ owns the PHY at power-on** and stays enabled through the bootloader [V R6].
   - On this board the switch's OE (output enable) is **disabled by a pull-up**, so no host sees USJ unless firmware enables OE (`02` §4.3) [D, V V0.10].
3. **PHY routing survives CPU and core resets.** This is inferred [D] from the TRM reset domains, the register sitting in the RTC block, esp-idf #9826 and Arduino's workaround [R1, R6]. **Every boot writes the routing explicitly.**
4. **OTG ↔ USJ switching at runtime works in v6.1** [V R6], with caveats:
   - It uses a private API (`esp_private/usb_phy.h`).
   - It regressed once (IDF 5.3.3, #15912).
   - It has no IDF test.
5. **USJ quirks:** it ignores the baud rate, and RTS/DTR can reset the chip [V R6].
6. **The force-download flag is sticky** until a system reset [V R1, R6]. In secure download mode esptool can't clear it [U R8], so SERVICE mode avoids it (§8).
7. **GPIO pad hold** keeps a pin's state "through a core reset" (TRM §6.9) [V R8]. Which reset levels clear the hold bits is R8's inference [D R8], and Espressif's documents conflict on it (R8 conflict E).
   - Whether a hold survives the ROM's download boot is **unverified** [U R8].
   - Per-pin hold is required; the global `gpio_force_hold_all` is "cancelled during ROM boot" [V R8].

## 6. Boot sequence (`app_main`, NORMAL mode)

```
0. gpio_hold_dis(GPIO6), gpio_hold_dis(GPIO7)        // release holds left by SERVICE mode
1. USB_OE := DISABLED                                 // already the hardware default (pull-up)
2. crash_cnt (RTC_NOINIT): +1 after panic or watchdog resets, else 0
3. a_pwr  := GPIO4 (TPS2116 ST: high = Type-A powers the board)
   c_vbus := GPIO5 / ADC (VBUS_C_SENSE)
4. port := a_pwr ? A : C                              // D12: Type-A wins
5. route the PHY to OTG explicitly; tinyusb install with custom descriptors
6. USB_SEL := port; wait ~100 ms [U: tune]; USB_OE := ENABLED   // the host sees a clean attach
7. Fallback: if port == A, nothing enumerates within T_enum (~3 s) [E], and c_vbus is present
   → OE off, USB_SEL := C, OE on                      // Type-A is likely a charger
8. If running image is PENDING_VERIFY: after the self-test, on host CONFIRM or a stable-run timer
   → esp_ota_mark_app_valid_cancel_rollback() [V R8]
9. crash_cnt := 0 after N s healthy
```

Run-time changes [D]:
- **Type-A removed while Type-C is live:** ST falls (the mux switches over in about 8 µs [V V0.5]). Firmware sets OE off, `USB_SEL := C`, then OE on.
- **Type-A added while running on Type-C:** "A wins", so OE off, `USB_SEL := A`, then OE on.
- **Type-C host unplugged while Type-A only powers:** VBUS_C_SENSE falls, so OE off.
- The VBUS_C reading is valid because the D± ESD parts are rail-less (`02` §2.1).

## 7. UPDATE engine (device side) [V R8 unless marked]

- **Receive:** the OUT-report callback copies into a RAM ring buffer of at least 8 KB [D] and returns at once. Blocking in the callback stalls the USB stack.
- **Writer task:**
  - `UPDATE_BEGIN` carries only the size and SHA-256 (`06` §4). The first 0x120 bytes then arrive as `UPDATE_DATA` and are buffered in RAM.
    - Run `esp_ota_check_image_validity()` on them (chip ID and revision, flash mode), plus the downgrade floor, **before** any erase.
    - Then `esp_ota_begin(real_size)`. This erases `ALIGN_UP(size, 4 KB)` up front in one blocking call, using 64 KB block erases where aligned. The device reports `BUSY` meanwhile.
    - Then write the buffered header and continue.
  - **Writes:** in order, with `esp_ota_write`. It has no offset argument, so out-of-order data is rejected with NAK + expected offset (`06` §4).
  - **On `UPDATE_END`:** `esp_ota_end()` checks the header magic, chip ID and revision, ≤ 16 segments, the checksum, and the SHA-256 or RSA signature. Then `esp_ota_set_boot_partition()`.
- **Watchdogs and erase stalls:** relax the task watchdog during erase. On **both** builds, flash erase/program stalls the CPU [V R8 §9.2]. Neither flash part is on IDF's auto-suspend list, and only XIP-from-PSRAM would avoid the stall, which this plan doesn't configure. So the HID interfaces go quiet for up to about 2–3 s per block in the worst case. Tell the user.
- **Resume (optional):** `esp_ota_resume(partition, erase_size, image_offset, &handle)`, new in v6.1, with the confirmed offset kept in NVS.
- **Downgrade floor:** refuse an image whose `secure_version` is lower than both of these [D]:
  - the highest `secure_version` among the valid apps in `ota_0`/`ota_1` (`esp_ota_get_partition_description` [V R8]);
  - the floor stored in NVS.

  Never compare against the running app: in RECOVERY the running app is the old recovery image.
- **Debugger caveat:** with a debugger attached, the checksum and SHA-256 checks are skipped.

## 8. SERVICE mode entry (serial / esptool path)

```
1. tinyusb_driver_uninstall()
2. USB_OE := DISABLED                                   // host sees an unplug
3. route the PHY to USJ (usb_serial_jtag_driver_install, or usb_new_phy SERIAL_JTAG) [V R6]
4. USB_SEL := current port; USB_OE := ENABLED; gpio_hold_en(GPIO6); gpio_hold_en(GPIO7) [V R8]
5. host sees 303A:1001. esptool's own USB-Serial/JTAG DTR/RTS sequence core-resets the chip
   into ROM download [V R6]. The pad hold should keep the switch connected [U: through ROM].
6. esptool writes; --after hard-reset → core reset → bootloader → app → §6 step 0 releases the holds
```

- This uses USJ's own reset into download mode instead of the sticky `FORCE_DOWNLOAD_BOOT` flag, as R8 recommends.
  - **Fallback:** `REG_WRITE(RTC_CNTL_OPTION1_REG, RTC_CNTL_FORCE_DOWNLOAD_BOOT)` + `esp_restart()` [V R1, R6]. The bit stays set until a system reset, and a power cycle is one [V R1, R6]. esptool clears it on hard reset, but secure download mode refuses register writes, so production units need a power cycle [D R8].
- **Test the hold on a DevKit first** (`06` §11). If the hold does not survive the ROM, SERVICE on production boards needs the DNP OE pull-down fitted (`02` §4.3). Otherwise use RECOVERY, or the lab jig grounding TP_OE (`02` §6).
- **Production gate:** `ENTER_SERVICE` is accepted only if Secure Boot V2 is on **and** the user is holding SW1 when the command arrives (physical presence). Otherwise it is compiled out.
  - Reason: secure download mode still accepts `FLASH_BEGIN/DATA/END` [V R8].
  - Without the gate, any local program could install an older signed image, overwrite the recovery app or wipe the bootloader [D; review finding].
- **In secure download mode** esptool needs `--no-stub` and `--flash-size 16MB`. There is no read-back verify, no `erase-flash` and no espefuse [V R8].

## 9. RECOVERY app (test partition)

- **What it is:** the same codebase built as a "recovery" Kconfig profile [D]:
  - TinyUSB with the update interface (optionally without keyboard and mouse);
  - the §7 update engine;
  - no Wi-Fi/BLE;
  - a distinct PID and LED pattern;
  - the §6 port logic, including the Type-A → Type-C fallback (step 7), so recovery works when Type-A only carries a charger.
- **How it starts:** hold the pinhole button (GPIO8 low) for `BOOTLOADER_HOLD_TIME_GPIO` while plugging in. The bootloader then boots the test partition. "After the GPIO input is deactivated and the device reboots, the old application will boot", or the newly installed one [V V0.11].
- **Why it's safe:** the factory writes it once with the jig. OTA never touches it, and production SERVICE needs physical presence (§8) [D].
  - It must carry signatures from **every** provisioned Secure Boot key. Otherwise revoking a key would stop it booting (§13) [D, R8].
- **Trade-off:** eFuse anti-rollback stays off [V V0.11, R8]. Downgrade protection is the software policy in §7.

## 10. USB power-budget rules

- **USB 2.0 limits:** one unit load is 100 mA before configuration and up to 5 after. Suspend current is 2.5 mA [V R4]. The Type-C default is 500 mA [V R4]. Wi-Fi transmit peaks at 340 mA [V R1].
- **Rules** [D]:
  - Declare `bMaxPower` 500 mA.
  - Start Wi-Fi/BLE only after configuration.
  - Measure the current before configuration [U].
  - On host suspend, stop the radio. Whether ≤ 2.5 mA is reachable while keeping resume working is unverified [U].

## 11. HID details

- **BIOS/UEFI keyboards:** a boot-protocol keyboard on its own interface, and a mouse on a separate one [V R6].
  - HID 1.11: "Boot Keyboards must support the boot protocol and the Set_Protocol request".
  - IDF's single-interface `tusb_hid` example is **not** BIOS-compatible [V R6].
- `tud_hid_n_report` always prepends a non-zero report ID, so in boot protocol the app sends 8-byte boot reports itself [V R6].
- The update interface uses **no report IDs** (`06` §3) [V R9].
- Measure power-on-to-HID-ready time [U].

## 12. USB IDs

- **Don't ship esp_tinyusb's default VID/PID** (0x303A:0x4000 plus class bits). Every default device shares them [V R6].
- **Espressif's free PID programme** (github.com/espressif/usb-pids):
  - fork the repo, take the next PID in `allocated-pids.txt` (≥ 0x8000), and open a PR;
  - Espressif may refuse [V R6].
  - **Request two PIDs:** product and recovery.
- USJ's 303A:1001 is fixed in silicon [V R6].

## 13. eFuse and security policy

| Stage | Setting | Source |
|---|---|---|
| Development | No eFuses burned. Optionally signed apps without hardware Secure Boot: it verifies OTA images, but not at boot on S3; the trust anchor is the running app's first key; no rotation over OTA. | [V R8] |
| **Production** | **Secure Boot V2** (RSA-3072 PSS, 2–3 key digests provisioned), **secure download mode** (`ENABLE_SECURITY_DOWNLOAD`), JTAG off (`DIS_PAD_JTAG`, `DIS_USB_JTAG`, all `SOFT_DIS_JTAG`). The bootloader burns these on first boot by default. ROM download over UART and USJ **stays available**, but only signed images boot. | [V R8] |
| **Never burn** | `DIS_DOWNLOAD_MODE`, `DIS_USB_SERIAL_JTAG`, `DIS_USB_SERIAL_JTAG_DOWNLOAD_MODE`, `DIS_FORCE_DOWNLOAD`, `SECURE_BOOT_AGGRESSIVE_REVOKE`, `USB_EXCHG_PINS`, `USB_PHY_SEL` | [V R1, R6, R8] |
| Optional | Flash encryption, only for firmware confidentiality. In release mode, ROM recovery needs ciphertext pre-encrypted with an escrowed per-device key. | [V R8] |
| Optional | The VDD_SPI 1.8 V eFuse on N16 builds | [V R1] |

**Sign the bootloader and the recovery app with every provisioned key** (`espsecure sign-data --append-signatures`, up to 3 [V R8]). Neither is updated in the field, and revocation "refuses unless … both the app and the bootloader verify with a non-revoked key" [V R8].

**Everything in this table is irreversible.** In secure download mode espefuse no longer works [V R8]. Rehearse the full provisioning on sacrificial boards first.

## 14. Firmware risks

| Risk | Mitigation |
|---|---|
| Private PHY API regresses [V R6] | Pin versions; run a hardware-in-the-loop SERVICE/NORMAL switch test on each upgrade |
| TinyUSB DWC2 vulnerability [V R8] | TinyUSB ≥ 0.21.0~3 |
| Pad hold doesn't survive ROM download [U] | DevKit test first; OE pull-down option on development units |
| Long erase stalls look like a hang [V R8] | Host timeouts ≥ 5 s; progress and "busy" status |
| User unplugs mid-update | Old slot stays active; rollback; resume [V R8] |
| Signing key lost or leaked | 2–3 Secure Boot key digests provisioned; offline signer [V R8, D] |
| Endpoint budget | 3 IN used; don't add more [V R6, R8] |
| Ungated SERVICE mode lets local software rewrite flash | Physical-presence gate + Secure Boot V2 (§8) |
