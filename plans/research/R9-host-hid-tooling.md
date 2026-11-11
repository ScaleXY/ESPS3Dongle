# R9 — Host-side HID and flashing tooling for the ESP32-S3 dongle

Research date: 2026-11-09. Every fact below was read in this session from a primary source: spec sources, vendor documentation sources, or source code at a pinned tag or commit. Files were fetched one at a time; nothing was cloned or executed. Downloads are in `/private/tmp/claude-501/-Users-athul-Workspace-Poytle-esp-s3-dongle/8a5133a7-8352-4435-aa04-cab7a74cb041/scratchpad/r9/`.

Tags used:
- **[VERIFIED]**: quoted from the primary source.
- **[DERIVED]**: my inference from verified facts. The reasoning is shown.
- **[UNVERIFIED]**: no primary source found, or only behaviour on real hardware can settle it.
- **[CONFLICT]**: two primary sources disagree.

Device assumed throughout: VID 0x303A, PID still to be allocated. It has three HID interfaces: a boot keyboard, a mouse, and a vendor interface (usage page 0xFF00) with 64-byte interrupt IN/OUT and feature reports. The recovery identity is the ROM USB-Serial/JTAG (USJ), 303A:1001.

---

## 0. Versions and sources used

| Item | Version / commit (date) | How determined |
|---|---|---|
| Microsoft Learn, driver docs | MicrosoftDocs/windows-driver-docs `staging` @ `7908c35` (2026-11-05). The ms.date of each page is given where it is cited. | GitHub API; raw markdown |
| Microsoft Learn, DDI reference | MicrosoftDocs/windows-driver-docs-ddi `staging` @ `7515063` | raw markdown |
| Microsoft Learn, Windows app docs | MicrosoftDocs/windows-dev-docs `docs` @ `a381231` | raw markdown |
| WinRT API docs | MicrosoftDocs/winrt-api `docs` @ `4c1e916` | raw markdown |
| hidapi (C) | release **hidapi-0.15.0** (2025-05-18, tag `d6b2a97`); master @ `418d62a` (2026-11-09) | GitHub releases/tags |
| cython-hidapi (PyPI `hidapi`) | **0.15.0** (uploaded 2025-12-09), 80 wheels | PyPI JSON; GitHub tag 0.15.0 |
| pyhidapi (PyPI `hid`) | **1.0.9** (2026-02-05) | PyPI JSON; GitHub tag 1.0.9 |
| hidapi-rs (crate `hidapi`) | **2.6.7** (crates.io 2026-08-27; repo commit `8729463`) | crates.io API |
| node-hid | **v3.4.0** (2026-07-18) | GitHub release |
| Electron | **v45.2.3** (2026-11-04) | GitHub release |
| Tauri | stable **tauri-v2.12.5** (2026-10-21); pre-release v3.0.0-alpha.6 (2026-11-06) | GitHub releases |
| WebHID standard | **whatwg/hid** @ `1890d6f` (2026-11-04). Converted to a WHATWG Living Standard by commit `6b0ee7c` (2026-10-26). Published at https://hid.spec.whatwg.org/ | GitHub API |
| Web Serial standard | **whatwg/serial** @ `418b5af` (2026-10-19). Converted for WHATWG publication by `b3bee45` (2026-10-07). Published at https://serial.spec.whatwg.org/ | GitHub API |
| Chromium | `main` @ `57b8d0a` (2026-11-09). `chrome/VERSION` = 159.0.8154.0 | googlesource `?format=TEXT` |
| ChromiumOS platform2 (permission_broker) | `main` @ `ee9db33` (2026-11-09) | googlesource |
| MDN browser-compat-data | **v8.1.8** (2026-11-02) | GitHub release |
| Apple IOHIDFamily (open source) | **IOHIDFamily-2238.120.5** (imported 2026-06-15) | apple-oss-distributions |
| macOS SDK headers | Xcode MacOSX27.0.sdk (local) | local file |
| macOS running here | 27.0.1 (26A434); AppleUSBACM.kext Info.plist (local) | `sw_vers`, `plutil` |
| Linux kernel | **v7.3** (`c03c1a1`) | GitHub tag |
| systemd | **v262.2** (2026-11-05) | GitHub release |
| esptool | **v5.6.0** (2026-10-15) | GitHub release |
| esp-pylib | **v1.2.1** | GitHub tag |
| esptool-js | **v0.7.1** (2026-11-02) | GitHub release |
| espflash | **v4.7.0** (2026-10-29) | GitHub release; crates.io |
| ESP Launchpad | espressif/esp-launchpad `main` @ `804b308` (2026-10-28) | GitHub API |
| ESP Web Tools (ESPHome, not Espressif) | **10.4.0** (2026-07-15) | GitHub release |
| ESP-IDF docs | **v6.1** (2026-08-27) | raw rst |
| OpenOCD-esp32 | v0.12.0-esp32-20260831 | raw source |
| Espressif USB-JTAG Windows driver | `idf-driver-esp32-usb-jtag-2021-07-15.zip` (dl.espressif.com, referenced by espressif/idf-env `src/driver.rs`) | downloaded, INF read |
| ESP32-S3 TRM | v1.8 (text extracted in R1 of this session) | local text |
| USB 2.0 spec | `usb_20.pdf` from usb.org `usb_20_20250603.zip` | downloaded, text extracted |
| USB HID 1.11 | hid1_11.pdf (text extracted in R6) | local text |

---

## Q1. Windows

### 1.1 Keyboard and mouse top-level collections are opened by Windows for exclusive use
- **[VERIFIED]** Microsoft Learn, "Top-level collections opened by Windows for system use" (ms.date 2024-01-11), https://learn.microsoft.com/windows-hardware/drivers/hid/top-level-collections-opened-by-windows-for-system-use. The table lists:
  - `0x0001 | 0x0001 - 0x0002 | Mouse | Exclusive`
  - `0x0001 | 0x0006 - 0x0007 | Keyboard | Exclusive`
  - Consumer controls (0x000C/0x0001) and System controls (0x0001/0x0080) are opened `Shared`.
- **[VERIFIED]** "Developing Keyboard and Mouse HID Client Drivers" (ms.date 2025-04-16), Important notes:
  - "The system opens all keyboard and mouse collections for its exclusive use."
  - "Vendors should create separate, vendor specific, TLCs to exchange proprietary data between their HID client and the device. Avoid using filter drivers unless critical."
- **[VERIFIED]** hidapi 0.15.0 `windows/hid.c` L999-1015 (`hid_open_path`). It first tries `GENERIC_READ|GENERIC_WRITE`. On failure it retries with access 0. The comment reads: "System devices, such as keyboards and mice, cannot be opened in read-write mode, because the system takes exclusive control over them. This is to prevent keyloggers. However, feature reports can still be sent and received."
- **[UNVERIFIED]** I found no Microsoft text stating the exact CreateFile error code. Nor did I find Microsoft confirming that a zero-access handle can exchange feature reports. That claim comes from hidapi's comment only.
- **[VERIFIED]** The WinRT API (`Windows.Devices.HumanInterfaceDevice`, used by packaged apps) also refuses these collections. It lists "Inaccessible Usages", including Generic Desktop 0x02/0x06/0x07/0x80 and the pages 0x07, 0x0C, 0x0D and 0x20 entirely, and states: "Keyboard and mouse devices are system reserved devices". It also requires a `humanInterfaceDevice` DeviceCapability in the app manifest (winrt-api `windows_devices_humaninterfacedevice.md`).

**Answer:** a normal application cannot do read/write I/O on the keyboard or mouse collection. The vendor collection must therefore be its own top-level collection, which the plan already has.

### 1.2 Vendor TLC on the same composite device: no driver to install
- **[VERIFIED]** "USB device class drivers included in Windows" (ms.date 2025-06-11): HID (03h) → "Hidclass.sys, Hidusb.sys, Input.inf | Windows 11, Windows 10".
- **[VERIFIED]** Usage page 0xFF00 is not in the system-use table (1.1), so Windows does not take it exclusively. The Microsoft guidance quoted in 1.1 explicitly recommends separate vendor TLCs.
- **[VERIFIED]** hidapi opens with `FILE_SHARE_READ|FILE_SHARE_WRITE` and `FILE_FLAG_OVERLAPPED` (windows/hid.c L347-362). It requests no elevation.
- **[UNVERIFIED]** I found no Microsoft statement that a standard (non-admin) user can open a vendor HID collection for read/write. hidapi, Chrome WebHID and many vendor tools do this in practice. **Test on a standard-user account on Windows 10 22H2 and Windows 11.**

### 1.3 How the composite interfaces and collections appear
- **[VERIFIED]** "Standard USB identifiers" (ms.date 2024-11-05): for a composite device the generic parent driver "creates a separate PDO and generates a separate set of hardware identifiers for each interface", with device ID `USB\VID_v(4)&PID_d(4)&MI_z(2)`, where "z(2) is the interface number that is extracted from the bInterfaceNumber field".
- **[VERIFIED]** "HIDClass hardware IDs for top-level collections" (ms.date 2024-01-11) defines four cases:

  | Case | Condition | Hardware ID |
  |---|---|---|
  | 1 | single function, single TLC | `HID\Vid_v(4)&Pid_d(4)` |
  | 2 | single function, multiple TLCs | `...&Colb(2)` |
  | 3 | multi-function, single TLC | `...&MI_z(2)` |
  | 4 | multi-function, multiple TLCs | `...&MI_z(2)&Colb(2)` |

  The legend defines `b(2)` as "Collection number (only used with multiple-TLC devices.)". Also: "In Windows, the HID device setup class (HIDClass) generates a unique physical device object (PDO) for each top-level collection" (Top-level collections, ms.date 2024-06-27).
- **[DERIVED]** For our layout (each interface holds one TLC) every collection is Case 3:
  - `HID\VID_303A&PID_xxxx&MI_00` for the keyboard
  - `...&MI_01` for the mouse
  - `...&MI_02` for the vendor interface

  `&COLnn` appears only if an interface carries more than one TLC, for example if keyboard and consumer-control were combined in one interface.
- **[VERIFIED]** The HID device interface class is `GUID_DEVINTERFACE_HID = {4D1E55B2-F16F-11CF-88CB-001111000030}` (ms.date 2018-10-17). An application gets the path for `CreateFile` from `SetupDiGetDeviceInterfaceDetail` (`DevicePath` member), per "Finding and opening a HID collection" (ms.date 2024-09-18).
- **[UNVERIFIED]** The exact symbolic-link string format (e.g. `\\?\HID#VID_303A&PID_xxxx&MI_02#...#{4d1e55b2-...}`) is not documented by Microsoft. Treat it as opaque. hidapi gets the interface number by parsing the `MI_` token of the hardware ID (windows/hid.c L505-510).

### 1.4 Output, feature and input reports: APIs, sizes and timing
- **[VERIFIED]** "Sending HID reports" (ms.date 2024-09-17): "User-mode applications use WriteFile to continuously send output reports … However, only use HidD_SetXxx routines to set the current state of a collection. Some devices might not support HidD_SetOutputReport and become unresponsive if this routine is used."
- **[VERIFIED]** "Obtaining HID reports" (ms.date 2024-09-12): "an application should only use the HidD_GetXxx routines to obtain the current state of a device. If an application attempts to use HidD_GetInputReport to continuously obtain input reports, the reports can be lost."
- **[VERIFIED]** `HidD_SetOutputReport`, `HidD_SetFeature` and `HidD_GetFeature` (all ms.date 2022-04-28) share the same rules:
  - "The correct ReportBufferLength is specified by the OutputReportByteLength [resp. FeatureReportByteLength] member of a top-level collection's HIDP_CAPS".
  - The first byte must be the report ID, or zero when report IDs are not used.
  - "Only user-mode applications can call …".
- **[VERIFIED]** HIDP_CAPS (ms.date 2022-04-28): OutputReportByteLength "Specifies the maximum size, in bytes, of all the output reports. Includes the report ID … If report ID is not used, the ID value is zero." So a 64-byte report without IDs gives a 65-byte buffer on Windows.
- **[VERIFIED]** `HidD_SetNumInputBuffers` (ms.date 2019-06-19): "The HID class driver requires a minimum of two input buffers … on Windows XP and later, the maximum … is 512. The default number of input buffers is 32."
- **[VERIFIED, hidapi]** Mapping to USB transfers:
  - hidapi.h (0.15.0): `hid_write()` "will send the data on the first interrupt OUT endpoint, if one exists".
  - `hid_send_output_report()` (new in 0.15.0): "Output reports are sent over the Control endpoint as a Set_Report transfer".
  - **[UNVERIFIED]** Microsoft does not document the hidusb.sys mapping of WriteFile to interrupt OUT and HidD_SetOutputReport to control SET_REPORT.
- **[VERIFIED]** USB HID 1.11 §4.4 (printed p.10): "If a device declares an Interrupt Out endpoint then Output reports are transmitted by the host to the device through the Interrupt Out endpoint. If no Interrupt Out endpoint is declared then Output reports are transmitted … using Set_Report(Output) requests." §5.6 note (p.18): "Only Input reports are sent via the Interrupt In pipe. Feature and Output reports must be initiated by the host via the Control pipe or an optional Interrupt Out pipe." §7.2 (p.51): GET_REPORT carries footnote 1, "This request is mandatory". SET_REPORT has no footnote.
- **[VERIFIED]** USB 2.0 limits:
  - §5.7.3 (PDF p.76): "The maximum allowable interrupt data payload size is 64 bytes or less for full-speed."
  - §5.7.4 (PDF p.79): "A full-speed endpoint can specify a desired period from 1 ms to 255 ms."
- **[DERIVED]** Throughput ceiling for the vendor interface at full speed is 64 bytes per 1 ms frame per direction, so at most about 64 kB/s raw. A 2 MB image therefore takes at least about 33 s before protocol overhead.
  - **Design consequence:** a 64-byte report plus a report-ID byte is 65 bytes, which exceeds one packet. Either use **no report ID** on the vendor interface (one 64-byte input and one 64-byte output report), or carry 63 data bytes plus the ID.
- **[VERIFIED, hidapi]** Write timeout: the default is 1000 ms. hidapi_winapi.h (0.15.0) says: "The default timeout is 1sec for winapi backend … the recommended value is 5sec, e.g. to match (unconfigurable) 5sec timeout set for hidraw (linux kernel) implementation", settable with `hid_winapi_set_write_timeout()`. Linux v7.3 `drivers/hid/usbhid/hid-core.c` L959-961 sends output reports with `usb_interrupt_msg(..., USB_CTRL_SET_TIMEOUT)`, and `include/linux/usb.h` L1937 has `#define USB_CTRL_SET_TIMEOUT 5000`.

### 1.5 hidapi Windows backend notes (0.15.0)
- **[VERIFIED]**
  - `HidD_SetNumInputBuffers(device_handle, 64)` (L1018).
  - `hid_write` pads short buffers to `OutputReportByteLength` (L1085-1107: "Windows expects the number of bytes which are in the _longest_ report (plus one for the report number)").
  - `hid_send_feature_report` pads to `FeatureReportByteLength` (L1268-1290: "Any less sent and the function fails with error ERROR_INVALID_PARAMETER … Any more and HidD_SetFeature() silently truncates").
  - `hid_get_feature_report` uses `DeviceIoControl(IOCTL_HID_GET_FEATURE)` rather than `HidD_GetFeature`, because the latter "doesn't give us an actual length" (L1352).
  - `hid_enumerate` returns one entry per TLC. `usage_page`/`usage` are filled on "Windows/Mac/hidraw only" (hidapi.h L166-171).
- **[VERIFIED] Pitfall:** hidapi.h `hid_open()`: "If serial_number is NULL, the first device with the specified VID and PID is opened." On our composite device that may be the keyboard collection.
- **[DERIVED]** Always `hid_enumerate(0x303A, PID)` and pick the entry with `usage_page == 0xFF00` (or `interface_number == 2`), then call `hid_open_path()`. This applies on every OS.

---

## Q2. macOS

### 2.1 When Input Monitoring (TCC) is required
- **[VERIFIED]** macOS 27.0 SDK `IOKit.framework/Headers/hidsystem/IOHIDLib.h`:
  - `kIOHIDRequestTypeListenEvent`: "Request to listen to event through IOHIDManager/IOHIDDevice API. Access must be granted by the user … If you do not request access through the IOHIDRequestAccess call, the request will be made on the process's behalf in IOHIDManagerOpen/IOHIDDeviceOpen calls."
  - `IOHIDCheckAccess`/`IOHIDRequestAccess` are `__OSX_AVAILABLE(10.15)`.
- **[VERIFIED]** The header does not say which devices are affected. Apple's open-source IOHIDFamily does (tag IOHIDFamily-2238.120.5):
  - `IOHIDFamily/IOHIDDevice.cpp` L527-531:
    ```
    if (conformsTo(kHIDPage_GenericDesktop, kHIDUsage_GD_Keyboard) ||
        conformsTo(kHIDPage_GenericDesktop, kHIDUsage_GD_Mouse) ||
        conformsTo(kHIDPage_Digitizer, kHIDUsage_Dig_TouchPad)) {
        setProperty(kIOHIDRequiresTCCAuthorizationKey, kOSBooleanTrue);
    ```
    `conformsTo()` (L2569ff) walks that IOHIDDevice's own `DeviceUsagePairs`.
  - `IOHIDLib/IOHIDDeviceClass.m` L511-534 (the user-space `IOHIDDeviceOpen` path): it reads `kIOHIDRequiresTCCAuthorizationKey`. If YES it calls `IOHIDRequestAccess(kIOHIDRequestTypeListenEvent)`; otherwise `_tccGranted = true`. On denial it logs "TCC deny IOHIDDeviceOpen" and returns `kIOReturnNotPermitted`.
- **[VERIFIED]** Apple Support, "Control access to input monitoring on Mac" (macOS 27 guide): "Some apps can monitor your keyboard, mouse, or trackpad even when you're using other apps", under System Settings > Privacy & Security > Input Monitoring.
- **[DERIVED]** Opening the **vendor interface** (usage pairs only 0xFF00/xx, on its own USB interface, hence its own IOHIDDevice) does **not** trigger Input Monitoring. Opening the keyboard **or the mouse** interface does. Note that mouse is included, not just keyboard.
  - This rests on one IOHIDDevice per USB HID interface: hidapi reads `kUSBInterfaceNumber` per IOHIDDevice (mac/hid.c L620-637), and Chromium's chooser groups several HidDeviceInfo objects per physical device (see Q4).
  - **[UNVERIFIED]** Whether macOS 27's IOHIDFamily (source not yet published) is unchanged. Also unverified: which macOS release ships 2238.120.5.
- **[VERIFIED]** Additional IOHIDFamily rules (`IOHIDLibUserClient.cpp` L709-713):
  - For non-privileged clients: "If this is a keyboard and the client is attempting to seize, the client needs to be admin" (`kIOReturnNotPrivileged`).
  - Then `clientHasPrivilege(fClient, kIOClientPrivilegeLocalUser)`.
  - **[UNVERIFIED]** Whether an SSH (non-console) session can open the vendor interface. Test it if CI runs over SSH on a Mac.

### 2.2 hidapi macOS backend (0.15.0)
- **[VERIFIED]** `mac/hidapi_darwin.h` L51-68: "By default on Darwin platform all devices opened by HIDAPI with hid_open or hid_open_path are opened in exclusive mode (see kIOHIDOptionsTypeSeizeDevice)". `hid_darwin_set_open_exclusive(0)` switches later opens to non-exclusive. "During the initialisation by hid_init - this property is set to 1 (TRUE)" and "Calling this function before hid_init or after hid_exit has no effect." Code: mac/hid.c L473 and L1535-1538.
- **[VERIFIED]** Enumeration uses `IOHIDManagerCreate` + `IOHIDManagerSetDeviceMatching` + `IOHIDManagerCopyDevices` (L443-446, L736-741). There is **no `IOHIDManagerOpen` call**, so enumeration does not trigger TCC. Opening uses `IOHIDDeviceCreate` + `IOHIDDeviceOpen(dev->device_handle, dev->open_options)` (L1059).
- **[VERIFIED]** Output and feature reports go through `IOHIDDeviceSetReport` (L1102-1141; `hid_write` → `kIOHIDReportTypeOutput`, L1191). The input queue drops the oldest report once more than 30 are queued (L908-913, "Pop one off if we've reached 30 in the queue"). Master (unreleased) replaces this with a ring buffer, `num_input_buffers = 30`.
- **[VERIFIED]** IOHIDDeviceClass.m L588-589: when another client has seized the device, the open returns `kIOReturnExclusiveAccess` ("Device is seized, reports will be dropped until the seizing client closes").
- **[DERIVED]** Choosing the mode:
  - The hidapi default (seize) stops Chrome or another tool from receiving the vendor interface's input reports while the CLI runs. For an updater that is arguably what we want.
  - If a web page and the CLI must coexist, call `hid_darwin_set_open_exclusive(0)` after `hid_init()`.
  - Seizing the vendor interface needs no admin; only keyboards need admin to seize.
- **[VERIFIED]** node-hid v3.4.0 README "Mac notes": "if you open a device in nonExclusive mode … the os will request permission from the user to read the device". This refers to keyboards and mice.

### 2.3 WebHID in Chrome on macOS
- **[VERIFIED]** Chromium `services/device/hid/hid_service_mac.cc`:
  - It enumerates with `IOServiceAddMatchingNotification(... IOServiceMatching(kIOHIDDeviceKey) ...)` (L90-105), not IOHIDManager.
  - It opens with `IOHIDDeviceOpen(hid_device.get(), kIOHIDOptionsTypeNone)` (L175), which is non-exclusive.
  - No TCC-specific code appears in the file.
- **[DERIVED]** By 2.1, WebHID on the vendor-only interface triggers no Input Monitoring prompt. If a page were granted the keyboard or mouse interface and opened it, macOS would ask on Chrome's behalf.
  - With a `usagePage: 0xFF00` filter only the vendor interface is granted (Q4.4).
  - **[UNVERIFIED]** This has not been observed on hardware. Run a quick bench check on macOS 26 and 27.

### 2.4 Distribution: Developer ID signing, notarization, Gatekeeper
- **[VERIFIED]** "Notarizing macOS software before distribution" (developer.apple.com, fetched 2026-11-09):
  - "Beginning in macOS 10.15, all software built after June 1, 2019, and distributed with Developer ID must be notarized."
  - Requirements: sign every executable with a "Developer ID" certificate; "Enable the Hardened Runtime capability for your app and command line targets"; secure timestamp; no `get-task-allow`.
  - The notary service accepts "macOS apps", "Disk images (UDIF format)" and "Flat installer packages". ZIPs are also accepted (Customizing page).
- **[VERIFIED]** "Customizing the notarization workflow", section "Staple the ticket to your distribution": "While you can notarize a ZIP archive, you can't staple to it directly … Although tickets are created for standalone binaries, it's not currently possible to staple tickets to them."
- **[DERIVED]** A bare CLI binary can be notarized, but Gatekeeper must then fetch its ticket online. Ship CLIs inside a notarized and stapled `.pkg` or `.dmg` if offline first-run matters.
- **[VERIFIED]** Apple Developer News, "Updates to runtime protection in macOS Sequoia" (2026 fetch; dated August 6, 2024): "In macOS Sequoia, users will no longer be able to Control-click to override Gatekeeper when opening software that isn't signed correctly or notarized. They'll need to visit System Settings > Privacy & Security".
- **[VERIFIED]** Apple Platform Security, "Gatekeeper and runtime protection" (published 2024-12-19): "By default, Gatekeeper helps ensure that all downloaded software has been signed by the App Store or signed by a registered developer and notarized by Apple."
- **[UNVERIFIED]** Whether `pip install` or Homebrew-installed CLIs ever carry the quarantine attribute and get Gatekeeper-checked. Apple's pages above do not address package managers.

---

## Q3. Linux

### 3.1 hidraw
- **[VERIFIED]** kernel v7.3 `Documentation/hid/hidraw.rst` (https://docs.kernel.org/hid/hidraw.html):
  - "Hidraw uses a dynamic major number, meaning that udev should be relied on to create hidraw device nodes … applications should use libudev to locate hidraw devices".
  - read(): "the reports read using read() are the reports sent from the device on the INTERRUPT IN endpoint".
  - write(): "if the device has an INTERRUPT OUT endpoint, the report will be sent on that endpoint. If it does not, the report will be sent over the control endpoint, using a SET_REPORT transfer. The first byte of the buffer passed to write() should be set to the report number. If the device does not use numbered reports, the first byte should be set to 0."
  - `include/uapi/linux/hidraw.h` L54-56: `HIDRAW_MAX_DEVICES 64`, `HIDRAW_BUFFER_SIZE 64`.
- **[VERIFIED]** hidapi linux/hid.c (0.15.0):
  - opens with `open(path, O_RDWR | O_CLOEXEC)` (L1080)
  - `hid_write` → `write()` (L1114)
  - features → `ioctl(HIDIOCSFEATURE/HIDIOCGFEATURE)` (L1216, L1235)
  - `hid_send_output_report` → `HIDIOCSOUTPUT` (L1254), "not defined in Linux kernel headers < 5.11" (L64)
- **[VERIFIED]** systemd v262.2 `rules.d/50-udev-default.rules.in` has no hidraw permission rule. L18 is only `SUBSYSTEM=="hidraw", IMPORT{builtin}="hwdb"`.
  - `rules.d/70-uaccess.rules.in` grants uaccess to hidraw only via hwdb-tagged classes (e.g. `ENV{ID_SECURITY_TOKEN}=="?*", TAG+="uaccess"`).
  - **[DERIVED]** Our vendor hidraw node therefore needs our own rule. The Chrome documentation states the same: "On most Linux systems, HID devices are mapped with read-only permissions by default. To allow Chrome to open an HID device, you will need to add a new udev rule." (developer.chrome.com/docs/capabilities/hid)

### 3.2 udev rule: `TAG+="uaccess"` versus MODE/GROUP, location, reload
- **[VERIFIED]** hidapi 0.15.0 `udev/69-hid.rules`:
  - `KERNEL=="hidraw*", ATTRS{idVendor}=="04d8", ATTRS{idProduct}=="003f", TAG+="uaccess"` for the hidraw backend.
  - `SUBSYSTEMS=="usb", ATTRS{idVendor}==..., TAG+="uaccess"` for the libusb backend.
  - "these rules must have priority before 73-seat-late.rules … name the file /etc/udev/rules.d/70-my-application-hid.rules. Then, replug your device or run: sudo udevadm control --reload-rules && sudo udevadm trigger"
  - "the hexadecimal values for VID and PID are case sensitive and must be lower case."
  - "TAG+="uaccess" only gives permission to physically present users … If you require access … from a remote session (e.g. over SSH), add GROUP="plugdev", MODE="660"".
- **[VERIFIED]** systemd v262.2 `rules.d/73-seat-late.rules.in`: `TAG=="uaccess|xaccess-*", ENV{MAJOR}!="", RUN{builtin}+="uaccess"`. This line sits inside `{% if HAVE_ACL %}`, so it needs systemd built with ACL support.
- **[VERIFIED]** `man/sd-login.xml` (sd-login(3)): "Tag uaccess — When set, access to this device is tied to an active seat. As the session on the seat becomes active or inactive, access to the device is updated accordingly."
- **[VERIFIED]** udev(7), section "Rules Files": rules are read from "/usr/lib/udev/rules.d and /usr/local/lib/udev/rules.d, the volatile runtime directory /run/udev/rules.d and the local administration directory /etc/udev/rules.d. All rules files are collectively sorted and processed in lexicographic order … Files in /etc/ have the highest priority … Rule files must have the extension .rules".
- **[VERIFIED]** udevadm(8):
  - `control --reload`: "Reloading rules and databases does not apply any changes to already existing devices; the new configuration will only be applied to new events."
  - `trigger`: "Request device events from the kernel."
  - Hence you must reload **and** trigger, or replug.
- **[DERIVED]** Recommended rule, as e.g. `/usr/lib/udev/rules.d/70-poytle-dongle.rules` from a package or `/etc/udev/rules.d/70-poytle-dongle.rules` by hand:
  ```
  # vendor HID interface (hidraw backend / Chrome WebHID)
  KERNEL=="hidraw*", ATTRS{idVendor}=="303a", ATTRS{idProduct}=="<pid>", TAG+="uaccess"
  # ROM download (USB-Serial/JTAG) for esptool/espflash/Web Serial without dialout
  SUBSYSTEM=="tty", ATTRS{idVendor}=="303a", ATTRS{idProduct}=="1001", TAG+="uaccess"
  ```
  - The rule grants all hidraw nodes of the device, including the keyboard and mouse hidraw nodes. **[DERIVED]** To limit it to the vendor interface, add `ATTRS{bInterfaceNumber}=="02"`. **[UNVERIFIED]** That attribute match works through the parent chain; check with `udevadm info -a /dev/hidrawN`.
  - Never use `MODE="0666"`. node-hid's README example includes `SUBSYSTEM=="input", GROUP="input", MODE="0666"`, which makes every input device world-readable.
- **[VERIFIED]** ttyACM permissions by default: systemd `50-udev-default.rules.in` L47 `KERNEL=="tty[A-Z]*[0-9]|…", GROUP="dialout"`. ESP-IDF v6.1 docs (get-started/establish-serial-connection, "Adding User to dialout or uucp on Linux"): `sudo usermod -a -G dialout $USER`, or `uucp` on Arch, then re-login. espflash v4.7.0 README gives the same advice.
- **[VERIFIED]** Espressif's own OpenOCD rule (`openocd-esp32` contrib/60-openocd.rules L258): `ATTRS{idVendor}=="303a", ATTRS{idProduct}=="1001", MODE="660", GROUP="plugdev", TAG+="uaccess"`. ESP-IDF's built-in-JTAG doc says to place that file in `/etc/udev/rules.d`.

### 3.3 hidapi hidraw backend versus libusb backend
- **[VERIFIED]** hidapi README (0.15.0): "On Linux, either the hidraw or the libusb back-end can be used … choose the backend at link time by linking to either libhidapi-libusb or libhidapi-hidraw." Also: "you will need to install an udev rule file with your application for unprivileged users to be able to access HID devices".
- **[VERIFIED]** The libusb backend detaches the kernel driver, **per interface**.
  - `libusb/hid.c` L1169-1185: `if (libusb_kernel_driver_active(dev->device_handle, intf_desc->bInterfaceNumber) == 1) { res = libusb_detach_kernel_driver(...)`, then `libusb_claim_interface`.
  - On `hid_close` it calls `libusb_attach_kernel_driver` (L1723-1731).
  - L69: `DETACH_KERNEL_DRIVER` is defined on all platforms except FreeBSD.
  - L857-870 explains why usage-page enumeration is disabled: "Detaching the kernel driver is hard on the system because it will unclaim interfaces (if another app has them claimed) and the re-attachment of the driver will sometimes change /dev entry names."
- **[DERIVED]** With the libusb backend, only interface 2 (vendor) loses usbhid while the tool runs. The keyboard (MI_00) and mouse (MI_01) keep working. But:
  - (a) `/dev/hidrawN` for the vendor interface vanishes, so Chrome or another tool loses it.
  - (b) A crash before `hid_close` leaves the vendor interface unbound until replug.
  - (c) It needs access to `/dev/bus/usb/BBB/DDD` (a different udev match), not hidraw.
  - (d) No usage page is reported in `hid_enumerate`.

  **Use the hidraw backend.** The defaults agree: node-hid ("By default as of node-hid@0.7.0, the hidraw driver is used"), cython-hidapi ("On Linux, the hidraw API is now used by default, and the libusb API is not included") and hidapi-rs (`default = ["linux-static-hidraw", …]`).

### 3.4 Chrome WebHID on Linux and ChromeOS
- **[VERIFIED]** Chromium `services/device/hid/hid_service_linux.cc` L452-480 (non-ChromeOS): opens `device_node()` with `FLAG_READ | FLAG_WRITE`. On `FILE_ERROR_ACCESS_DENIED` it logs "Access denied opening device read-write, trying read-only." and retries read-only.
- **[DERIVED]** Desktop Linux Chrome needs the same hidraw udev rule as native tools. With a read-only fallback, `sendReport`/`sendFeatureReport` will fail.
- **[VERIFIED]** ChromeOS branch L407-418: `chromeos::PermissionBrokerClient::Get()->OpenPath(device_info->device_node(), ...)`. No udev rule is needed by the user; permission_broker decides. ChromiumOS platform2 permission_broker @ee9db33:
  - `deny_unsafe_hidraw_device_rule.cc` denies hidraw nodes whose top-level usages include keyboard, keypad, pointer, mouse or system-control.
  - `deny_claimed_hidraw_device_rule.cc` denies a hidraw node if another child of **the same USB interface** belongs to a non-generic subsystem, such as an `input` device with excluded capabilities ("If the underlying device presents other interfaces, deny access to the hidraw node").
- **[DERIVED]** Our vendor interface is allowed on ChromeOS only if Linux creates no `input` device for it.
  - **[UNVERIFIED]** That hid-input creates no input node for a 0xFF00-only collection. Check `ls /sys/class/hidraw/hidrawN/device/input` or `udevadm info` on a real device.
  - **Firmware rule:** put no Generic Desktop or Consumer usages in the vendor interface's descriptor.

---

## Q4. WebHID

### 4.1 Status and browser support
- **[VERIFIED]** WebHID is now a **WHATWG Living Standard** (whatwg/hid commit `6b0ee7c` "Convert specification to Bikeshed and update to WHATWG Living Standard", 2026-10-26). The new URL is https://hid.spec.whatwg.org/. The old wicg.github.io links (e.g. in Electron docs) are stale.
- **[VERIFIED]** whatwg/hid README, "Implementation Status": "It is available in browsers based on Chromium 89 and later, such as Google Chrome and Microsoft Edge. Individual Chromium-based browsers may choose to enable or disable this API. Chromium-based Android browsers do not support this API because Android itself does not provide a direct API for accessing HID devices (crbug 964441). For the same reason this API is not available in Android WebView."
- **[VERIFIED]** MDN BCD v8.1.8 `api/HID.json`:

  | Browser | Support |
  |---|---|
  | Chrome | 89 |
  | Edge | mirror (89) |
  | Opera | mirror (Opera 75, which uses Blink 89 per `browsers/opera.json`) |
  | Chrome Android | `false` |
  | WebView Android | `false` |
  | Firefox | `false` |
  | Safari | `false` |

  Status `experimental: true`.
- **[VERIFIED]** Standards positions: Mozilla #459 "WebHID" is labelled `position: negative`; WebKit #510 is labelled `position: oppose`, `concerns: security`.
- **[VERIFIED]** ChromeOS is implemented: Chromium `hid_service_linux.cc` has a `BUILDFLAG(IS_CHROMEOS)` permission-broker path (3.4).

### 4.2 Secure context, user activation, permissions policy
- **[VERIFIED]** Spec IDL: `[SecureContext] partial interface Navigator { [SameObject] readonly attribute HID hid; }`. `requestDevice` is `[Exposed=Window]`; `HID` is also exposed in dedicated and service workers (`getDevices` only).
- **[VERIFIED]** `requestDevice()` steps:
  - "If the relevant global object of this does not have transient activation, reject promise with a "SecurityError""
  - The page must be allowed to use the policy-controlled feature "hid". The "default allowlist for this feature is 'self'", so iframes need `allow="hid"`.
- **[VERIFIED]** `getDevices()` steps contain no activation requirement. It returns devices "the user has allowed the site to access … as the result of a previous call to requestDevice()".

### 4.3 Permission persistence (Chromium)
- **[VERIFIED]** `chrome/browser/hid/hid_chooser_context.cc` L177-180:
  ```
  bool HidChooserContext::CanStorePersistentEntry(const device::mojom::HidDeviceInfo& device) {
    return !device.serial_number.empty() && !device.product_name.empty();
  }
  ```
  L140-158: "Use the USB serial number as a persistent identifier. If it is unavailable, only ephemeral permissions may be granted … Ephemeral permissions are keyed by this ID and must be granted again each time the device is connected." L689-699: "If the device does not support persistent permissions then device permissions are revoked on disconnect."
- **[DERIVED] Firmware requirement:** the dongle must report a non-empty iSerialNumber and iProduct. Otherwise every reboot (normal → ROM download → normal) forces a new chooser prompt with a fresh user gesture. R6 notes that esp_tinyusb 3.0.0 defaults the serial to the eFuse MAC.
- **[VERIFIED]** `HIDDevice.forget()` exists. Chrome docs: "As forget() is available in Chrome 100 or later". Spec: forget revokes access for devices sharing the permission.

### 4.4 Blocklist and protected collections, and how our composite device is exposed
- **[VERIFIED]** Spec blocklist: `whatwg/hid/blocklist.txt` @1890d6f. Rules:
  - `{usagePage:0xF1D0}` (FIDO)
  - `{usagePage:0x0001, usage:0x0002}` (Mouse)
  - `0x0006` (Keyboard)
  - `0x0007` (Keypad)
  - `0x0080` (System Control)
  - Jabra `{vendor:0x0b0e, usagePage:0xff00, reportId:0x05, reportType:"output"}`
  - OnlyKey `{vendor:0x1d50, product:0x60fc}`

  A rule without `reportType` blocks input, output and feature reports ("blocked by a blocklist rule" algorithm). Blocked input reports are silently dropped. `sendReport`, `sendFeatureReport` and `receiveFeatureReport` reject with "NotAllowedError".
- **[VERIFIED]** Chromium implementation, `services/device/public/cpp/hid/hid_report_utils.cc` L36-67 `IsAlwaysProtected()`:
  - usage page 0x07 (Keyboard) is always protected
  - Generic Desktop Pointer, Mouse, Keyboard and Keypad are protected for `report_type != kFeature`
  - Generic Desktop System Control through System Warm Restart, and System Dock through System Display Swap, are protected

  `hid_blocklist.cc` L39-41 adds a static FIDO usage-page rule plus a list of security-key VID/PIDs. Device-level exclusion uses `IsVendorProductBlocked(vendor_id, product_id)` only (hid_device_info.cc L55-56).
- **[CONFLICT]** (minor, does not affect our vendor interface) **feature reports on keyboard and mouse collections**:
  - The spec blocklist blocks all report types there.
  - Chromium allows feature reports there (`return report_type != HidReportType::kFeature;`).
  - Chromium also protects Pointer (0x01) and wider System-control ranges that the spec file does not list.
- **[VERIFIED]** The chooser groups by physical device. `chrome/browser/ui/hid/hid_chooser_controller.cc` L30-40: "A single physical device may expose multiple HID interfaces … Group these devices so that a single chooser item is shown for each physical device."
  - Only interfaces that pass `DisplayDevice()` (filters match, not excluded) are added (L291-296, L309-348).
  - On `Select()`, every *added* interface for that item is granted and returned (L175-205).
  - Spec note: "When the user selects an item that represents multiple HID interfaces, the user agent must grant access to all the HID interfaces exposed by the device."
- **[DERIVED]** Our design: `requestDevice({filters:[{vendorId:0x303A, productId:PID, usagePage:0xFF00}]})` shows one item. It grants and returns **only the vendor interface's `HIDDevice`**, because the filter is evaluated per interface's collections. That interface has no protected collection, so all its input, output and feature reports are usable.
  - Without a `usagePage` filter, the keyboard and mouse `HIDDevice`s would also be returned. Their input and output reports would be blocked.
  - On macOS, opening them would trigger Input Monitoring (Q2).
- **[VERIFIED]** Chrome docs (capabilities/hid): "if a top-level collection has a protected usage (e.g. generic keyboard, mouse), then a website won't be able to send and receive any reports defined in that collection."

### 4.5 Filters
- **[VERIFIED]** IDL: `dictionary HIDDeviceRequestOptions { required sequence<HIDDeviceFilter> filters; sequence<HIDDeviceFilter> exclusionFilters; }` and `dictionary HIDDeviceFilter { unsigned short vendorId; unsigned short productId; unsigned short usagePage; unsigned short usage; }`.
  - "If the vendorId member is not present, productId is ignored."
  - "If the usagePage member is not present, usage is ignored."
  - "When no filters are provided, all connected devices matching no exclusion filters are included." An empty `exclusionFilters` list is a TypeError.

### 4.6 Report semantics
- **[VERIFIED]** `sendReport(reportId, data)`, `sendFeatureReport(reportId, data)`, `receiveFeatureReport(reportId)`:
  - "If the HID interface does not use report IDs, pass 0 … the report ID value 0 is reserved".
  - A mismatch (0 with IDs, or non-0 without IDs) rejects with TypeError.
  - An OS failure rejects with "NetworkError".
  - The device must be `opened`, otherwise InvalidStateError.
- **[VERIFIED]** `inputreport` event: "If the HID interface uses report IDs, the byte sequence MUST NOT include the report ID byte"; `reportId` is 0 when IDs are not used.
- **[VERIFIED]** `receiveFeatureReport` note: "If the device uses report IDs the first byte may be the report ID. This byte is included because the device may respond with other data in place of the report ID."
  - Chromium's behaviour is platform- and flag-dependent. `hid_connection_win.cc` L344-350 strips a leading zero under `kHidGetFeatureReportFix`. `hid_connection_mac.cc` L135-139 sizes the buffer differently under `kHidReportRequestExactLength`.
  - **[DERIVED]** Parse feature replies defensively (magic/version byte), or keep the bulk protocol on output/input reports.
- **[VERIFIED]** Size checks in Chromium `services/device/hid/hid_connection.cc`:
  - Write L80-100: "Output report buffer too long (… > max_output_report_size + 1)" fails the write; the page sees NetworkError.
  - A device with `max_output_report_size() == 0` cannot take output reports.
  - The Windows path pads every write to `max_output_report_size() + 1` and calls `WriteFile` (hid_connection_win.cc L182-205).
  - The spec itself defines no report-size limit; the limit comes from the report descriptor.

### 4.7 Electron (desktop shell reuse of WebHID)
- **[VERIFIED]** Electron v45.2.3, `docs/api/session.md`, "Event: 'select-hid-device'": "Emitted when a HID device needs to be selected when a call to navigator.hid.requestDevice is made. callback should be called with deviceId to be selected; passing no arguments to callback will cancel the request." `docs/tutorial/devices.md`:
  - `ses.setDevicePermissionHandler` "can be used to provide default permissioning to devices without first calling … requestDevice".
  - "the default behavior of Electron is to store granted device permission through the lifetime of the corresponding WebContents".
  - "By default Electron employs the same blocklist used by Chromium" (`disable-hid-blocklist` switch to override).
  - Web Serial requires handling `select-serial-port`.
  - Electron's licence is MIT.

---

## Q5. Web Serial, esptool-js, esptool, espflash

### 5.1 Web Serial support
- **[VERIFIED]** Web Serial is a **WHATWG standard** (whatwg/serial commit `b3bee45` "Convert the specification for publication by the WHATWG", 2026-10-07), at https://serial.spec.whatwg.org/. README "Implementation Status":
  - "The Blink implementation is available in browsers based on Chromium 89 and later … The initial release was limited to desktop OSes (Windows, macOS, Linux, and ChromeOS) however as of Chromium 148 this API is available on Android-based devices as well."
  - "The Gecko implementation is available in browsers based on Firefox 151 and later on desktop OSes (Windows, macOS, and Linux)."
- **[VERIFIED]** MDN BCD v8.1.8 `api/Serial.json`:

  | Browser | Support |
  |---|---|
  | Chrome | 89 |
  | Chrome Android | 148 (138-147 partial: "Serial ports are only available if they're provided by Bluetooth RFCOMM serial port emulation.") |
  | Firefox | 151 (2026-05-19) |
  | Firefox Android | false |
  | Safari | false |
  | WebView Android | false |
- **[VERIFIED]** MDN Firefox 151 release notes: Web Serial "is supported on desktop platforms … Use of the API will require that website users install a synthetically generated site permission add-on — this is the same approach used to safely manage access to WebMIDI."
- **[VERIFIED]** Chrome 148 release notes (stable May 5, 2026): "Web Serial API on Android … Now it is supported on Android." In the blink-dev Intent to Ship (2026-03-26), Garfield Tan writes: "only devices configured to expose wired serial ports will return non-empty lists of serial ports. All other devices will always return empty lists."
  - **[UNVERIFIED]** Whether an S3 USJ (CDC-ACM over USB-OTG cable) appears on typical Android phones.
- **[VERIFIED]** Chrome docs (capabilities/serial): "The Web Serial API is available on all desktop platforms (ChromeOS, Linux, macOS, and Windows) in Chrome 89." (The page still describes the WebUSB polyfill for Android, so it is out of date.)
- **[VERIFIED]** Spec: `[SecureContext]`. `requestPort()` rejects "SecurityError" without transient activation and needs the policy-controlled feature "serial". Filters are `usbVendorId`/`usbProductId`/`bluetoothServiceClassId` ("If usbProductId is specified then usbVendorId must also be specified"). `setSignals({dataTerminalReady, requestToSend, break})`.
- **[VERIFIED]** Chromium `chrome/browser/serial/serial_chooser_context.cc` L542-564: a persistent Web Serial permission needs a display name. On Windows it also needs `device_instance_id`; elsewhere it needs `has_vendor_id && has_product_id && serial_number non-empty`.
  - **[UNVERIFIED]** The USJ's USB serial-number string.
- **[DERIVED] UX consequence:** going from HID mode to ROM download means a **new USB identity** (303A:1001 CDC). A web updater must ask for a second user click (`requestPort`) unless a persistent serial permission already exists for that port.

### 5.2 esptool-js (v0.7.1, 2026-11-02)
- **[VERIFIED]** Licence: Apache-2.0 (`LICENSE`, `package.json` `"license": "Apache-2.0"`; README: "licensed under Apache 2.0 license").
- **[VERIFIED]** README: "based on Web Serial API and works in Google Chrome and Microsoft Edge version 89 or later browsers and Google Chrome on Android version 61 or later via the web-serial-polyfill compatibility layer." "esptool-js doesn't implement generation of binary images out of ELF files". There is no espefuse/espsecure equivalent. The live demo is at https://espressif.github.io/esptool-js/.
  - **[UNVERIFIED]** That esptool-js works on Firefox 151+.
- **[VERIFIED]** ESP32-S3 is supported (`src/targets/esp32s3.ts`; stub `src/targets/stub_flasher/esp32s3.json`).
- **[VERIFIED]** USB-Serial/JTAG reset into the ROM:
  - `src/esploader.ts` L36 `USB_JTAG_SERIAL_PID = 0x1001`.
  - L566-568 `isUsbJtagSerialPort()` compares Web Serial `getInfo()` VID/PID.
  - L618-630 `constructResetSequence()`: `if (mode === "usb_reset" || this.isUsbJtagSerialPort()) … usbJTAGSerialReset`.
  - `src/reset.ts` L104-129 `UsbJtagSerialReset`: RTS0 DTR0 → 100 ms → DTR1 RTS0 → 100 ms → RTS1 DTR0 RTS1 → 100 ms → RTS0 DTR0. This matches esptool's sequence.
  - `webserial.ts` L489-496: `setRTS` re-sends DTR as a "Work-around for adapters on Windows using the usbser.sys driver".
- **[VERIFIED] Behaviour after flashing (two gaps versus Python esptool):**
  1. `src/reset.ts` L145-160 `HardReset.reset()` (non-OTG path): `await sleep(100); await this.transport.setRTS(false);`. It **never asserts RTS** first. esptool, via esp-pylib v1.2.1 `serial_reset.py` L438-441 `hard_reset()`, does `set_rts(port, PIN_LOW)  # EN=LOW` → sleep → `set_rts(port, PIN_HIGH)`. The same esptool-js code has been there since 2023 (commit `e107099a0c`). `after("hard_reset")` logs "Hard resetting via RTS pin..." (esploader.ts L2058-2066).
  2. esptool v5.6.0 `esptool/targets/esp32s3.py` L347-356 `hard_reset()` first does `write_reg(RTC_CNTL_OPTION1_REG, 0, RTC_CNTL_FORCE_DOWNLOAD_BOOT_MASK)`, with the comment "Clear force download boot mode to avoid chip being stuck in download mode after reset". esptool-js `esp32s3.ts` has **no** such step. Its `postConnect()` (L203-207) only adjusts `ESP_RAM_BLOCK` for USB-OTG.
  - Also: esptool `esp32s3.py` L313-336 `disable_watchdogs()` runs on connect over USJ ("When USB-JTAG/Serial is used, the RTC WDT and SWD watchdog are not reset and can then reset the board during flashing. Disable them."). esptool-js has **no** WDT/SWD handling: no match for `wdt|swd|watchdog` in `esploader.ts` or `esp32s3.ts`.
  - **[DERIVED]** If the dongle enters ROM download by setting `RTC_CNTL_FORCE_DOWNLOAD_BOOT` (R6 Q4.3), then after an esptool-js flash the web app should:
    - (a) call `esploader.writeReg(0x6000812C, 0, 0x1)` (public `writeReg(addr, value, mask)`, esploader.ts L454);
    - (b) reset with `after("custom_reset", undefined, "D0|R1|W100|R0")`. TRM Table 33.3-2 gives RTS=1/DTR=0 = "Reset ESP32-S3" and 0/0 = "Clear download mode flag".
    - (c) consider the watchdog issue.
  - **[UNVERIFIED]** All three need hardware tests.
- **[VERIFIED]** esptool-js `After` modes are `"hard_reset" | "soft_reset" | "no_reset" | "no_reset_stub" | "custom_reset"` (`src/types/resetModes.ts`). There is no watchdog reset.
- **[VERIFIED]** Version note: the v0.7.1 tag's CHANGELOG has an empty "Unreleased" section and v0.7.0 (2026-09-21) as the newest entry.

### 5.3 Espressif web flashers
- **[VERIFIED]** ESP Launchpad (espressif/esp-launchpad @804b308, Apache-2.0):
  - "A browser with Web Serial support, such as Google Chrome or Microsoft Edge"
  - `package.json` `"esptool-js": "^0.7.0"`
  - Supports a TOML config for "Publish your own firmware apps", and a "Minimal Launchpad" one-click page: `https://espressif.github.io/esp-launchpad/minimal-launchpad/?flashConfigURL=<URL_TO_YOUR_TOML>`.
- **[VERIFIED]** ESP Web Tools 10.4.0 is an ESPHome project, not Espressif. Licence Apache-2.0; it depends on `esptool-js ^0.6.0`.

### 5.4 esptool (Python) v5.6.0
- **[VERIFIED]** Licence: `pyproject.toml` `license = "GPL-2.0-or-later"`. README: "released as Free Software under GNU General Public License Version 2 or later". Requires Python ≥3.10. It depends on `esp-pylib` (Apache-2.0, v1.2.1 LICENSE) and `pyserial` (BSD, 3.5).
- **[VERIFIED]** Public API (`docs/en/esptool/scripting.rst`): "esptool exposes a public API … The public API is the recommended way to interact with the chip programmatically."
  - `from esptool.cmds import connect_esp, attach_flash, reset_chip, run_stub, write_flash`
  - `with connect_esp() as esp: esp = run_stub(esp); attach_flash(esp); write_flash(esp, [(0, bl_file), (0x1000, fw_file)]); reset_chip(esp, "hard-reset")`
  - Also documented: `connect_with_retries`, `detect_chip`, `erase_flash`, `verify_flash`, `read_mac`, `elf2image`, `merge_bin`, `image_info`, and a custom-logger hook.
  - The low-level `ESPLoader` methods "are not a part of the public API, so they may change in between releases."
- **[VERIFIED]** Signatures in `esptool/cmds.py`:
  - `connect_esp(port=None, chip="auto", initial_baud=…, port_filter=None, before="default-reset", trace=False, connect_attempts=…, open_port_attempts=…)` (L348). `before` is one of `"default-reset"`, `"usb-reset"`, `"no-reset"`, `"no-reset-no-sync"`.
  - `write_flash(esp, addr_data, flash_freq="keep", flash_mode="keep", flash_size="keep", flash_type="nor", **kwargs)` (L1311).
  - `reset_chip(esp, reset_mode="hard-reset")` with modes hard-reset, soft-reset, no-reset, no-reset-stub, watchdog-reset (L2815).
- **[VERIFIED]** USJ handling:
  - `loader.py` L850-851 auto-selects `USBJTAGSerialReset` when the PID is 0x1001.
  - `advanced-options.rst` L46-48: "With USB-Serial/JTAG, the peripheral interprets the RTS serial control signal as a core reset. This reset does not re-sample the boot strapping pins, so a chip that entered download mode manually may remain there." `--after watchdog-reset` can then be used.
  - `troubleshooting.rst` L385-394 says the same.
  - `--port-filter vid=0x303A --port-filter pid=0x1001` (advanced-options.rst L179).

### 5.5 espflash v4.7.0 (Rust)
- **[VERIFIED]** Licence "MIT OR Apache-2.0" (Cargo.toml, crates.io). README: "Supports the ESP32, ESP32-C2/C3/C5/C6/C61, ESP32-H2/H4, ESP32-P4, and ESP32-S2/S3/S31." MSRV 1.95.0.
- **[VERIFIED]** As a library, the README (stale version string) gives `espflash = { version = "3.3", default-features = false }`. "Note that the cli module does not provide SemVer guarantees." Default features are `["cli", "update-check"]`. It uses the `serialport` crate (MPL-2.0, 4.10.1).
- **[VERIFIED]** USJ handling:
  - `connection/mod.rs` L49 `USB_SERIAL_JTAG_PID: u16 = 0x1001`.
  - `reset.rs` L174-201 `UsbJtagSerialReset`, the same sequence as esptool.
  - Hard reset after flash for USJ (`reset_after_flash` L204-227): DTR=0 → RTS=1 → DTR=0 → RTS=1 → 100 ms → RTS=0. This does assert RTS.
  - `--after watchdog-reset` exists for S3 when `can_rtc_wdt_reset()` (strap GPIO0 low **and** `OPTION1 & FORCE_DOWNLOAD_BOOT == 0`, target/mod.rs L213-223).
  - **[VERIFIED]** espflash reads `RTC_CNTL_OPTION1` (0x6000_812C) but does not clear `FORCE_DOWNLOAD_BOOT`. The same gap exists as in esptool-js.
- **[VERIFIED]** README: "It is also not possible to flash chips using the built-in USB_SERIAL_JTAG peripheral when using WSL2, because resetting also resets USB_SERIAL_JTAG peripheral, which then disconnects the chip from WSL2."

---

## Q6. Cross-platform HID libraries, app shells, distribution

### 6.1 hidapi (C) licence
- **[VERIFIED]** `LICENSE.txt`: "HIDAPI can be used under one of three licenses. 1. The GNU General Public License, version 3.0 … 2. A BSD-Style License … 3. The more liberal original HIDAPI license." Also: "An author of commercial closed-source software would likely use HIDAPI under the terms of the BSD-style license or the original HIDAPI license." `LICENSE-orig.txt`: "This software may be used by anyone for any reason so long as the copyright notice in the source files remains intact."

### 6.2 Python bindings
- **[VERIFIED]** PyPI **`hidapi`** 0.15.0 (cython-hidapi, by trezor):
  - "A Cython interface to the hidapi". Licence classifiers BSD and GPLv3 (README: "may be used by one of three licenses").
  - 80 binary wheels: win32, win_amd64, macOS x86_64/arm64, manylinux and musllinux x86_64/i686/aarch64.
  - `setup.py` compiles the embedded hidapi sources (`hid_from_embedded_hidapi()`) unless `HIDAPI_SYSTEM_HIDAPI` is set. On Linux it uses hidraw by default (`hidraw.pyx` + `linux/hid.c`, linked to `udev`).
  - Import name `hid`.
- **[VERIFIED]** PyPI **`hid`** 1.0.9 (pyhidapi), MIT: "ctypes bindings for hidapi". README: "pyhidapi is dependant upon the hidapi library, which must be installed separately". `hid/__init__.py` L10-19 searches `libhidapi-hidraw.so`, `libhidapi-libusb.so`, `libhidapi.dylib`, `hidapi.dll`, `libhidapi-0.dll`. Also import name `hid`.
- **[DERIVED]** The two packages use the same import name and will shadow each other. Pin `hidapi` (bundled wheels) for a self-contained CLI.

### 6.3 Rust `hidapi` crate 2.6.7 (MIT)
- **[VERIFIED]**
  - Cargo.toml `include` ships `/etc/hidapi/{linux,mac,windows,libusb}/*.c` and `build.rs`.
  - build.rs compiles them with `cc` (e.g. `.file("etc/hidapi/windows/hid.c")`, links `setupapi`; macOS links IOKit, CoreFoundation, AppKit).
  - Features: `default = ["linux-static-hidraw", "illumos-static-libusb"]`, plus `linux-static-libusb`, `linux-shared-*`, `linux-native` (udev + nix; no C), `windows-native` (windows-sys; no C) and `macos-shared-device`.
- **[VERIFIED]** The bundled submodule `etc/hidapi` = libusb/hidapi `ff67c77` (2024-10-30). Its VERSION file says 0.15.0, but it is 11 commits **behind** the hidapi-0.15.0 tag; `hid_send_output_report` is present.
- **[DERIVED]** It produces a single static binary with no runtime library to install.

### 6.4 node-hid v3.4.0
- **[VERIFIED]**
  - `package.json` `"license": "(MIT OR X11)"`; NAPI-based.
  - `"install": "pkg-prebuilds-verify ./binding-options.js || node-gyp rebuild"`.
  - README: "we try to provide pre-built native library binaries for the most common platforms, Node and Electron versions"; Linux prebuilds "built on Debian 10 Buster".
  - `HID.setDriverType('hidraw'|'libusb')`, default hidraw; `nonExclusive` option on macOS.
- **[CONFLICT]** Licence metadata: `package.json` says "(MIT OR X11)", but the repository's only licence file is `LICENSE-bsd.txt` (BSD-style; GitHub detects BSD-3-Clause).
- **[VERIFIED]** The README version lists are stale ("Node v10 to Node v20", "Electron v3 to Electron v24") and rely on NAPI for newer versions.

### 6.5 Electron and Tauri
- **[VERIFIED]** Electron: see Q4.7. WebHID and Web Serial come from Chromium; `select-hid-device`/`select-serial-port` must be handled.
- **[VERIFIED]** Tauri (Apache-2.0 OR MIT, `LICENSE.spdx`):
  - tauri-docs "Webview Versions": WebView2 on Windows ("based on Microsoft Edge and therefore Chromium"), WKWebView on macOS, webkit2gtk on Linux.
  - The official `tauri-apps/plugins-workspace/plugins` contains no hid or serial plugin. The listing includes autostart, barcode-scanner, …, updater, upload, websocket, window-state.
- **[DERIVED]**
  - On macOS and Linux, Tauri's WebKit has no WebHID (Safari has none, BCD).
  - HID in Tauri means a Rust command or plugin using the `hidapi` crate, and serial means `serialport`/`espflash`.
  - **[UNVERIFIED]** Whether WebView2 exposes WebHID.

### 6.6 Distribution friction
- **Windows [VERIFIED]** "SmartScreen reputation for Windows app developers" (ms.date 2026-05-04):
  - Valid OV/EV certificate: "Warning — app flagged as unrecognized until reputation accumulates; verified publisher name is displayed".
  - No signature: "'Windows protected your PC'; User must choose 'Run anyway'".
  - "EV certificates no longer bypass SmartScreen."
  - "There is no exact threshold, but it can take several weeks and hundreds of clean installs".
  - "Smart App Control will block execution of unsigned files unless the file has a positive reputation."
- **Windows [VERIFIED]** "Code signing options" (ms.date 2026-04-20):
  - Azure **Artifact Signing** (formerly Trusted Signing) costs about $9.99/month. "Organizations: USA, Canada, EU, UK. Individuals: USA and Canada only".
  - OV costs $150-300/year; "As of June 2023, the CA/Browser Forum requires private keys for OV certificates to be stored on a hardware security module (HSM) or hardware token".
  - Store MSIX packages are re-signed by Microsoft.
- **macOS [VERIFIED]** See Q2.4: Developer ID, hardened runtime, notarization, stapling (not for bare binaries). Sequoia removed the Control-click bypass.
- **Linux [VERIFIED]** udev rules live in system directories (udev(7)); reload and trigger are needed (udevadm(8)).
- **Linux [DERIVED]**
  - A `.deb`/`.rpm` can install `/usr/lib/udev/rules.d/70-….rules` and run `udevadm control --reload && udevadm trigger` in postinst.
  - An AppImage runs as the user and cannot install the rule. It needs a documented `sudo` step, or a helper that writes the rule via `pkexec`.
  - The same applies to the browser path, because Chrome on desktop Linux needs the rule too (Q3.4).
  - **[UNVERIFIED]** No AppImage project document on udev rules was found.

---

## Q7. ESP32-S3 USB-Serial/JTAG (ROM download) on each OS

- **[VERIFIED]** The USJ is a fixed composite device: CDC-ACM plus a vendor JTAG interface.
  - TRM v1.8 §33.2 (p.1243-1244): "Fixed function device, hardwired for CDC-ACM … and JTAG adapter functionality"; "2 OUT Endpoints, 3 IN Endpoints in addition to Control Endpoint 0; Up to 64-byte data payload size"; "CDC-ACM adherent serial port emulation is plug-and-play on most modern OSes"; "Together, these form an USB Composite device, which consists of an CDC-ACM USB class device as well as a vendor-specific device implementing the JTAG interface."
  - §33.3.2 (p.1247): "a host generally does not need any special installation procedures for it to function".
  - IDF v6.1 usb-serial-jtag-console.rst L17: "a fixed-function USB device that is implemented entirely in hardware, meaning that it cannot be reconfigured".
- **[VERIFIED]** The JTAG interface is interface **2**, class vendor/vendor/1:
  - Espressif's Windows driver INF (`USB_JTAG_debug_unit.inf` in `idf-driver-esp32-usb-jtag-2021-07-15.zip`, libwdi-generated, DriverVer 07/14/2021): `DeviceID = "VID_303A&PID_1001&MI_02"`, `Include = winusb.inf`.
  - OpenOCD-esp32 `esp_usb_jtag.c` L192 `#define ESP_USB_INTERFACE 1` and L651-652 `jtag_libusb_choose_interface(..., LIBUSB_CLASS_VENDOR_SPEC, LIBUSB_CLASS_VENDOR_SPEC, ESP_USB_INTERFACE, LIBUSB_TRANSFER_TYPE_BULK)`.
  - **[DERIVED]** Interfaces 0 and 1 are therefore the CDC communication and data interfaces.
- **Windows 10/11 CDC [VERIFIED]**
  - "USB serial driver (Usbser.sys)" (ms.date 2025-06-11): "If your device belongs to the communications and CDC control device class, Usbser.sys loads automatically … Windows loads the driver based on a compatible ID match", with IDs `USB\Class_02` and `USB\Class_02&SubClass_02`.
  - "USB device class drivers included in Windows": "In Windows 10, Usbser.inf loads Usbser.sys automatically as the function driver."
  - IDF v6.1 docs: the USJ port appears "as a COM* port in the Windows Device Manager".
  - TRM §33.4.2 (p.1253): "some drivers (e.g., the standard CDC-ACM driver on Windows) do not set DTR until RTS is set".
  - **[DERIVED]** Yes: usbser.sys binds automatically on Windows 10/11, with no driver package.
  - **[UNVERIFIED]** Whether the USJ descriptor uses an IAD (bDeviceClass EF/02/01). Microsoft's IAD page requires those codes "or the operating system doesn't detect the device's IADs". Without an IAD, usbccgp creates per-interface PDOs ("Enumeration of interfaces not grouped in collections"). Check once with USBView; it does not change the conclusion.
- **Windows JTAG interface [VERIFIED]**
  - Vendor Specific (FFh) has no in-box class driver; Microsoft's recommended driver is WinUSB ("USB device class drivers included in Windows").
  - IDF v6.1 configure-builtin-jtag.rst L41-65: "Windows users might get LIBUSB_ERROR_NOT_FOUND errors. To resolve this, install drivers using one of the following methods" (EIM "Install Drivers", `eim install-drivers`, or `idf-env.exe driver install --espressif`).
  - **[DERIVED]** Without that driver the MI_02 node has no function driver. Only OpenOCD/JTAG is affected; the COM port (MI_00/01) and esptool work.
  - **[UNVERIFIED]** The exact Device Manager presentation (e.g. "Other devices" with Code 28).
- **macOS [VERIFIED]**
  - IDF docs: "as /dev/cu* on Mac".
  - The macOS 27.0.1 in-box `AppleUSBACM.kext` (`com.apple.driver.usb.cdc.acm`, 5.0.0) Info.plist has personalities `AppleUSBACMControl` on `IOUSBHostInterface` matching `bInterfaceClass 2 / SubClass 2 / Protocol 0 and 1`, and `AppleUSBACMData` on class 10. So it is driverless, matched per interface.
  - **[UNVERIFIED]** The exact `/dev/cu.usbmodem<…>` naming. No Espressif or Apple text was found; Espressif only says `/dev/cu*`.
- **Linux [VERIFIED]**
  - IDF docs: "as /dev/ttyACM* on Linux".
  - kernel v7.3 `Documentation/admin-guide/devices.txt`: "166 char ACM USB modems — 0 = /dev/ttyACM0 First ACM modem".
  - Access needs group `dialout` (systemd default rule; IDF docs), or a uaccess rule (Q3.2).
  - **[UNVERIFIED]** Possible ModemManager probing of the new ttyACM; not researched.

---

## UNVERIFIED and CONFLICT summary

1. **UNVERIFIED** (Windows): a standard non-admin user can open the vendor TLC for read/write. Microsoft does not say so; test it.
2. **UNVERIFIED** (Windows): Microsoft documentation of the WriteFile → interrupt OUT and HidD_SetOutputReport → control SET_REPORT mapping. Only hidapi docs and the HID 1.11 spec state the rule.
3. **UNVERIFIED** (Windows): the symbolic-link path format. Treat it as opaque.
4. **UNVERIFIED** (macOS): IOHIDFamily-2238.120.5's TCC rule still holds in macOS 26/27. The vendor-only interface opens with no Input Monitoring prompt in hidapi and in Chrome. SSH-session behaviour.
5. **UNVERIFIED** (macOS): Gatekeeper treatment of pip- or Homebrew-installed CLIs.
6. **UNVERIFIED** (Linux/ChromeOS): no `input` node is created for the 0xFF00-only interface, which permission_broker requires. The `ATTRS{bInterfaceNumber}` narrowing works.
7. **UNVERIFIED** (Web Serial): the USJ's USB serial-number string, which decides whether Chrome stores a persistent permission. The USJ is visible to Chrome on Android 148+. esptool-js works on Firefox 151+.
8. **UNVERIFIED** (esptool-js/espflash): after an app-forced download (`RTC_CNTL_FORCE_DOWNLOAD_BOOT`), the chip re-enters download mode after a web or espflash flash unless the host clears OPTION1. esptool-js `HardReset` actually resets the chip over USJ. The missing WDT/SWD disable in esptool-js causes resets mid-flash. All of this is derived from code; test it on the board.
9. **UNVERIFIED** (Q7): whether the USJ descriptor has an IAD; the Device Manager state of MI_02 without a driver; macOS `usbmodem` naming.
10. **UNVERIFIED**: whether WebView2 (Tauri on Windows) supports WebHID; any AppImage guidance on udev rules.
11. **CONFLICT** (spec vs Chromium): feature reports on keyboard and mouse collections are blocked by blocklist.txt but allowed by Chromium `IsAlwaysProtected()`. Chromium also protects Pointer and wider System-control ranges. This does not affect the vendor interface.
12. **CONFLICT** (node-hid): `package.json` "(MIT OR X11)" versus the repo's BSD-style `LICENSE-bsd.txt`.
13. **Stale docs**:
    - Electron links the WebHID and Web Serial blocklists to wicg.github.io. Both specs are now WHATWG.
    - The Chrome Web Serial doc still describes only the WebUSB polyfill for Android.
    - The espflash README library snippet says version "3.3".
    - The esptool-js CHANGELOG lacks a v0.7.1 entry.
    - The hidapi README says keyboards and mice "are blacklisted from having hidraw nodes" (**UNVERIFIED** for current kernels; irrelevant for us).

---

## Recommended host-tool architecture

### Firmware-side requirements that came out of this host research
- **R-1.** Keep the vendor collection on its **own USB interface** (MI_02), with **no Generic Desktop, Consumer or Keyboard usages** in it. This gives:
  - no Windows exclusive open (Q1.1)
  - no macOS Input Monitoring (Q2.1)
  - no Chromium protected reports (Q4.4)
  - ChromeOS permission_broker acceptance (Q3.4)
- **R-2.** On that interface use **no report IDs** and exactly one 64-byte input and one 64-byte output report. This keeps each report in one full-speed packet (Q1.4); the host passes report ID 0 (WebHID) or a leading 0x00 byte (hidapi, Windows, hidraw). If feature reports are needed, keep them small and parse them defensively (Q4.6). Declare an interrupt OUT endpoint so `hid_write`/`write()`/`sendReport` go over interrupt OUT, not EP0 (HID 1.11 §4.4).
- **R-3.** Report a **non-empty iSerialNumber and iProduct**, so Chrome keeps WebHID permission across reboots (Q4.3).
- **R-4.** If ROM download is forced with `RTC_CNTL_FORCE_DOWNLOAD_BOOT`, every non-esptool host must clear it. Consider an exit path that does not depend on the host, such as a firmware-side clear (R6). **UNVERIFIED** feasibility.

### (a) CLI for engineers and CI: recommend Python, with Rust as the alternative
- **Recommended: Python ≥3.10 package.**
  - HID path: PyPI **`hidapi` 0.15.0**. Its wheels bundle hidapi for Windows, macOS and Linux (hidraw).
  - Recovery path: the **esptool v5 public API** (`connect_esp` → `run_stub` → `attach_flash` → `write_flash` → `reset_chip`, with `watchdog-reset` available).
  - Why: it reuses Espressif's reference flasher, including the FORCE_DOWNLOAD clear and the USJ watchdog handling (Q5.2, Q5.4), and it is pip-installable for CI.
  - Licence: esptool is **GPL-2.0-or-later**. That is fine for an internal or open-source tool. A closed-source redistributed binary that imports esptool needs legal review; calling `esptool` as a subprocess is the usual separation (**UNVERIFIED** legal position).
  - Enumerate and filter on `usage_page == 0xFF00` before opening (Q1.5). On macOS decide on `hid_darwin_set_open_exclusive()` (Q2.2).
- **Alternative: Rust single binary** using `hidapi` 2.6.7 (MIT, static C bundled) and `espflash` 4.7.0 as a library (MIT/Apache, `default-features = false`).
  - Pros: one signed static executable, no Python runtime, permissive licences.
  - Cons: you must add the S3 FORCE_DOWNLOAD clear yourself (Q5.5). The library API is less settled.
  - Choose this if the CLI ships to customers.

### (b) End-user updater: recommend a WebHID web app, with an optional thin native shell
- **Primary: an HTTPS web updater.**
  - WebHID for normal updates over the vendor interface. Web Serial with esptool-js as a recovery button behind a second explicit click.
  - Works with no install and no code signing, notarization or SmartScreen on:
    - Windows 10/11 (Chrome/Edge 89+)
    - macOS (Chrome/Edge; not Safari)
    - ChromeOS (permission_broker; no udev needed)
    - Linux Chrome, after a one-time udev rule with `TAG+="uaccess"`
  - Filters: `{vendorId:0x303A, productId:PID, usagePage:0xFF00}`. Use `getDevices()` on load to reconnect without a click (Q4.2-4.3).
  - For recovery: clear OPTION1 and use a custom reset string, because esptool-js `hard_reset` is not enough for our case (Q5.2). ESP Launchpad's minimal page can serve as an Espressif-hosted fallback (Q5.3).
- **Coverage gaps of the web path:**
  - Firefox: no WebHID; Web Serial only with an add-on, 151+.
  - Safari: neither API.
  - Android: no WebHID; Web Serial 148+ with uncertain USB support.
  - Linux users still have to install the udev rule.
- **Optional native GUI for users who cannot use Chrome or Edge:**
  - **Tauri 2 + Rust core.** Share the protocol crate with the Rust CLI: `hidapi` for HID, `espflash` for recovery. This is preferred over Electron for size, and its HID does not depend on WebKit.
  - **Electron.** Reuses the exact web code (WebHID + `select-hid-device`) but ships Chromium.
  - Either way the package must be Authenticode-signed (Artifact Signing or OV; expect initial SmartScreen warnings anyway), Developer-ID-signed, hardened and notarized (dmg/pkg), and on Linux shipped as a `.deb`/`.rpm` that installs `/usr/lib/udev/rules.d/70-…rules` (an AppImage cannot install it).

### Per-OS caveats
- **Windows:**
  - Driverless for HID (vendor TLC `HID\VID_303A&PID_xxxx&MI_02`) and for the USJ COM port (usbser).
  - JTAG (MI_02 of 303A:1001) needs Espressif's WinUSB driver, only for OpenOCD.
  - Use WriteFile (`hid_write`) for streaming. Buffers are OutputReportByteLength (65 with no ID). Set the hidapi write timeout to about 5 s.
  - Unsigned EXEs get "Windows protected your PC", and Smart App Control blocks them.
- **macOS:**
  - The vendor interface triggers no TCC prompt; the keyboard or mouse interfaces would.
  - hidapi seizes devices by default.
  - Distribution requires Developer ID, the hardened runtime and notarization. Bare CLI binaries cannot be stapled. There is no Control-click bypass since Sequoia.
- **Linux:**
  - Use the hidraw backend, not libusb.
  - Ship one rule file covering hidraw (303a:PID) and tty (303a:1001) with `TAG+="uaccess"`, named so it sorts before `73-seat-late.rules` (for example `70-…`).
  - Then run `udevadm control --reload` plus `udevadm trigger`, or replug.
  - Without the rule, Chrome falls back to read-only and writes fail.
- **ChromeOS:** WebHID and Web Serial work through permission_broker. Keep the vendor interface free of input usages.
