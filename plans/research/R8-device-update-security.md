# R8 — Device-side firmware update over HID: OTA, rollback, signing, Secure Boot, pad hold, timing

Research date: 2026-11-09. Every fact below was read in this session from a primary source: a raw GitHub file at a fixed tag or commit, an ESP-IDF RST source at tag v6.1 (the rendered v6.1 ESP32-S3 pages were spot-checked and match), a vendor datasheet, or a USB-IF / WHATWG spec. Nothing was built, cloned or executed. Labels used:
- **[V]** verified from the cited source (quote given where it matters).
- **[D]** derived by me from verified facts (the reasoning is shown).
- **UNVERIFIED** no primary source found.
- **CONFLICT** two primary sources (or two places in one source) disagree.

Facts reused from earlier notes are cited as R1 (silicon) and R6 (firmware/USB) and were not re-researched.

---

## 0. Versions and sources

| Tag | Item | Version / commit | Notes |
|---|---|---|---|
| IDF | ESP-IDF | **v6.1**, annotated tag `4dc1c655…` → commit `fff9895c82d744c7237be8847347bdd1b07c6643` (tagged 2026-08-25, released 2026-08-27) | `gh api repos/espressif/esp-idf/releases/latest` still returns v6.1 today. URL pattern: `https://github.com/espressif/esp-idf/blob/v6.1/<path>#Lx-Ly`. Docs: `https://docs.espressif.com/projects/esp-idf/en/v6.1/esp32s3/<page>.html` (built from `docs/en/<page>.rst` at the same tag). |
| TUSB | TinyUSB bundled in esp_tinyusb 3.0.0 | `espressif/tinyusb` @ `894ea01409e0407a7dbe0ee29b2d58a4691f9046` (= tag v0.21.0.2, "0.21.0~2") | Same commit as R6. |
| TUSB3 | TinyUSB with security fix | tag v0.21.0.3 = `31cdf4fa6d36…` (2026-11-03); registry `espressif/tinyusb` 0.21.0~3 (2026-11-03) and 0.21.0~4 (2026-11-05, NCM-only change) | See §7.6. |
| ETU | esp_tinyusb | **3.0.0** = `espressif/esp-usb` @ `68bf7f9613dbb1a31094fdb903209ae3e4bf388d` (as R6). Latest 2.x = 2.4.0 (2026-10-05, depends on `tinyusb >=0.17.0~2`). esp-usb master (unreleased) commit `8e2670fb…` (2026-11-04) bumps the submodule to 0.21.0~3. | Registry API + GitHub. |
| ET | esptool / espsecure / espefuse | **v5.6.0** (2026-10-15, still latest) | `https://github.com/espressif/esptool/blob/v5.6.0/<path>` |
| IOT | esp-iot-solution `components/usb/esp_tinyuf2` | commit `373704c9c8bb2843dc27f494e042bb3e66685519` (2026-07-13); component version **1.2.0** | |
| ESPP | esp-cpp/espp (community, MIT) | `main` @ `351825c16377173ff9fd6716a0f089eaf461d7d2` | `components/ota/README.md` |
| TRM | ESP32-S3 Technical Reference Manual | **v1.8**, PDF downloaded today from https://www.espressif.com/sites/default/files/documentation/esp32-s3_technical_reference_manual_en.pdf (→ documentation.espressif.com), 1531 pages; PDF page = printed page (as R6) | Text extracted with macOS PDFKit. |
| USB2 | USB 2.0 Specification | `usb_20.pdf` from https://usb.org/sites/default/files/usb_20_20250603.zip | Printed page = PDF page − 28 (as R4). |
| HID | USB HID 1.11 | https://www.usb.org/sites/default/files/hid1_11.pdf | Printed page = PDF page − 10. |
| GD | GigaDevice GD25LQ128E datasheet | **Rev 1.3, September 2024** (footer "GD25LQ128E-Rev1.3 … September 2024"), https://download.gigadevice.com/Datasheet/DS-00533-GD25LQ128E-Rev1.3.pdf | Same file as R3. |
| WB | Winbond W25Q128JW datasheet | **Revision G, July 29, 2021** (LCSC mirror https://datasheet.lcsc.com/datasheet/pdf/1c7245ae56f4249bb475769020ae9cb2.pdf) | Same file as R3; a newer Winbond revision is UNVERIFIED (R3). |
| WHID | WHATWG HID ("WebHID") | Living Standard, "Last Updated 4 November 2026", https://hid.spec.whatwg.org/ (wicg.github.io/webhid now redirects there) | Blocklist: `whatwg/hid` `blocklist.txt`, last changed in commit `14ce3cb37c32d2b844c6f4e8dda1fa13f96b2f7b`. |
| CHR | Chrome Developers, "Connect to uncommon HID devices" | published 2020-09-15, https://developer.chrome.com/docs/capabilities/hid | |
| MS | Microsoft Learn | "Sending HID Reports" (ms.date 2024-09-17); "Firmware Update Collection (Optional)" for touchpads (ms.date 2017-05-02) | |

---

## Q1. ESP-IDF OTA API with a custom transport

### 1.1 `esp_ota_begin()` — erase behaviour [V]
- Header `components/app_update/include/esp_ota_ops.h` L26-27:
  - `#define OTA_SIZE_UNKNOWN 0xffffffff /*!< Used for esp_ota_begin() if new image size is unknown */`
  - `#define OTA_WITH_SEQUENTIAL_WRITES 0xfffffffe /*!< … erase can be done in incremental manner (assuming write operation is in continuous sequence) */`
- Header L70: "Partition will be erased in order to receive this size of image. If 0 or OTA_SIZE_UNKNOWN, the entire partition is erased."
- Code `components/app_update/esp_ota_ops.c`:
  - L167-176: the target must be an OTA app slot, and it must not be the running partition (`ESP_ERR_OTA_PARTITION_CONFLICT`).
  - L178-186: with `CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE`, if the running app is still `ESP_OTA_IMG_PENDING_VERIFY` it returns `ESP_ERR_OTA_ROLLBACK_INVALID_STATE`.
  - L199: `new_entry->need_erase = (image_size == OTA_WITH_SEQUENTIAL_WRITES);`
  - L209-221: otherwise it erases up front. `erase_size = partition->size` for 0/`OTA_SIZE_UNKNOWN`, else `ALIGN_UP(image_size, partition->erase_size)`, then `esp_partition_erase_range(partition, 0, erase_size)`.
  - L223-227: with rollback enabled it calls `esp_ota_invalidate_inactive_ota_data_slot()`. That erases the otadata sector of the previously booted slot (L1316-1372), so a half-written slot can never be selected.
- How the erase is done: `esp_flash_erase_region()` (`components/spi_flash/esp_flash_api.c` L644, L716-731) erases "an entire multi-sector block" when `len_remain >= block_erase_size` and the address is block-aligned, and otherwise erases single sectors. The GD and Winbond chip drivers set `.sector_size = 4 * 1024, .block_erase_size = 64 * 1024` (`spi_flash_chip_gd.c` L155-158; `spi_flash_chip_winbond.c` L216-219).
- [D] What this means in practice:
  - A bulk erase (known size) uses 64 KB block erases.
  - `OTA_WITH_SEQUENTIAL_WRITES` erases per `esp_ota_write()` call (§1.2). It therefore uses 4 KB sector erases, unless each call carries a 64 KB-aligned, ≥64 KB chunk.
- `ota.rst` L253 warns: "If the partition to be erased is too large, task watchdog could be triggered. It is advised to increase the watchdog timeout in such cases."

### 1.2 `esp_ota_write()` must be sequential [V]
- Header L139-144: "This function can be called multiple times as data is received … Data is written sequentially to the partition." There is no offset parameter.
- Code L336-432 writes at `it->wrote_size`:
  - L355-369: in sequential-erase mode it erases the sectors the write touches.
  - L371-376: the first byte must be `ESP_IMAGE_HEADER_MAGIC` (0xE9), otherwise `ESP_ERR_OTA_VALIDATE_FAILED`.
  - L389-419: with flash encryption it buffers until 16-byte blocks are complete.
- Out-of-order data: `esp_ota_write_with_offset()` (header L160-179):
  - "can write data in non-contiguous manner. If flash encryption is enabled, data should be 16 bytes aligned … Use of esp_ota_write_with_offset() in combination with esp_ota_write() is not recommended."
  - Code L449: `assert(it->need_erase == 0 && "must erase the partition before writing to it");`. It **cannot** be used with `OTA_WITH_SEQUENTIAL_WRITES`.
- New in v6.1, `esp_ota_resume(partition, erase_size, image_offset, &handle)` (header L87-112): "does not erase the partition … expects that part of the image has already been written correctly, and it resumes writing from the given offset." It can resume an interrupted HID transfer. The app must store the confirmed offset itself (e.g., in NVS).

### 1.3 `esp_ota_end()` — what is validated [V]
- Code L617-663:
  - If nothing was written it returns `ESP_ERR_INVALID_ARG` (L628-632).
  - It flushes the last 16 encrypted bytes (L634-643).
  - It calls `ota_verify_partition()`, which for app images runs `esp_image_verify(ESP_IMAGE_VERIFY, …)` on the staging partition (L578-589).
  - It always frees the handle (header L186).
- `esp_image_verify` in the app (`components/bootloader_support/src/esp_image_format.c`) checks:
  - Header (L385-409): magic 0xE9, chip ID and chip revision (`bootloader_common_check_chip_validity`), and `segment_count ≤ ESP_IMAGE_MAX_SEGMENTS` (16).
  - Segments and their load addresses.
  - The XOR checksum (L1045-1060).
  - That image plus signature fits the partition (L1032-1035): "Image length … doesn't fit in partition length".
  - **Without signing** (L235-240): the appended SHA-256 "simple hash" is checked if `hash_appended`. esptool appends it by default: ET `firmware-image-format.rst` L86 "Generating images without SHA256 digest can be achieved by running esptool elf2image with the --dont-append-digest argument".
  - **With `CONFIG_SECURE_SIGNED_ON_UPDATE`** (set by HW Secure Boot or `…_NO_SECURE_BOOT`; L42-46, L221-234): `verify_secure_boot_signature()` runs. It hashes the whole image including the simple hash and the 4 KB padding (L1142-1167), then verifies the signature block (§3).
  - Caveat, L217 and L237: the checksum and simple-hash checks are skipped when a JTAG debugger is attached (`esp_cpu_dbgr_is_attached()`).
- New in v6.1: `esp_ota_check_image_validity(part_type, img_hdr, app_desc)` (header L425-448; code L1131-1175). It checks chip ID and revision and that `spi_flash_mode` matches the running app (`ESP_ERR_OTA_SPI_MODE_MISMATCH`). It can be called on the first chunk, before any erase.

### 1.4 `esp_ota_set_boot_partition()` and `esp_ota_abort()` [V]
- Header L217: "Equivalent to esp_image_verify() followed by esp_ota_set_boot_partition_skip_validate()". Code L849-860 re-verifies the whole image (a second full read and hash).
- Internal (L814-847):
  - Selecting the **factory** partition erases the whole otadata partition (L818-824).
  - With `CONFIG_BOOTLOADER_APP_ANTI_ROLLBACK`, if the image's `secure_version` is below the eFuse value, the **partition is erased** and `ESP_ERR_OTA_SMALL_SEC_VER` is returned (L826-840).
  - Otherwise it writes the next `ota_seq` into the inactive otadata sector, with state `ESP_OTA_IMG_NEW` (rollback enabled) or `UNDEFINED` (L127-135, L778-812).
- `esp_ota_abort()` (L482-492) only unlinks and frees the handle. It does not erase, and it does not restore the otadata sector already invalidated by `esp_ota_begin`.

### 1.5 Partition table requirements [V]
- `ota.rst` L15: OTA needs "at least two OTA app slot partitions (i.e., ota_0 and ota_1) and an OTA Data Partition". L28: otadata is type `data`, subtype `ota`.
- `ota.rst` L34 and `partition-tables.rst` L163: otadata is 0x2000 bytes, two sectors.
- `partition-tables.rst`:
  - L11: the table occupies one 4 KB sector at `CONFIG_PARTITION_TABLE_OFFSET` (default 0x8000).
  - L134-140: `factory` (0x00) is optional ("you can remove the factory partition and use ota_0 instead"); `ota_0`..`ota_15` (0x10-0x1F); `test` (0x20) is the last-resort fallback.
- Alignment (`partition-tables.rst` L218-222):
  - Every offset must be a multiple of 4 KB.
  - "Partitions of type app have to be placed at offsets aligned to 0x10000 (64 KB)."
  - App size must be a multiple of 4 KB.
  - 64 KB size alignment applies only to Secure Boot **V1**.
- Code agrees, `components/partition_table/gen_esp32part.py` L106-132: `ALIGNMENT = {APP_TYPE: 0x10000, …}`; app size alignment is 0x1000 for no secure boot and for `SECURE_V2` ("signature block (4K) is kept after padding the unsigned image to 64K boundary"). `CMakeLists.txt` L47-55 passes `--secure v2` only with `CONFIG_SECURE_BOOT`.
- Bootloader slot (`docs/en/api-guides/bootloader.rst` L148-157):
  - The maximum bootloader size on ESP32-S3 is "64 KB (0x10000 bytes)".
  - The maximum partition-table offset is 0x11000.
  - The ROM bootloader offset on S3 is 0x0 (`components/esp_rom/esp32s3/Kconfig.soc_caps.in` L130-132).
  - Enabling Secure Boot or flash encryption grows the bootloader (`secure-boot-v2.rst` L433).
- The **recovery bootloader** feature (`bootloader.rst` L196-208) is gated on `SOC_RECOVERY_BOOTLOADER_SUPPORTED`. The S3 `soc_caps.h` does not define it.
- `ota.rst` L17-21: bootloader and partition-table OTA are "Unsafe update mode".
- [D] On S3 the bootloader cannot be updated safely in the field. Never send bootloader images over HID.

### 1.6 Maximum app partition and image size on ESP32-S3
- [V] `esp_image_format.c` L53-57: `#if SOC_SPI_MEM_SUPPORT_CACHE_32BIT_ADDR_MAP … UINT32_MAX #else … 0x1000000`, and L209-212 "partition size … invalid, larger than 16MB". S3 sets `SOC_SPI_MEM_SUPPORT_CACHE_32BIT_ADDR_MAP (1)` (`soc_caps.h` L462), so the 16 MB check does not apply on S3.
- [V, R1] The flash MMU windows are 32 MB on the instruction bus and 32 MB on the data bus, mapped in 64 KB pages, and shared with PSRAM (R1 §6: TRM §4.2, Table 4.3-2; IDF external-ram doc).
- [D] There is no smaller hard limit, so the partition size is the limit. With 16 MB of flash and two OTA slots, each slot can be at most ≈ 7.9 MB. The HID transfer time (§9) is the practical constraint; keep images ≤ 2–4 MB.
- UNVERIFIED: an explicit "maximum app size" statement for S3 in any Espressif document. None was found.

### 1.7 Recommended 16 MB layout [D]
Set `CONFIG_PARTITION_TABLE_OFFSET=0x10000` now. This leaves the 64 KB S3 bootloader maximum available for Secure Boot V2 and flash encryption later. Changing the offset later requires reflashing the bootloader, which cannot be done safely over the air on S3.

| Name | Type | SubType | Offset | Size | Note |
|---|---|---|---|---|---|
| (bootloader) | – | – | 0x0 | ≤ 0x10000 | |
| (partition table) | – | – | 0x10000 | 0x1000 | |
| nvs | data | nvs | 0x11000 | 0x6000 | Holds update-resume state and settings |
| otadata | data | ota | 0x17000 | 0x2000 | |
| phy_init | data | phy | 0x19000 | 0x1000 | |
| (free) | | | 0x1A000 | 0x6000 | Gap before the 64 KB-aligned app |
| ota_0 | app | ota_0 | 0x20000 | 0x600000 (6 MB) | |
| ota_1 | app | ota_1 | 0x620000 | 0x600000 (6 MB) | |
| coredump | data | coredump | 0xC20000 | 0x10000 | Optional |
| storage | data | (fat/littlefs/undefined) | 0xC30000 | 0x3D0000 | Ends at 0x1000000 |

- **No factory partition.** This keeps anti-rollback possible: `ota.rst` L211, "Factory and Test partitions are not supported in anti rollback scheme". Recovery then relies on rollback plus ROM download (Q4).
- Alternative: if anti-rollback will never be used, carve a 1–2 MB **factory "rescue" app** (HID updater only) out of `storage`. The bootloader falls back to it when both OTA slots are invalid (§2.3).
- Always pass the real image size to `esp_ota_begin`, never `OTA_SIZE_UNKNOWN`. Erasing a full 6 MB slot costs 96 blocks × 0.15–0.3 s typical, and up to 96 × 2 s worst case (§9).

---

## Q2. App rollback and anti-rollback

### 2.1 Kconfig (`components/bootloader/Kconfig.app_rollback`, v6.1) [V]
- L3-13 `BOOTLOADER_APP_ROLLBACK_ENABLE` (default n): "Note: If during the first boot a new app the power goes out or the WDT works, then roll back will happen. Rollback is possible only between the apps with the same security versions."
- L15-20 `BOOTLOADER_APP_ANTI_ROLLBACK` (depends on rollback, default n).
- L22-39 `BOOTLOADER_APP_SECURE_VERSION` (int, default 0): "Your partition table should has a scheme with ota_0 + ota_1 (without factory)."
- L41-56 `BOOTLOADER_APP_SEC_VER_SIZE_EFUSE_FIELD`: `range 1 16`, `default 16` for targets other than ESP32/C2/C5. Help: "16 bits for other targets. This determines how many times the security version can be increased."
- L58-69 `BOOTLOADER_EFUSE_SECURE_VERSION_EMULATE`, for testing with virtual eFuses.
- These are bootloader options, so the **bootloader must be built with them** (`bootloader.rst` L128: "Rollback and anti-rollback features must be configured in the bootloader as well").

### 2.2 Image states (`components/bootloader_support/include/esp_flash_partitions.h` L66-74) [V]
| State | Value | Doc comment |
|---|---|---|
| `ESP_OTA_IMG_NEW` | 0x0 | "Monitor the first boot. In bootloader this state is changed to ESP_OTA_IMG_PENDING_VERIFY." |
| `ESP_OTA_IMG_PENDING_VERIFY` | 0x1 | "First boot for this app was. If while the second boot this state is then it will be changed to ABORTED." |
| `ESP_OTA_IMG_VALID` | 0x2 | "App was confirmed as workable." |
| `ESP_OTA_IMG_INVALID` | 0x3 | "App was confirmed as non-workable. This app will not selected to boot at all." |
| `ESP_OTA_IMG_ABORTED` | 0x4 | "App could not confirm the workable or non-workable. In bootloader IMG_PENDING_VERIFY state will be changed to IMG_ABORTED." |
| `ESP_OTA_IMG_UNDEFINED` | 0xFFFFFFFF | "App can boot and work without limits." |

The otadata entry (L76-83) is `{uint32_t ota_seq; uint8_t seq_label[20]; uint32_t ota_state; uint32_t crc;}`, 32 bytes. The CRC covers `ota_seq` only.

### 2.3 Bootloader behaviour (`components/bootloader_support/src/bootloader_utility.c`, v6.1) [V]
1. **PENDING_VERIFY → ABORTED** (L393-401). On every boot, with rollback enabled, any otadata entry still `PENDING_VERIFY` is rewritten to `ABORTED`. This is what happens if the new app **resets before calling `esp_ota_mark_app_valid_cancel_rollback()`**, for any reason: power loss, panic, any WDT, `esp_restart()`.
2. **Entry validity** (`bootloader_common_loader.c` L78-86). An entry is invalid if `ota_seq == UINT32_MAX` or the state is `INVALID`/`ABORTED`, and valid only if the CRC also matches. Of two valid entries, the higher `ota_seq` wins (L151-175). Slot = `(ota_seq − 1) % app_count` (L440-441).
3. **NEW → PENDING_VERIFY** (L443-449). The selected entry, if `NEW`, is set to `PENDING_VERIFY` before the app is started.
4. **Anti-rollback.** Entries whose app has `secure_version` below the eFuse value are ignored (L349-373). When the selected entry is `VALID`, the eFuse is raised to the app's `secure_version` (L451-455).
5. **No valid entry.** If a factory partition exists → factory (L457-459). Otherwise "ota data partition invalid and no factory, will try all partitions" (L460-463). With both entries blank (all 0xFF) and no factory, it boots ota_0 and writes `ota_seq` (L404-423, L488-503).
6. **Loading and fallback** (`bootloader_utility_load_boot_image`, L576-627):
   - From the selected index it works **backwards down to factory**, then **forwards** through the remaining OTA slots, then tries the `test` app.
   - Each candidate needs only a valid image and a passing anti-rollback check. The otadata state is **not** re-checked in this loop.
   - If nothing loads: "No bootable app partitions" → `bootloader_reset()`.
   - Indices: `FACTORY_INDEX (-1)`, `TEST_APP_INDEX (-2)` (`private_include/bootloader_config.h` L43-45).
   - [D] Consequence: a corrupt newest image falls back to the older slot or factory by image validation alone.

### 2.4 App-side APIs [V]
- `esp_ota_mark_app_valid_cancel_rollback()` (code L1219-1222 → L1179-1198): sets the active entry `VALID`. With anti-rollback it also **burns the eFuse secure version** (`esp_ota_set_anti_rollback()` L1063-1072 → `esp_efuse_update_secure_version`).
- `esp_ota_mark_app_invalid_rollback_and_reboot()` (L1229-1236):
  - Marks the active entry `INVALID` and calls `esp_restart()`.
  - Returns `ESP_ERR_OTA_ROLLBACK_FAILED`, without rebooting, if `esp_ota_check_rollback_is_possible()` finds no other bootable app (L1199-1203).
  - That check (L1077-1129) also accepts a valid factory image when anti-rollback is off.
- When running from factory, both calls return `ESP_FAIL` ("Running firmware is factory", L1212-1215).
- `ota.rst` L96: "a new application has only one attempt to boot successfully." `ota.rst` L120: "Perform the self-test procedure as quickly as possible, to prevent rollback due to power loss."
- Booting an `INVALID`/`ABORTED` app again is possible: `esp_ota_get_last_invalid_partition()` → `esp_ota_set_boot_partition()` (`ota.rst` L124-131).

### 2.5 Anti-rollback eFuse on ESP32-S3 [V]
- `components/efuse/esp32s3/esp_efuse_table.csv` L179: `SECURE_VERSION, EFUSE_BLK0, 142, 16, [] Secure version (used by ESP-IDF anti-rollback feature)`. TRM Table 5.3-1 p.413: "EFUSE_SECURE_VERSION 16 … Represents IDF secure version".
- Encoding is a thermometer code:
  - `components/efuse/src/esp_efuse_fields.c` L44-51: `return __builtin_popcount(secure_version & …)`.
  - L68-93: burns only the new bits, and refuses values above the field size: "Max secure version is %u…".
  - ⇒ The usable `secure_version` range is **0..16**, i.e. at most **16 increments** per chip (`ota.rst` L209 agrees: "only 16 times you can do an anti-rollback").
- The value lives in `esp_app_desc_t.secure_version` and is set by `CONFIG_BOOTLOADER_APP_SECURE_VERSION` (`ota.rst` L213-215).
- `ota.rst` L175: check `esp_efuse_check_secure_version(new_app_info.secure_version)` on the first packet, before downloading.

---

## Q3. Signed images without hardware Secure Boot (ESP32-S3)

### 3.1 Kconfig names (`components/bootloader/Kconfig.projbuild`, v6.1) [V]
- L514-523 `SECURE_SIGNED_APPS_NO_SECURE_BOOT` ("Require signed app images", depends on `!SECURE_BOOT`): "unlike hardware secure boot it does not prevent the bootloader from being physically updated. This means that the device can be secured against remote network access, but not physical access."
- L525-570, `choice SECURE_SIGNED_APPS_SCHEME`:
  - `SECURE_SIGNED_APPS_ECDSA_SCHEME` (V1) depends on `SECURE_BOOT_V1_SUPPORTED` (ESP32 only).
  - `SECURE_SIGNED_APPS_RSA_SCHEME`: "Appends the RSA-3072 based Signature block to the application."
  - `SECURE_SIGNED_APPS_ECDSA_V2_SCHEME` depends on `SECURE_BOOT_V2_ECC_SUPPORTED` → `SOC_SECURE_BOOT_V2_ECC`.
- L629-641 `SECURE_SIGNED_ON_UPDATE_NO_SECURE_BOOT` ("Verify app signature on update", default y): "any OTA updated apps will have the signature verified before being considered valid … automatically checked whenever the esp_ota_ops.h APIs are used".
- L617-627 `SECURE_SIGNED_ON_BOOT_NO_SECURE_BOOT` ("Bootloader verifies app signatures") `depends on SECURE_SIGNED_APPS_NO_SECURE_BOOT && SECURE_SIGNED_APPS_ECDSA_SCHEME`. [D] It is **not selectable on ESP32-S3**, because only the RSA scheme exists there.
- L449-466: the derived symbols `SECURE_SIGNED_ON_BOOT`, `SECURE_SIGNED_ON_UPDATE` and `SECURE_SIGNED_APPS` are what the code tests.
- L718-748: `SECURE_BOOT_BUILD_SIGNED_BINARIES` (default y) and `SECURE_BOOT_SIGNING_KEY` (default `secure_boot_signing_key.pem`; "RSA private key in PEM format for Secure Boot V2").

### 3.2 Schemes on ESP32-S3 [V]
- `components/soc/esp32s3/include/soc/soc_caps.h` L428-431: `SOC_SECURE_BOOT_V2_RSA 1`, `SOC_EFUSE_SECURE_BOOT_KEY_DIGESTS 3`, `SOC_EFUSE_REVOKE_BOOT_KEY_DIGESTS 1`, `SOC_SUPPORT_SECURE_BOOT_REVOKE_KEY 1`. There is **no** `SOC_SECURE_BOOT_V2_ECC`.
- Rendered S3 page (v6.1): "Secure Boot v2 uses RSA-PSS based app and Second Stage Bootloader verification".
- ⇒ **RSA-3072 / RSA-PSS only.** ECDSA-P256/P384 is not available on S3.
- PSS parameters (`secure-boot-v2.rst` L251): "SHA256 hash, MGF1 function, salt length 32 bytes, default trailer field 0xBC".

### 3.3 What is verified, and when [V]
| Configuration | At boot (ROM → bootloader) | At boot (bootloader → app) | On OTA (`esp_ota_end` / `esp_ota_set_boot_partition`) |
|---|---|---|---|
| No signing | — | Checksum + SHA-256 (image validity) | Checksum + SHA-256 |
| `SECURE_SIGNED_APPS_NO_SECURE_BOOT` + `…ON_UPDATE…` (S3) | — | **No signature check** | RSA-PSS signature of the new image |
| HW Secure Boot V2 | ROM verifies the bootloader | Bootloader verifies the app | App verifies the image against eFuse digests |

Sources for the table:
- `secure-boot-v2.rst` L909: "unlike hardware Secure Boot v2, the signature of the running app is not verified on boot."
- L139-151: the ROM verifies the bootloader, and the bootloader verifies the app.
- L135: "The application image is not only verified on every boot but also on each over the air (OTA) update."

Trust anchor without Secure Boot:
- `secure-boot-v2.rst` L907: "the public key that is present in the signature block of the currently running app will be used to verify the signature of a newly updated app."
- Code: `secure_boot_signatures_app.c` L154-160 ("Take trusted digest key(s) from running app") and L234-235 (`#ifdef CONFIG_SECURE_SIGNED_ON_UPDATE_NO_SECURE_BOOT const unsigned secure_boot_num_blocks = 1;`). Only block 0 of the new image is compared with block 0 of the running app (L240-268).
- Rendered S3 doc: "only the first public key in the signature block is used to verify updates if signature checking without Secure Boot is configured. If multiple trusted public keys are required, it is necessary to enable the full Secure Boot feature instead."

Start-up guard: `components/bootloader_support/src/secure_boot.c` L151-170 aborts if the running app has no valid signature block ("This app is not signed, but check signature on update is enabled in config. It won't be possible to verify any update."). It warns if there is more than one block.

### 3.4 How to sign [V]
- Build (`components/esptool_py/project_include.cmake`):
  - L433-438 adds `--secure-pad-v2` to `elf2image` for RSA signing.
  - L622-625 runs `${espsecure_py_cmd} sign-data --version 2 --keyfile <key> -o <signed>.bin <unsigned>.bin`.
- Key generation (`secure-boot-v2.rst`):
  - L499: `idf.py secure-generate-signing-key`.
  - L584: `--version 2` plus optional `--scheme rsa3072`.
  - L606 (production): `openssl genrsa -out my_secure_boot_signing_key.pem 3072`.
- Remote, HSM or pre-computed signing: L631-670. ET `docs/en/espsecure/index.rst` L43: `espsecure sign-data --version 2 --hsm --hsm-config <cfg> --output <signed> <datafile>`.
- `--append-signatures` adds up to 3 blocks (`secure-boot-v2.rst` L676, L717). `espsecure signature-info-v2 file.bin` lists them (L724).
- Public-key digest for eFuse: `espsecure digest-sbv2-public-key --keyfile key.pem --output digest.bin` (`security-features-enablement-workflows.rst` L465).

### 3.5 Signed image and signature-block layout [V]
- Secure padding (`secure-boot-v2.rst` L356-381): the app is padded to the 64 KB MMU-page boundary, then one 4 KB signature sector is appended. Example: "0 / 580 KB unsigned app; 580 / 60 KB secure padding; 640 / 4 KB signature block".
- Sector struct (`components/esp_rom/esp32s3/include/esp32s3/rom/secure_boot.h` L56-83): `ETS_SECURE_BOOT_V2_SIGNATURE_MAGIC 0xE7`, `CRC_SIGN_BLOCK_LEN 1196`, `SECURE_BOOT_NUM_BLOCKS 3`; the block is 1216 B and the sector 4096 B (static asserts).
- RSA block, offset / size:

| Offset | Size | Field |
|---|---|---|
| 0 | 1 | Magic (0xE7) |
| 1 | 1 | Version (0x02) |
| 2 | 2 | Reserved |
| 4 | 32 | SHA-256 of the image |
| 36 | 384 | RSA modulus n |
| 420 | 4 | Exponent e |
| 424 | 384 | R |
| 808 | 4 | M′ |
| 812 | 384 | RSA-PSS signature |
| 1196 | 4 | CRC32 |
| 1200 | 16 | Zero padding |

  The remaining sector bytes are 0xFF (`secure-boot-v2.rst` L216-257, L348). The block is valid if byte 0 is 0xE7 and the CRC matches (L393).

### 3.6 Key rotation and revocation
- **Without HW Secure Boot** [D from §3.3]. The new image's block 0 must be signed by the same key as the running app's block 0. **The signing key can never change over OTA.** Rotation needs a physical reflash, or moving to HW Secure Boot. There is no revocation.
- **With HW Secure Boot V2 on S3** [V]:
  - Up to 3 key digests (`secure-boot-v2.rst` L100-107, L694-705).
  - Conservative revocation via `esp_ota_revoke_secure_boot_public_key(index)` (header L450-476; code L1393-1463). It refuses unless the running app is `VALID` and both the app and the bootloader verify with a non-revoked key.
  - Optional aggressive ROM revocation via `SECURE_BOOT_AGGRESSIVE_REVOKE` / `CONFIG_SECURE_BOOT_ENABLE_AGGRESSIVE_KEY_REVOKE`. Kconfig L765-779: "This can lead to permanent bricking of the device, in case all keys are revoked".
  - Unused digest slots are revoked at app start-up unless `CONFIG_SECURE_BOOT_ALLOW_UNUSED_DIGEST_SLOTS` (`secure_boot.c` L132-142; `secure-boot-v2.rst` L469, L701). ⇒ Provision **all** digests you will ever want (2–3) before or at enable time.

---

## Q4. Secure Boot V2 on ESP32-S3, ROM download and JTAG

### 4.1 What is verified [V]
- `secure-boot-v2.rst` L139-151:
  1. The ROM checks `SECURE_BOOT_EN`.
  2. The ROM verifies the bootloader signature block(s) against the eFuse digests ("If this fails, the boot process will be aborted").
  3. The bootloader verifies the app and falls back to another validly signed app if one fails.
- eFuses (L453-469):
  - `SECURE_BOOT_EN`.
  - `KEY_PURPOSE_x = SECURE_BOOT_DIGEST0..2`.
  - `BLOCK_KEYx` holds the SHA-256 of the key material (offsets 36..812 of the block) and "must not be read-protected".
  - `KEY_REVOKEx` (CSV names `SECURE_BOOT_KEY_REVOKE0..2`, BLK0 bits 85-87).
  - `SECURE_BOOT_AGGRESSIVE_REVOKE` (bit 117).

### 4.2 What the bootloader burns on S3 when it enables Secure Boot (`components/bootloader_support/src/esp32s3/secure_boot_secure_features.c` L16-69) [V]
- `DIS_DIRECT_BOOT` (always).
- Depending on `CONFIG_SECURE_UART_ROM_DL_MODE`: `ENABLE_SECURITY_DOWNLOAD` via `esp_efuse_enable_rom_secure_download_mode()` (`components/efuse/esp32s3/esp_efuse_fields.c` L46-52: burned only if `DIS_DOWNLOAD_MODE` is 0), or `DIS_DOWNLOAD_MODE` (L30-33), or nothing ("UART ROM Download mode kept enabled - SECURITY COMPROMISED").
- Unless `CONFIG_SECURE_BOOT_ALLOW_JTAG`: `DIS_USB_JTAG`, `HARD_DIS_JTAG` (= `DIS_PAD_JTAG`, CSV L142 alias) and all 3 bits of `SOFT_DIS_JTAG`.
- `SECURE_BOOT_AGGRESSIVE_REVOKE` if configured.
- `SECURE_BOOT_EN`.
- `WR_DIS_RD_DIS`, unless `CONFIG_SECURE_BOOT_V2_ALLOW_EFUSE_RD_DIS`. With flash encryption it is deferred until the FE key is read-protected.
- Kconfig ROM-DL choice (L1232-1291):
  - `SECURE_DISABLE_ROM_DL_MODE`: "Permanently disabled".
  - `SECURE_ENABLE_SECURE_ROM_DL_MODE`: "Permanently switch to Secure mode"; `select ESPTOOLPY_NO_STUB`.
  - `SECURE_INSECURE_ALLOW_DL_MODE`: "Enabled (not recommended)".
  - The default is secure mode when `SECURE_ROM_DL_MODE_ENABLED` (`SOC_SUPPORTS_SECURE_DL_MODE && !SECURE_FLASH_ENCRYPTION_MODE_DEVELOPMENT`).
  - `SECURE_BOOT` itself also `select ESPTOOLPY_NO_STUB if !IDF_TARGET_ESP32 && !IDF_TARGET_ESP32S2` (L648).

### 4.3 ROM download after Secure Boot [V]
- **UART and USB-Serial/JTAG download remain available** in Secure Download Mode (SDM), unless `DIS_DOWNLOAD_MODE` or `DIS_USB_SERIAL_JTAG_DOWNLOAD_MODE` is burned.
- TRM §8.2 p.536, `EFUSE_ENABLE_SECURITY_DOWNLOAD`: "the secure download mode is enabled, allowing reading, writing, and erasing plaintext flash. However, it does not permit downloading code to flash for direct execution via UART, USB, or SPI interfaces, and register operations are not supported … writing to flash is allowed, but reading is not."
- **USB-OTG ROM download is gone.** `secure-boot-v2.rst` L538: "enabling Secure Boot or flash encryption disables the USB-OTG USB stack in the ROM, disallowing updates via the serial emulation or Device Firmware Update (DFU)". AR2022-004 (R1/R6) adds that `ENABLE_SECURITY_DOWNLOAD` disables OTG download. The plan uses USJ, so this does not matter here.
- Commands allowed in SDM (ET `docs/en/advanced-topics/serial-protocol.rst` L309-321): `SYNC`, `SPI_ATTACH`, `SPI_SET_PARAMS`, `CHANGE_BAUDRATE`, `FLASH_BEGIN`/`FLASH_DATA`/`FLASH_END`, `GET_SECURITY_INFO`. "Any other command (e.g., reading or writing memory, arbitrary code execution through loading to RAM, …) will result in an error." IDF `security.rst` L208-217 and Kconfig L1267-1273 say the same, and add: "In Secure UART Download mode, esptool can only work with the argument --no-stub."
- **esptool can still write signed images** in SDM. Limitations:
  - No stub.
  - `erase-flash` is not possible; only 4 KB-aligned `erase-region` works (ET `troubleshooting.rst` L320-329).
  - The ROM assumes 2 MB flash unless `--flash-size` is given (L338-342).
  - Nothing above 16 MB can be reached (L344-351).
  - No MD5 read-back verify (`esptool/cmds.py` L1934-1938: "Verifying written data…" runs only `if not encrypted and not esp.secure_download_mode`).
  - No header flash-parameter rewrite (L1656-1665).
  - No espefuse (Kconfig L801-804).
  - [D] The ROM still verifies the bootloader signature and the bootloader verifies the app. An unsigned or wrong-key image therefore just fails to boot. It can be rewritten over SDM, unless aggressive revoke burned the key slot.
- JTAG (TRM p.431, p.434, p.884):
  - `EFUSE_DIS_PAD_JTAG` "pad JTAG is permanently disabled".
  - `EFUSE_DIS_USB_JTAG` disables the USB-Serial/JTAG's JTAG function only. CDC and download are unaffected (R6 table).
  - `EFUSE_SOFT_DIS_JTAG` "Odd number of 1: Disabled. Users can re-enable JTAG by HMAC module again". The HMAC re-enable path (§21.2.2) is moot once `DIS_PAD_JTAG` is burned.
- Flash encryption interaction:
  - **Development mode**: plaintext can still be flashed and the bootloader encrypts it ("allows, indirectly, to read out the plaintext"), `flash-encryption.rst` L387. The Kconfig default then keeps download mode enabled (L1232-1239).
  - **Release mode**: "UART bootloader cannot perform flash encryption operations. New plaintext images can ONLY be downloaded using the over-the-air (OTA) scheme" (L719). `DIS_DOWNLOAD_MANUAL_ENCRYPT`, `DIS_DOWNLOAD_ICACHE` and `DIS_DOWNLOAD_DCACHE` are burned (`esp32s3/flash_encryption_secure_features.c` L19-32). The CRYPT_CNT eFuse is write-protected (L757). Serial reflash only works with ciphertext pre-encrypted with a host-held copy of the key (L763, L1012).
  - FE release also write-protects WR_DIS bit 2 (L50-58). That freezes `DIS_FORCE_DOWNLOAD`, `DIS_USB_OTG`, `DIS_PAD_JTAG`, `DIS_USB_JTAG`, `DIS_USB_SERIAL_JTAG`, `USB_PHY_SEL` and others at their current values (Kconfig L1151-1153).
  - Without FE, Secure Boot leaves a TOCTOU window: "it is possible to launch a time-of-check to time-of-use attack, where flash contents are swapped after the image is verified and running" (`secure-boot-v2.rst` L889).

### 4.4 Recommended eFuse/security configuration for this product [D]
Goals: (a) only signed firmware runs; (b) field-recoverable through ROM download with signed images; (c) end-user updates over HID.

| eFuse / option | Set? | Why |
|---|---|---|
| Secure Boot V2 (`SECURE_BOOT_EN`), RSA-3072, **2–3 digests** (`SECURE_BOOT_DIGEST0..2`), digests write-protected | **Yes** | Meets (a) on both the ROM and bootloader paths. A spare key allows rotation; unused slots get revoked automatically. |
| `ENABLE_SECURITY_DOWNLOAD` (`CONFIG_SECURE_ENABLE_SECURE_ROM_DL_MODE`) | **Yes** | Keeps USJ/UART flashing of signed images (b) and blocks RAM loading, memory and flash reads, and espefuse. |
| `DIS_DIRECT_BOOT`, `WR_DIS_RD_DIS` | Yes (automatic) | Defaults. |
| `DIS_USB_JTAG`, `DIS_PAD_JTAG`, `SOFT_DIS_JTAG` | Yes (default) | No field debug. Keep unfused dev boards. |
| `DIS_DOWNLOAD_MODE` | **No** | Kills (b). |
| `DIS_USB_SERIAL_JTAG`, `DIS_USB_SERIAL_JTAG_DOWNLOAD_MODE` | **No** | Kills the USJ recovery path (R6). |
| `DIS_FORCE_DOWNLOAD` | **No** | Needed only if the app-triggered `FORCE_DOWNLOAD_BOOT` path is kept (but see the §6.4 risk). |
| `SECURE_BOOT_AGGRESSIVE_REVOKE` | **No** | Bricking risk. Espressif's workflow doc lists it as "highly recommended" (`security-features-enablement-workflows.rst` L526-540); this is a deliberate deviation for recoverability. |
| Flash encryption | **Only if firmware confidentiality is required.** Release mode breaks plaintext ROM-download recovery (needs per-device key escrow and pre-encrypted images). Development mode is insecure. | Trade-off. |
| `BOOTLOADER_APP_ANTI_ROLLBACK` | Optional | It is the only hardware-enforced downgrade defence (16 bumps). Recovery images must then carry `secure_version` ≥ eFuse. |
| `USB_PHY_SEL` | No | R6. |

**Irreversibility:**
- Every eFuse is one-way (TRM §5.1, via R6: "Once an eFuse bit is programmed to 1, it can never be reverted to 0").
- Secure Boot, SDM, JTAG disable and key revocation are permanent.
- After Secure Boot, `WR_DIS_RD_DIS` blocks any later read-protected key (HMAC/DS) unless `CONFIG_SECURE_BOOT_V2_ALLOW_EFUSE_RD_DIS` was set at enable time (`secure-boot-v2.rst` L540-569).
- After SDM, espefuse no longer works. eFuses can then only be written by the app.

---

## Q5. App metadata a host tool can read before uploading

### 5.1 Layout [V]
- `esp_image_header_t` is 24 bytes (`components/bootloader_support/include/esp_app_format.h` L82-111, static assert L111). Fields: magic 0xE9 @0, segment_count @1, spi_mode @2, spi_speed/size @3, entry_addr @4, wp_pin @8, spi_pin_drv[3] @9, **chip_id u16 @12** (`ESP_CHIP_ID_ESP32S3 = 0x0009`, L23), min_chip_rev @14, min_chip_rev_full @15, max_chip_rev_full @17, reserved[4] @19, hash_appended @23.
- `esp_image_segment_header_t` is 8 bytes (L118-121).
- `esp_app_desc_t` (`components/esp_app_format/include/esp_app_desc.h` L21-46) is 256 bytes, magic `ESP_APP_DESC_MAGIC_WORD (0xABCD5432)`.
- Offset in the .bin (`app_image_format.rst` L119, L135): "The DROM segment of the application binary starts with the esp_app_desc_t structure … fixed offset = sizeof(esp_image_header_t) + sizeof(esp_image_segment_header_t)" = **0x20**. Code uses the same offset: `esp_ota_ops.c` L1050.
- Cross-check: the build passes `--elf-sha256-offset 0xb0` (`project_include.cmake` L429). That is 0x20 + offset 0x90 of `app_elf_sha256`, which matches.

| Field | .bin offset | Size |
|---|---|---|
| `magic_word` (0xABCD5432, LE bytes `32 54 CD AB`) | 0x20 | 4 |
| `secure_version` | 0x24 | 4 |
| `reserv1[2]` | 0x28 | 8 |
| `version[32]` | 0x30 | 32 |
| `project_name[32]` | 0x50 | 32 |
| `time[16]` | 0x70 | 16 |
| `date[16]` | 0x80 | 16 |
| `idf_ver[32]` | 0x90 | 32 |
| `app_elf_sha256[32]` | 0xB0 | 32 |
| `min_efuse_blk_rev_full` / `max_efuse_blk_rev_full` | 0xD0 / 0xD2 | 2 / 2 |
| `mmu_page_size` (log2) / `spi_flash_mode` | 0xD4 / 0xD5 | 1 / 1 |
| `reserv3[2]`, `reserv2[18]` | 0xD6 … 0x11F | 2 + 72 |

[D] The offsets are computed from the struct, which is naturally aligned with no padding. The static asserts for `sizeof == 256` and `secure_version` at offset 4 agree.

### 5.2 APIs [V]
- `esp_app_get_description()`: the running app (`esp_app_desc.h` L49-55).
- `esp_ota_get_partition_description(partition, &desc)` (header L297-311): returns `ESP_ERR_NOT_FOUND` if the magic is wrong.
- `esp_ota_get_bootloader_description()` (L313-328).
- Strings are at most 31 characters plus NUL (`app_image_format.rst` L133).
- [D] The host tool should check:
  - magic 0xE9 @0, `chip_id == 9` @12, app-desc magic @0x20.
  - `project_name` equals the device's value.
  - `secure_version` ≥ the device's eFuse value.
  - The image length is ≤ the slot size and the signature sector is present.
- The device must repeat the same checks itself and never trust the host.

---

## Q6. GPIO pad hold on ESP32-S3 (GPIO6/GPIO7 driving the TS3USB221A S/OE)

### 6.1 Hardware [V, TRM v1.8]
- §6.9 "Pin Hold Feature" (p.481): "Each GPIO pin (including the RTC pins) has an individual hold function controlled by an RTC register. When the pin is set to hold, the state is latched at that moment and will not change no matter how the internal signals change or how the IO MUX/GPIO configuration is modified. Users can use the hold function for the pins to retain the pin state through a core reset triggered by watchdog time-out or Deep-sleep events."
- RTC pins GPIO0–21: "RTC_CNTL_RTC_PAD_HOLD_REG[n] (n = 0~21) … RTC_CNTL_RTC_PAD_FORCE_HOLD, controls the global Hold signal of all RTC pins". The hold is the OR of the per-pin and global signals.
- Register 10.47 `RTC_CNTL_RTC_PAD_HOLD_REG` (0x00D8), p.620-621: bit 6 `RTC_CNTL_TOUCH_PAD6_HOLD` "Sets the touch GPIO 6 to hold", bit 7 `…TOUCH_PAD7_HOLD`. **All reset values are 0.**
- The global bit `RTC_CNTL_RTC_PAD_FORCE_HOLD` is in Register 10.29 `RTC_CNTL_RTC_PWC_REG` (p.610).
- Digital pads GPIO26–48 use `RTC_CNTL_DIG_PAD_HOLD_REG` and `RTC_CNTL_DG_PAD_FORCE_HOLD/UNHOLD`.
- Reset levels (p.527-528):
  - "Core Reset: resets the whole digital system except RTC, including … digital GPIOs"; "System Reset: resets the whole digital system, including RTC".
  - Table 7.1-1: `0x15 USB (UART) reset — Core Reset — Triggered when external USB host sends a specific command to the Serial interface of USB-Serial-JTAG`; `0x0C Software CPUx reset — CPU Reset`; `0x10 RWDT system reset — System Reset`; `0x01` chip reset by power-on, brown-out or SWD.
- Unheld default (Table 6.12-1, p.493-494): GPIO6 and GPIO7 have RST = **0**, i.e. "IE = 0 (input disabled)" with no pull. [D] After any reset that drops the hold, the pins float, so the TS3USB221A S/OE defaults must come from external resistors.

### 6.2 ESP-IDF [V]
- `gpio_hold_en()` (`components/esp_driver_gpio/include/driver/gpio.h` L416-447):
  - "its state is latched at that moment and will not change when the internal signal or the IO MUX/GPIO configuration is modified … in output mode: the output level of the GPIO will be locked … Power down or call `gpio_hold_dis` will disable this function."
  - Note 3 (L437-439) is about **digital** GPIOs in deep sleep only.
- For RTC-capable pins, `gpio_hold_en()` calls `rtc_gpio_hold_en()` (`gpio.c` L778-796), which sets `RTC_CNTL_PAD_HOLD_REG` bit `hold_force` (`esp_hal_gpio/esp32s3/include/hal/rtc_io_ll.h` L298-312).
- `gpio_hold_dis()` (gpio.h L449-466): configure the wanted level **before** releasing, otherwise the pin outputs its default.
- `gpio_force_hold_all()` (L494-510): "The hold state of all pads will be cancelled during ROM boot, so it is not recommended to use this API to hold the pads state during deepsleep and reset." `gpio_force_unhold_all()` cannot release per-pad holds (L515-516). ⇒ Use **per-pad** `gpio_hold_en(GPIO_NUM_6/7)`, not force-hold.
- IDF releases holds automatically only for wake-up pins after a deep-sleep wake (`components/esp_hw_support/sleep_gpio.c` L391-402). Nothing on the normal restart path touches them: the restart path (R6 §2.2) and `system_internal.c` contain no hold code.

### 6.3 Answer per reset type
| Event | Reset level | Per-pad hold on GPIO6/7 |
|---|---|---|
| `esp_restart()`, panic, task/interrupt WDT panic (→ `esp_rom_software_reset_cpu`, R6) | CPU | **Kept** [D: RTC domain untouched; TRM §6.9 + §7.1] |
| esptool's RTS reset through USJ (0x15), USB-JTAG reset (0x16), MWDT core reset, RWDT core reset, `RTC_CNTL_SW_SYS_RST` | Core | **Kept** [V for "core reset" per TRM §6.9; [D] that it applies to every core-reset source] |
| RWDT system reset (0x10, e.g. the `esp_restart` backup stage or the **bootloader RTC WDT**), Super WDT, glitch, brown-out | System/Chip | **Cleared** [D: system reset "including RTC"] |
| Power-on / CHIP_PU / BOOT-button power-up | Chip | **Cleared** [V: register reset value 0; gpio.h "Power down … will disable"] |
| `gpio_hold_dis()` | — | Released [V] |

- Bootloader RTC WDT: `CONFIG_BOOTLOADER_WDT_ENABLE` defaults to y with 9000 ms (`components/bootloader/Kconfig.projbuild` L281-321). It uses `WDT_STAGE_ACTION_RESET_RTC` (`bootloader_init.c` L94-98). `esp_restart_noos` arms stage 0 `RESET_SYSTEM` and stage 1 `RESET_RTC` as a backup (`system_internal.c` L86-87, R6).
- **CONFLICT.** IDF gpio.h L420-422 (and the rendered S3 page) says hold retains state when "chip or system is reset (e.g. watchdog time-out, Deep-sleep events are triggered)". TRM §6.9 says "core reset", and the register resets to 0 on chip reset. I trust the TRM; this needs a bench test.
- **Joint Download Boot.** No document says whether the ROM clears `RTC_CNTL_RTC_PAD_HOLD_REG`. The only Espressif statement is that ROM boot cancels the **force** hold (gpio.h L507). [D] Per-pad RTC holds must survive ROM SPI boot, because IDF's deep-sleep hold use case depends on it and only wake pins are released by the app (sleep_gpio.c L394-402). That they also survive the **download-mode** ROM is **UNVERIFIED**. Bench test: hold GPIO6/7, trigger the esptool USJ reset into download, and scope the pins.
- **Does the ROM touch GPIO4–9 in Joint Download Boot over USJ?** **UNVERIFIED.** The TRM documents ROM pad initialisation only for USB-OTG download (Table 33.4-2: GPIO21, GPIO38–42, R6/R1). No ROM source is public. GPIO4–9 are not strapping pins (R1). [D] A held pad is immune to IO MUX reconfiguration (TRM §6.9), so only a ROM write to the hold register could disturb it.

### 6.4 Interactions [D]
- **Normal SPI-boot path with a held switch.** Before `esp_restart()` (or before handing the PHY to USJ), drive S/OE to the target plug, call `gpio_hold_en(6)` and `gpio_hold_en(7)`, then reset. The next app must set the same levels with `gpio_set_level()` **before** `gpio_hold_dis()`.
- **Sticky `FORCE_DOWNLOAD_BOOT` under SDM** (R6 §4.3; esptool `targets/esp32s3.py` L347-358).
  - esptool's `hard_reset` clears the bit with `write_reg`, which is forbidden in SDM; the exception is swallowed.
  - [D] So on an SDM device the RTS reset after flashing re-enters download mode, because the bit survives core resets (R6), until a power cycle.
  - Mitigations, both **UNVERIFIED in SDM**:
    - (i) Enter download through the USJ DTR/RTS "download flag" sequence (TRM Table 33.3-2 via R6) instead of `FORCE_DOWNLOAD_BOOT`. The app just exposes USJ (R6 "COM mode") and esptool's normal `usb-reset` does the rest; no register write is needed.
    - (ii) Or end with `esptool --after no-reset` plus `esptool run`. That sends `FLASH_BEGIN(0,0)` and `FLASH_END(run)`, both SDM-legal (`loader.py` L1247-1251). The app then clears the bit early at start-up.

---

## Q7. TinyUSB / esp_tinyusb vendor HID with interrupt OUT

### 7.1 Descriptors (TinyUSB `src/device/usbd.h` @894ea01, L337-363) [V]
- `TUD_HID_DESCRIPTOR(_itfnum, _stridx, _boot_protocol, _report_desc_len, _epin, _epsize, _ep_interval)`: 25 bytes, IN only.
- `TUD_HID_INOUT_DESCRIPTOR(_itfnum, _stridx, _boot_protocol, _report_desc_len, _epout, _epin, _epsize, _ep_interval)`: 32 bytes, `bNumEndpoints 2`, interrupt OUT then IN, with the same size and interval.
- `TUD_HID_REPORT_DESC_GENERIC_INOUT(report_size, ...)` (`src/class/hid/hid_device.h` L462-485): usage page `HID_USAGE_PAGE_VENDOR` (0xFF00) with one Input and one Output report of `report_size` bytes and an optional report ID. It has **no Feature report**; add one by hand if wanted.

### 7.2 Callbacks and data path (`src/class/hid/hid_device.c` @894ea01) [V]
- **Interrupt OUT** (L407-416):
  - `tud_hid_set_report_cb(instance, 0, HID_REPORT_TYPE_OUTPUT, epout_buf, xferred_bytes)`. `report_id` is passed as 0 and the buffer still holds the report-ID byte if IDs are used.
  - The endpoint is re-armed right after the callback returns.
  - [D] While the callback blocks, the endpoint stays unarmed, so the host gets NAKs (back-pressure). But the whole TinyUSB task (keyboard, mouse, EP0) stalls too.
- **SET_REPORT on EP0** (L325-343):
  - Covers Output or Feature: `report_type = high byte of wValue`, `report_id = low byte`.
  - The ID byte is stripped if it matches `buf[0]`.
  - `TU_VERIFY(request->wLength <= CFG_TUD_HID_EP_BUFSIZE)`, so larger requests are **stalled**.
- **GET_REPORT** (L302-322): `tud_hid_get_report_cb(instance, report_id, report_type, buf, reqlen)`. The report ID is prepended for you. `req_len = min(wLength, CFG_TUD_HID_EP_BUFSIZE)`.
- **`CFG_TUD_HID_EP_BUFSIZE`** defaults to **64** (hid_device.h L46-47). esp_tinyusb's `tusb_config.h` does not override it (only `CFG_TUD_HID = CONFIG_TINYUSB_HID_COUNT`, L248). Overriding it cleanly from an app is UNVERIFIED (it is `#ifndef`-guarded).
- **Instances** are assigned in interface order: the first free slot whose `ep_in == 0` (L232-240).
- **Endpoint pairing**: `hidd_open` opens 1 or 2 endpoints via `usbd_open_edpt_pair(… bNumEndpoints …)` and arms OUT (L252, L265-266). ⇒ **The OUT endpoint is supported.**
- **esp_tinyusb has no own HID driver.** `CMakeLists.txt` L118-120 compiles `tinyusb/src/class/hid/hid_device.c` when `CONFIG_TINYUSB_HID_COUNT > 0`. Kconfig L311-317: `TINYUSB_HID_COUNT` `range 0 4`.
- Using the same endpoint number for IN and OUT is Espressif's own default pattern (`usb_descriptors.c` L260: `EPNUM_0_CDC, 0x80 | EPNUM_0_CDC`).

### 7.3 Endpoint budget on S3 [V/D]
- TRM §32.2.2 and TinyUSB `dwc2_esp32.h` L46-51 give `.ep_count = 7, .ep_in_count = 5, .otg_dfifo_depth = 256` (R6). `dcd_dwc2.c` L256-258 asserts the IN count, and EP0 IN is counted (L298).
- Planned set:
  - EP0
  - EP1 IN: boot keyboard (LEDs arrive via SET_REPORT on EP0)
  - EP2 IN: boot mouse
  - EP3 OUT and EP3 IN: vendor HID
  - Totals: **4 IN including EP0, out of 5; 1 OUT**; `CONFIG_TINYUSB_HID_COUNT = 3`.
- [D] FIFO check (formulas at `dcd_dwc2.c` L228-233, L284-299):
  - Top = 256 − 2×7 = 242 words, because buffer-DMA is mandatory in esp_tinyusb 3.0.0 (R6).
  - RX FIFO = 13 + 1 + 2×(64/4+1) + 2×7 = 62 words.
  - TX FIFO = 4 × 16 = 64 words.
  - 62 + 64 = 126 ≤ 242, so it fits.
- One spare IN endpoint remains. A second vendor HID interface would use it, because every HID interface needs an interrupt IN (HID 1.11 §4.4 table: Interrupt In "Required Y").

### 7.4 USB 2.0 limits ⇒ HID throughput [V/D]
- §5.7.3 (printed p.48): "The maximum allowable interrupt data payload size is 64 bytes or less for full-speed."
- §5.7.4 (p.51): "A full-speed endpoint can specify a desired period from 1 ms to 255 ms … The period provided by the system may be shorter than that desired by the device up to the shortest period defined by the USB (125 µs microframe or 1 ms frame)." Multiple transactions per (micro)frame exist only for **high-speed** high-bandwidth endpoints (p.51, §5.9).
- Table 9-13 (p.271): "For full-/low-speed interrupt endpoints, the value of this field may be from 1 to 255."
- Table 5-7 (p.50): a 64-byte full-speed interrupt transaction uses 5 % of a frame.
- [D] Ceiling: **64 B/ms = 64,000 B/s per FS interrupt endpoint per direction**. That is 63,000 B/s with a report-ID byte, and about 60,000 B/s with a 4-byte sequence/offset header.
- HID 1.11 §4.4 (printed p.10): "If a device declares an Interrupt Out endpoint then Output reports are transmitted by the host to the device through the Interrupt Out endpoint. If no Interrupt Out endpoint is declared then Output reports are transmitted … using Set_Report(Output) requests."
- MS "Sending HID Reports": "User-mode applications use WriteFile to continuously send output reports … only use HidD_SetXxx routines to set the current state of a collection."
- UNVERIFIED: the per-report rate Windows, macOS, Linux hidraw and Chrome WebHID actually achieve on the OUT pipe. Benchmark it.

### 7.5 WebHID constraints [V]
- The WHATWG blocklist blocks report access for top-level collections Generic Desktop **Mouse (0x0001/0x0002)**, **Keyboard (0x0001/0x0006)**, Keypad (0x0007), System Control (0x0080) and FIDO (0xF1D0) (`blocklist.txt` L31-42; rule semantics in spec §15). `sendReport()`, `sendFeatureReport()` and `receiveFeatureReport()` reject blocked reports with `NotAllowedError` (spec §7.4–7.6), and blocked input reports are silently dropped ("If the input report is a blocked report, abort these steps").
- ⇒ The update channel **must** be its own vendor-page top-level collection. Its own interface is the cleanest, and it is required anyway for boot-keyboard compatibility (R6).
- WHATWG §3.2: "It is relatively common for HID peripherals to allow firmware updates to be sent using custom HID reports. Device manufacturers must take care to design the firmware upgrade mechanism to verify that the firmware binary is authentic, and should also protect against downgrades".
- Chrome: WebHID ships in Chrome/Edge 89 and is not supported in Firefox or Safari. "On most Linux systems, HID devices are mapped with read-only permissions by default", so a udev rule is needed. `reportId` is 0 if the device uses no report IDs.
- Precedent: Microsoft's touchpad guideline uses "a vendor-specific top-level collection … an output report for transferring the firmware payload … without requiring a driver on the host. After a firmware upgrade, you must increment wVersionID."

### 7.6 Security fix to pick up [V]
- espressif/tinyusb commit `403b1b4988` "fix(dcd/dwc2): Fix reaction on back2back short SETUP packets" (2026-11-02), released as 0.21.0~3.
- esp-usb CHANGELOG (master, unreleased): "tinyusb: Update to version 0.21.0~3. This version includes security fix for severe vulnerabilities". **esp_tinyusb 3.0.0 bundles 0.21.0~2 (before the fix).**
- [D] Use the next esp_tinyusb release, or esp_tinyusb 2.4.x with `tinyusb ≥ 0.21.0~3`. That combination's compatibility is UNVERIFIED.

---

## Q8. Existing USB-update approaches for ESP32-S2/S3

| Approach | Transport | License | Status / limitations (verified) |
|---|---|---|---|
| **esp_tinyuf2** (IOT `components/usb/esp_tinyuf2`, v1.2.0, 2026-07-10) | USB **MSC** virtual drive with UF2 drag-and-drop, plus NVS-as-ini editing | Apache-2.0 (`license.txt`); upstream TinyUF2 is MIT | Targets S2/S3/P4/S31. Depends on `espressif/tinyusb ^0.19.0~3`, **not esp_tinyusb**; coexistence with esp_tinyusb 3.0.0's bundled stack is UNVERIFIED. Needs ≥2 OTA slots. Writes with `esp_partition_write` and commits with `esp_ota_set_boot_partition()` but **ignores its return value** (`uf2/board_flash.c` L80-92). "To use the UF2 OTA function continuously, the TinyUF2 function must be enabled in the updated APP." A bootloader-UF2 variant needs a factory partition, `CONFIG_SPI_FLASH_DANGEROUS_WRITE_ALLOWED`, and a partition-table offset 0x60000 by default. **MSC violates the HID-only requirement.** |
| **TinyUSB DFU class** (`src/class/dfu/dfu_device.h`, MIT) | DFU on EP0 control transfers (`tud_dfu_download_cb`, `tud_dfu_manifest_cb`, `tud_dfu_finish_flashing`), no extra endpoints | MIT | Exposed by esp_tinyusb Kconfig `TINYUSB_DFU_MODE_DFU` / `_DFU_RUNTIME`, `TINYUSB_DFU_BUFSIZE` default 512 (L320-342). Not HID, so no WebHID. Host needs dfu-util or libusb; the Windows driver story is UNVERIFIED. |
| **ROM USB-OTG DFU/CDC** | ROM | – | Needs `USB_PHY_SEL` (R6). Disabled by Secure Boot or FE (`secure-boot-v2.rst` L538). Errata USBOTG-4289 (R6). **Not usable here.** |
| **espp `ota` + `usb_device`** (esp-cpp, community) | Transport-agnostic OTA engine; framed protocol `[magic 0x4F54][flags][module][type][len u32][payload][crc32]` over a **WebUSB vendor** interface; host CLI `idf.py ota-usb` and `web/ota_console.html` | MIT | Not HID, but the framing and host-driven rollback ideas transfer directly. Its rollback helpers need `CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE`. |
| **HID-based OTA/bootloader for ESP32-S3** | – | – | **None found** (GitHub repo search plus web search, 2026-11-09). That none exists is UNVERIFIED. |

---

## Q9. Flash timing and total update time

### 9.1 Datasheet values [V]
GD25LQ128E Rev 1.3, §8.6 AC Characteristics, p.50-51, TA −40~85 °C (I/F grade), VCC 1.65–2.0 V. Typical values are at 25 °C.

| | typ | max |
|---|---|---|
| tPP page program (256 B) | 0.5 ms | 2.4 ms |
| tSE 4 KB sector erase | 70 ms | 400 ms |
| tBE1 32 KB block | 0.16 s | 0.8 s |
| tBE2 64 KB block | 0.3 s | 1.2 s |
| tCE chip erase | 50 s | 120 s |

The −40~105 °C table has 64 KB max 2.4 s and 32 KB max 1.5 s. The −40~125 °C table has tSE max 500 ms, tPP max 4 ms and 64 KB max 3 s.

W25Q128JW Rev G, §9.6 AC Electrical Characteristics (cont'd), printed p.65. Typical values are "TA = 25° C, VCC = 1.8V, 25% driver strength".

| | typ | max |
|---|---|---|
| tPP | 0.8 ms | 3 ms |
| tSE 4 KB | 45 ms | 400 ms |
| tBE1 32 KB | 120 ms | 1,600 ms |
| tBE2 64 KB | 150 ms | 2,000 ms |
| tCE | 40 s | 200 s |

IDF timeouts are above every one of these maxima (`spi_flash_chip_generic.c` L67-71): sector 600 ms, block 4100 ms, page 500 ms.

### 9.2 Concurrency [V]
- `spi_flash_concurrency.rst` L12-15: during erase and program "the flash is in a unreadable state. The CPU and the cache have to wait".
- L77-87: "all non-IRAM-safe interrupts will be disabled, and all other tasks are suspended. The other core will be polling in a busy loop."
- Auto-suspend supports only "XM25xxD series, GD25QxxE series, FM25Q32" (`spi_flash_optional_feature.rst` L34-49). GD25**LQ** and W25Q128JW are not listed.
- XIP-from-PSRAM keeps the cache enabled (L50-52). That is an option only on the R16V build.
- [D] On the plain-S3 build, USB transfer and flash erase/program **do not overlap**. Budget them in series.

### 9.3 Estimates [D]
Assumptions: 1 MB = 1 MiB; 60 B payload per 1 ms output report; 64 KB block erase (bulk `esp_ota_begin(size)` or 64 KB-aligned writes); 256 B pages; no overlap.

| Image | Transfer | Erase GD typ / max | Erase W25 typ / max | Program GD typ / max | Program W25 typ / max | **Total typ** (GD / W25) | Total worst (GD / W25) |
|---|---|---|---|---|---|---|---|
| 2 MiB | 35.0 s (32.8 s at 64 B) | 9.6 / 38.4 s | 4.8 / 64.0 s | 4.1 / 19.7 s | 6.6 / 24.6 s | **48.7 s / 46.4 s** | 93 s / 124 s |
| 4 MiB | 69.9 s (65.5 s at 64 B) | 19.2 / 76.8 s | 9.6 / 128 s | 8.2 / 39.3 s | 13.1 / 49.2 s | **97.3 s / 92.6 s** | 186 s / 247 s |

- With 4 KB sector erases (e.g. `OTA_WITH_SEQUENTIAL_WRITES` fed small chunks), typical erase becomes 35.8 s / 23.0 s for 2 MiB and 71.7 s / 46.1 s for 4 MiB. Worst case is 205 s and 410 s.
- With perfect overlap (XIP from PSRAM), the lower bound is the transfer time: ≈33–35 s for 2 MiB and ≈66–70 s for 4 MiB.
- Verification in `esp_ota_end` plus `esp_ota_set_boot_partition` (two full hash passes plus RSA) is not quantified (UNVERIFIED, assumed ≪ 1 s).
- Host-side reports-per-frame are UNVERIFIED, so the real transfer may be slower.

---

## UNVERIFIED items and conflicts (summary)

UNVERIFIED
1. Whether per-pad holds on GPIO6/7 survive the ROM in **Joint Download Boot**, and whether the download-mode ROM touches GPIO4–9 (USJ path). No ROM source exists; bench test required.
2. Whether `esptool run` / `FLASH_END(run)` works in SDM, and whether the USJ DTR/RTS download-flag entry avoids the sticky `FORCE_DOWNLOAD_BOOT` loop on SDM parts.
3. Actual HID OUT report rate achieved by Windows `WriteFile`, macOS IOHID, Linux hidraw and Chrome WebHID with `bInterval = 1`.
4. Whether esp_tinyusb 2.4.x builds against tinyusb 0.21.0~3+, or when esp_tinyusb ships the fix. Whether esp_tinyuf2 can coexist with esp_tinyusb 3.x.
5. Any explicit Espressif statement of a maximum app size on S3. Duration of `esp_ota_end` verification for 2–4 MB.
6. macOS permission behaviour for a vendor-page HID interface on a device that also exposes a keyboard. Windows driver binding for TinyUSB DFU.
7. Absence of any community HID-based ESP32-S3 bootloader (only searched).
8. Newer W25Q128JW datasheet revision (R3).

CONFLICTS
- A. `ota.rst` L49 says an unconfirmed app is marked "ESP_OTA_IMG_INVALID" on the next boot. The code (`bootloader_utility.c` L396-399) and the state table (`ota.rst` L90-91) say **ABORTED**.
- B. `ota.rst` L170 names a non-existent `esp_ota_mark_app_invalid_rollback_with_reboot`; the header has `…_and_reboot`. Also, the doc example at L186-189 checks `new_app_info` without copying it from the buffer first.
- C. Kconfig `SECURE_BOOT_ALLOW_SHORT_APP_PARTITION` help (L1016) says app partitions "must be a multiple of 64KB". `gen_esp32part.py` L124-127 and `partition-tables.rst` L222 require 4 KB for Secure Boot V2; only V1 needs 64 KB.
- D. TRM §8.2 p.536: SDM is "allowing reading, writing, and erasing plaintext flash" and, in the same paragraph, "writing to flash is allowed, but reading is not". esptool and IDF docs: no flash read in SDM.
- E. IDF gpio.h L420-422: hold survives "chip or system" reset. TRM §6.9: "core reset", and the hold registers reset to 0.
- F. TRM §6.9: `DIG_PAD_HOLD_REG` "n = 5~27 ↔ GPIO26~48". Register 10.48: "Set GPIO 21 to GPIO 45 to hold". Irrelevant to GPIO6/7.
- G. Espressif's enablement-workflow doc recommends `SECURE_BOOT_AGGRESSIVE_REVOKE` for production. Kconfig help warns it "can lead to permanent bricking".

---

## Recommended device-side update architecture [D]

1. **USB composition (HID-only, both plugs).**
   - Interface 0: boot keyboard (subclass 1 / protocol 1, EP1 IN).
   - Interface 1: boot mouse (subclass 1 / protocol 2, EP2 IN).
   - Interface 2: vendor HID (usage page 0xFF00) built with `TUD_HID_INOUT_DESCRIPTOR`, EP3 OUT and EP3 IN, 64 B, `bInterval = 1`. Its report descriptor adds Feature reports for control.
   - Settings: `CONFIG_TINYUSB_HID_COUNT = 3`; 4 of 5 IN endpoints used.
   - Use your own VID/PID (R6). MS touchpad guidance says to "increment wVersionID" after a firmware update. That field belongs to HID-over-I2C; bumping USB `bcdDevice` per release is my analogue [D].
2. **Protocol on interface 2.**
   - Feature `GET_INFO`: app desc fields, eFuse `secure_version`, running slot and OTA state, max image size, protocol version, security status.
   - Feature `START {size, sha256}`.
   - Output `DATA {u32 offset, ≤60 B}` (≤59 B if the interface uses report IDs).
   - Input `ACK {highest contiguous offset, status}`, sent every 4 KB.
   - Feature `END`, `ABORT`, `CONFIRM`, `REBOOT`, `ENTER_SERVICE` (USJ).
   - The host keeps a small window of reports in flight. The device copies each report from `tud_hid_set_report_cb` into a RAM ring (≥ 16–32 KB) and never blocks long inside the callback.
3. **Writer task.**
   - On `START`:
     - Reject the update if `chip_id`, magic, `project_name`, `secure_version` (`esp_efuse_check_secure_version`), or `esp_ota_check_image_validity()` fails on the first 0x120 bytes.
     - Otherwise take `esp_ota_get_next_update_partition(NULL)` and call `esp_ota_begin(part, size, &h)`. This bulk block-erases the slot; report "erasing" status. Run it in its own task and raise the task-WDT timeout.
   - Then `esp_ota_write()` strictly in order. Optionally persist the offset every 64 KB and use `esp_ota_resume()` after an unplug.
   - On `END`: `esp_ota_end()` (signature/SHA check) → `esp_ota_set_boot_partition()` → report → `esp_restart()` on `REBOOT`.
   - On error: `esp_ota_abort()`.
4. **Rollback.**
   - Settings: `CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE = y`, in the bootloader too.
   - The new app starts in `PENDING_VERIFY`. It marks itself valid only after its self-test passes, and either the host tool's `CONFIRM` or a stable-run timer (e.g. 30–60 s) for host-less boots. A reset before that rolls back automatically.
   - Never put the bootloader or partition table on the HID path.
5. **Authenticity.**
   - Development: `CONFIG_SECURE_SIGNED_APPS_NO_SECURE_BOOT` plus `…ON_UPDATE…`. This uses RSA-3072, the trust anchor is the running app's first signature block, there is no key rotation, and it gives no protection against physical flash writes.
   - Production: HW Secure Boot V2 with 2–3 key digests plus Secure Download Mode, no aggressive revoke, and no `DIS_DOWNLOAD_MODE` / USJ-download disables (table §4.4).
   - Optional: anti-rollback (16 bumps, no factory partition). Otherwise refuse downgrades in app code. That does not stop a physical attacker using SDM.
6. **Service/recovery.**
   - The `ENTER_SERVICE` command sets the switch (S/OE) for the plug the host is on, holds GPIO6/7, hands the PHY to USJ, and lets esptool's standard USJ reset sequence enter the ROM. This avoids the sticky `FORCE_DOWNLOAD_BOOT` (R6, §6.4).
   - The BOOT button at power-up stays the hardware fallback. Pads are unheld then, so the resistor defaults must route a plug to the PHY.
   - esptool needs `--no-stub --flash-size 16MB` after SDM. Bench-test both paths before burning eFuses.
7. **Versions.**
   - Pin IDF v6.1. Use TinyUSB ≥ 0.21.0~3 (via an esp_tinyusb release that bundles it).
   - Keep `CONFIG_BOOTLOADER_WDT_ENABLE`: its RTC reset returns the mux, holds and force-download bit to defaults after an early hang.
   - Set `CONFIG_PARTITION_TABLE_OFFSET = 0x10000` from day one.

## Risks
- **R1 Transfer time.** ≈ 46–49 s typical for 2 MiB and ≈ 93–97 s for 4 MiB; worst case 2–4 min. Users must not unplug. Rollback and resume mitigate this. Keep images small.
- **R2 Erase stalls.** USB, keyboard and mouse freeze during each erase and program. One 64 KB erase can take up to 2 s (W25 max) or 3 s (GD, 125 °C grade). The host must use long timeouts and status polling.
- **R3 No key rotation without HW Secure Boot.** A leaked key requires a physical reflash.
- **R4 Irreversible eFuses.** A wrong `DIS_DOWNLOAD_MODE`, aggressive revoke, or FE release without key escrow removes ROM recovery permanently.
- **R5 SDM side effects.** No stub, no flash read or verify, no espefuse, default 2 MB flash size unless `--flash-size` is given, and possibly a power cycle after flashing (UNVERIFIED).
- **R6 Pad-hold behaviour** through ROM download is unproven, and the IDF doc conflicts with the TRM. Bench test, and make the resistor defaults safe.
- **R7 TinyUSB 0.21.0~2 security bug** in esp_tinyusb 3.0.0.
- **R8 WebHID coverage.** Chromium only, and Linux needs udev rules. The native host tool must cover the rest.
- **R9 Host-confirmed `mark_valid`.** An unplug right after an update can roll the update back; a timer-based fallback needs care.
