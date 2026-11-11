/**
 * ESP32-S3 dual-plug USB dongle — Rev A PCB (placement only, NOT routed).
 *
 * Source of truth for the netlist + placement. Derived from plans/02 (pin map,
 * §6) and plans/03 (outline, stack-up, placement). Exported to KiCad, where
 * scripts/kicad_post.py applies the JLC04161H-7628 4-layer stack-up, design
 * rules, net classes, planes and keep-outs.
 *
 * Coordinates: every `at(x, y)` below is in mm from the Type-A board edge
 * (x = 0) with y = 0 on the board centre line. +y is the ANTENNA edge,
 * -y is the USB/power edge (plans/03 §3, flipped so y is centred).
 */
import { ESP32_S3 } from "./imports/ESP32_S3"
import { GD25LQ128EWIGR } from "./imports/GD25LQ128EWIGR"
import { TPS2116DRLR } from "./imports/TPS2116DRLR"
import { TLV75733PDYDR } from "./imports/TLV75733PDYDR"
import { TS3USB221ARSER } from "./imports/TS3USB221ARSER"
import { TPD1E05U06DPYR } from "./imports/TPD1E05U06DPYR"
import { TPD1E10B06DPYR } from "./imports/TPD1E10B06DPYR"
import { XRCGB40M000F1S1BR0 } from "./imports/XRCGB40M000F1S1BR0"
import { A_2450AT18D0100002E } from "./imports/A_2450AT18D0100002E"
import { SKSVCAE010 } from "./imports/SKSVCAE010"
import { USB_212_BCW } from "./imports/USB_212_BCW"
import { TYPE_C_31_G_07 } from "./imports/TYPE_C_31_G_07"
import {
  BOARD_L,
  BOARD_W,
  boardOutline,
  at,
  J1_X,
  J2_X,
  ANT_KEEPOUT,
  ANT1_X,
  ANT1_Y,
  U1_X,
  U1_Y,
} from "./lib/geometry"

// ---------------------------------------------------------------------------
// Small helpers so each passive is one line: name, value, footprint, nets, xy
// ---------------------------------------------------------------------------
type XY = [number, number]
const R = (
  name: string,
  resistance: string,
  footprint: string,
  n1: string,
  n2: string,
  xy: XY,
  rot = 0,
  dnp = false,
) => (
  <resistor
    name={name}
    resistance={resistance}
    footprint={footprint}
    connections={{ pin1: `net.${n1}`, pin2: `net.${n2}` }}
    {...at(xy[0], xy[1])}
    pcbRotation={rot}
    doNotPlace={dnp}
  />
)
const C = (
  name: string,
  capacitance: string,
  footprint: string,
  n1: string,
  n2: string,
  xy: XY,
  rot = 0,
  dnp = false,
) => (
  <capacitor
    name={name}
    capacitance={capacitance}
    footprint={footprint}
    connections={{ pin1: `net.${n1}`, pin2: `net.${n2}` }}
    {...at(xy[0], xy[1])}
    pcbRotation={rot}
    doNotPlace={dnp}
  />
)
const L = (
  name: string,
  inductance: string,
  footprint: string,
  n1: string,
  n2: string,
  xy: XY,
  rot = 0,
) => (
  <inductor
    name={name}
    inductance={inductance}
    footprint={footprint}
    connections={{ pin1: `net.${n1}`, pin2: `net.${n2}` }}
    {...at(xy[0], xy[1])}
    pcbRotation={rot}
  />
)
/** Bottom-side (L4) Ø1.0 mm pogo test pad. */
const TP = (name: string, net: string, xy: XY) => (
  <testpoint
    name={name}
    footprintVariant="pad"
    padShape="circle"
    padDiameter="1mm"
    layer="bottom"
    connections={{ pin1: `net.${net}` }}
    {...at(xy[0], xy[1])}
  />
)
/** GND-referenced (rail-less) 1-line ESD diode, TPD1E05U06 (pin1 I/O, pin2 GND). */
const ESD_D = (name: string, net: string, xy: XY, rot = 0) => (
  <TPD1E05U06DPYR
    name={name}
    connections={{ pin1: `net.${net}`, GND: "net.GND" }}
    {...at(xy[0], xy[1])}
    pcbRotation={rot}
  />
)

export default () => (
  <board
    title="ESP32-S3 dual-plug USB dongle (Rev A)"
    layers={4}
    thickness="1.6mm"
    outline={boardOutline}
    routeRemaining={false}
    fabricatorPreset="jlcpcb_standard"
  >
    {/* ===================================================================
        J1 — USB-A plug (XUNPU USB-212-BCW, C720521). Board edge at the
        plug step, 14.70 mm behind the nose (plans/02 §4.1).
        =================================================================== */}
    <USB_212_BCW
      name="J1"
      {...at(J1_X, 0)}
      pcbRotation={-90}
      connections={{
        VCC: "net.VBUS_A",
        D_NEG: "net.USBA_D_N",
        D_POS: "net.USBA_D_P",
        GND: "net.GND",
        EH: "net.GND",
      }}
    />
    {/* Type-A ESD + VBUS input, within ~2 mm of the plug pins */}
    {ESD_D("D1", "USBA_D_P", [7.95, 1.0])}
    {ESD_D("D2", "USBA_D_N", [7.95, -1.0])}
    <TPD1E10B06DPYR
      name="D3"
      connections={{ pin1: "net.VBUS_A", pin2: "net.GND" }}
      {...at(8.05, -3.5)}
    />
    {C("C1", "1uF", "0402", "VBUS_A", "GND", [8.0, -4.75])}

    {/* ===================================================================
        Power path: U3 TPS2116 priority mux (VIN1 = VBUS_A), U4 TLV75733P LDO
        =================================================================== */}
    <TPS2116DRLR
      name="U3"
      {...at(10.4, -5.4)}
      connections={{
        VIN1: "net.VBUS_A",
        MODE: "net.VBUS_A",
        VIN2: "net.VBUS_C",
        PR1: "net.PR1",
        VOUT1: "net.VSYS",
        VOUT2: "net.VSYS",
        ST: "net.A_PWR",
        GND: "net.GND",
      }}
    />
    {R("R1", "287k", "0402", "VBUS_A", "PR1", [9.68, -3.15], 90)}
    {R("R2", "100k", "0402", "PR1", "GND", [10.68, -3.15], 90)}
    {R("R3", "10k", "0402", "A_PWR", "V3V3", [11.68, -3.15], 90)}
    {C("C2", "47uF", "1206", "VSYS", "GND", [14.5, -5.5])}
    {C("C3", "47uF", "0805", "VSYS", "GND", [10.5, -0.85], 0, true)}

    <TLV75733PDYDR
      name="U4"
      {...at(14.15, -2.4)}
      pcbRotation={90}
      connections={{
        IN: "net.VSYS",
        EN: "net.VSYS",
        GND: "net.GND",
        OUT: "net.V3V3",
        EP: "net.GND",
      }}
    />
    {C("C5", "10uF", "0603", "V3V3", "GND", [13.85, 0.45])}

    {/* ===================================================================
        U5 TS3USB221A — D+/D− follows the powering plug, disconnected until
        firmware drives OE̅ low (plans/02 §4.3)
        =================================================================== */}
    <TS3USB221ARSER
      name="U5"
      {...at(18.3, -5.4)}
      pcbRotation={-90}
      connections={{
        "1D_POS": "net.USBC_D_P",
        "1D_NEG": "net.USBC_D_N",
        "2D_POS": "net.USBA_D_P",
        "2D_NEG": "net.USBA_D_N",
        D_POS: "net.USB_SW_D_P",
        D_NEG: "net.USB_SW_D_N",
        S: "net.USB_SEL",
        N_OE: "net.USB_OE_N",
        VCC: "net.V3V3",
        GND: "net.GND",
      }}
    />
    {C("C6", "100nF", "0201", "V3V3", "GND", [17.45, -3.6])}
    {R("R4", "100k", "0201", "A_PWR", "USB_SEL", [23.6, -6.1])}
    {R("R5", "100k", "0201", "USB_OE_N", "V3V3", [20.7, -6.1])}
    {R("R6", "100k", "0201", "USB_OE_N", "GND", [22.15, -6.1], 0, true)}

    {/* ===================================================================
        U1 ESP32-S3R16V (N16R16) / ESP32-S3 (N16) / ESP32-S3R8 (N16R8)
        Same QFN56 7×7 land. Pin 1 (LNA_IN) faces the antenna corner.
        =================================================================== */}
    <ESP32_S3
      name="U1"
      {...at(U1_X, U1_Y)}
      connections={{
        LNA_IN: "net.RF_CHIP",
        VDD3P31: "net.VDD3P3",
        VDD3P32: "net.VDD3P3",
        CHIP_PU: "net.CHIP_PU",
        GPIO0: "net.BOOT",
        GPIO4: "net.A_PWR",
        GPIO5: "net.VBUS_C_SENSE",
        GPIO6: "net.USB_SEL",
        GPIO7: "net.USB_OE_N",
        GPIO8: "net.RECOVERY_BTN",
        GPIO9: "net.STATUS_LED",
        GPIO10: "net.IO10",
        GPIO11: "net.IO11",
        VDD3P3_RTC: "net.V3V3",
        GPIO19: "net.USB_D_N",
        GPIO20: "net.USB_D_P",
        VDD_SPI: "net.VDD_SPI",
        SPIHD: "net.SPI_HD",
        SPIWP: "net.SPI_WP",
        SPICS0: "net.FL_CS",
        SPICLK: "net.SPI_CLK",
        SPIQ: "net.SPI_Q",
        SPID: "net.SPI_D",
        VDD3P3_CPU: "net.V3V3",
        U0TXD: "net.U0TXD",
        U0RXD: "net.U0RXD",
        GPIO45: "net.STRAP45",
        XTAL_N: "net.XTAL_N",
        XTAL_P: "net.XTAL_P",
        VDDA1: "net.V3V3",
        VDDA2: "net.V3V3",
        EP: "net.GND",
      }}
    />

    {/* U1 EPAD: 9 × 0.3 mm GND vias in a "+" (HDG: ≥ 9 vias), tented on L4.
        The four quadrant paste windows (kicad_post.py) avoid them, so no
        via-in-pad fill/cap is needed (JLC offers it only as a 4-layer option). */}
    {[
      [0, 0], [0, 0.85], [0, -0.85], [0, 1.65], [0, -1.65],
      [0.85, 0], [-0.85, 0], [1.65, 0], [-1.65, 0],
    ].map(([dx, dy], i) => (
      <via
        key={`u1v${i}`}
        {...at(U1_X + dx, U1_Y + dy)}
        holeDiameter="0.3mm"
        outerDiameter="0.6mm"
        connectsTo="net.GND"
        tented="bottom_tented"
      />
    ))}

    {/* VDD3P3 (pins 2,3) RF supply: 10µ + 1µ + 0.1µ, 2.0 nH (≥500 mA), 0.1µ at pins */}
    {C("C7", "10uF", "0603", "V3V3", "GND", [17.9, -0.8])}
    {C("C8", "10uF", "0603", "V3V3", "GND", [28.9, -5.75], 0, true)}
    {C("C9", "1uF", "0201", "V3V3", "GND", [16.05, 0.65], 90)}
    {C("C10", "100nF", "0201", "V3V3", "GND", [16.8, 0.65], 90)}
    {L("L1", "2.0nH", "0402", "V3V3", "VDD3P3", [18.15, 0.85])}
    {C("C11", "100nF", "0201", "VDD3P3", "GND", [19.5, 0.65], 90)}

    {/* VDDA (pins 55,56): 1 µF + 10 nF */}
    {C("C12", "1uF", "0201", "V3V3", "GND", [20.55, 3.68])}
    {C("C13", "10nF", "0201", "V3V3", "GND", [20.2, 4.42])}
    {/* VDD3P3_RTC (pin 20), VDD3P3_CPU (pin 46) */}
    {C("C14", "100nF", "0201", "V3V3", "GND", [23.5, -5.3])}
    {C("C15", "100nF", "0201", "V3V3", "GND", [26.0, 4.05], 90)}

    {/* CHIP_PU RC + optional supervisor (DNP); GPIO0 strap pull-up */}
    {R("R7", "10k", "0201", "CHIP_PU", "V3V3", [19.1, -1.9])}
    {C("C16", "1uF", "0201", "CHIP_PU", "GND", [19.1, -2.65])}
    {R("R8", "10k", "0201", "BOOT", "V3V3", [28.7, 5.0])}
    <chip
      name="U6"
      manufacturerPartNumber="SUPERVISOR_3V0_SC70_TBD"
      footprint="sot323"
      pinLabels={{ pin1: "GND", pin2: "RESET_N", pin3: "VDD" }}
      connections={{ GND: "net.GND", RESET_N: "net.CHIP_PU", VDD: "net.V3V3" }}
      {...at(10.6, 1.95)}
      doNotPlace
    />

    {/* GPIO45 = VDD_SPI 1.8 V strap: 4.7k pull-up on 1.8 V-flash builds (DNP on N16R8) */}
    {R("R9", "4.7k", "0402", "STRAP45", "V3V3", [24.6, 3.85])}
    {/* UART0: 499 Ω on TX near chip, away from crystal */}
    {R("R10", "499", "0201", "U0TXD", "TP_TX", [27.3, 3.7])}

    {/* ===================================================================
        Y1 40 MHz crystal, ≥2 mm from U1; 24 nH series on XTAL_P near chip
        =================================================================== */}
    <XRCGB40M000F1S1BR0
      name="Y1"
      {...at(22.3, 5.6)}
      connections={{
        OSC1: "net.XIN",
        OSC2: "net.XTAL_N",
        NC1: "net.GND",
        NC2: "net.GND",
      }}
    />
    {L("L2", "24nH", "0201", "XTAL_P", "XIN", [22.05, 3.85])}
    {C("C17", "10pF", "0201", "XIN", "GND", [20.45, 5.5], 90)}
    {C("C18", "10pF", "0201", "XTAL_N", "GND", [24.15, 6.0], 90)}

    {/* ===================================================================
        RF: chip-side C-L-C (0201, zig-zag, stub on C19 GND pad), 0 Ω
        measurement break, antenna-side π + ESD (DNP), ANT1 thin-edge mount
        =================================================================== */}
    {C("C19", "1.5pF", "0201", "RF_CHIP", "GND", [19.5, 2.85], 90)}
    {L("L3", "2.4nH", "0201", "RF_CHIP", "RF_MID", [19.15, 1.75])}
    {C("C20", "1.5pF", "0201", "RF_MID", "GND", [18.4, 2.85], 90)}
    {R("R11", "0", "0201", "RF_MID", "RF_ANT", [17.65, 1.75])}
    {C("C21", "DNP", "0201", "RF_ANT", "GND", [16.9, 2.85], 90, true)}
    {R("R12", "0", "0201", "RF_ANT", "RF_FEED", [16.15, 1.75])}
    {C("C22", "DNP", "0201", "RF_FEED", "GND", [15.4, 2.85], 90, true)}
    <TPD1E05U06DPYR
      name="D4"
      connections={{ pin1: "net.RF_FEED", GND: "net.GND" }}
      {...at(14.0, 2.75)}
      doNotPlace
    />
    {/* Johanson 2450AT18D pins (datasheet Rev 5.0 p.2): 1 Feed / 2,3,4 GND, or —
        "can be swapped" — 4 Feed / 1,2,3 GND. Rotated 180° the feed-end lands are
        on the right (x = 16.5, against the RF-side ground plane); pin 4 is the
        lower one, nearest the π network, so pin 4 is the feed and pin 1 GND.
        Far-end lands (pins 2, 3) go to GND through the L/C tuning part R13. */}
    <A_2450AT18D0100002E
      name="ANT1"
      {...at(ANT1_X, ANT1_Y)}
      pcbRotation={180}
      connections={{
        GND3: "net.RF_FEED", // pin 4 = Feed (swapped option)
        FEED: "net.GND", // pin 1 = GND (swapped option)
        GND1: "net.ANT_END",
        GND2: "net.ANT_END",
      }}
    />
    {/* Thin-edge "L/C**" tuning part in the 0.6 mm edge ground strip; 0 Ω = direct GND */}
    {R("R13", "0", "0402", "GND", "ANT_END", [ANT1_X - 3.25, ANT1_Y + 0.6])}

    {/* ===================================================================
        USB D+/D− series (0 Ω fitted, 22 Ω option) + DNP caps near U1
        =================================================================== */}
    {R("R14", "0", "0201", "USB_SW_D_N", "USB_D_N", [25.0, -5.3])}
    {R("R15", "0", "0201", "USB_SW_D_P", "USB_D_P", [26.45, -5.3])}
    {C("C23", "DNP", "0201", "USB_D_N", "GND", [25.0, -6.1], 0, true)}
    {C("C24", "DNP", "0201", "USB_D_P", "GND", [26.45, -6.1], 0, true)}

    {/* ===================================================================
        U2 16 MB QSPI flash (GD25LQ128E 1.8 V; W25Q128JW alt; 3.3 V part on N16R8)
        0 Ω links close to U1, VDD_SPI via 0402 0 Ω bring-up link
        =================================================================== */}
    {C("C25", "100nF", "0201", "VDD_SPI", "GND", [28.85, -3.7])}
    {C("C26", "1uF", "0201", "VDD_SPI", "GND", [28.85, -4.45])}
    {R("R16", "0", "0402", "VDD_SPI", "VDD_FLASH", [31.4, -5.6])}
    {R("R17", "0", "0201", "SPI_HD", "FL_HD", [28.85, -2.95])}
    {R("R18", "0", "0201", "SPI_WP", "FL_WP", [28.85, -2.2])}
    {R("R19", "0", "0201", "SPI_CLK", "FL_CLK", [28.85, -1.0])}
    {R("R20", "0", "0201", "SPI_Q", "FL_DO", [28.85, -0.25])}
    {R("R21", "0", "0201", "SPI_D", "FL_DI", [28.85, 0.5])}
    <GD25LQ128EWIGR
      name="U2"
      {...at(32.85, -0.4)}
      connections={{
        N_CS: "net.FL_CS",
        SO_IO1: "net.FL_DO",
        WP__IO2: "net.FL_WP",
        VSS: "net.GND",
        SI_IO0: "net.FL_DI",
        SCLK: "net.FL_CLK",
        HOLD__IO3: "net.FL_HD",
        VCC: "net.VDD_FLASH",
        EP: "net.GND",
      }}
    />
    {C("C27", "100nF", "0201", "VDD_FLASH", "GND", [30.6, 4.0])}
    {/* U2 exposed pad → GND (datasheet: GND or floating) via 2 tented vias at the
        pad ends; paste windows (kicad_post.py) stay clear of them. */}
    {[-1.8, 1.8].map((dy, i) => (
      <via
        key={`u2v${i}`}
        {...at(32.85, -0.4 + dy)}
        holeDiameter="0.3mm"
        outerDiameter="0.6mm"
        connectsTo="net.GND"
        tented="bottom_tented"
      />
    ))}

    {/* ===================================================================
        J2 — USB-C 24-pin sink-mount plug (Hroparts TYPE-C-31-G-07, C530607)
        Sits in the board-end notch. A5 CC → Rd 5.1k; B5 VCONN open;
        B6/B7, SBU, SuperSpeed open.
        =================================================================== */}
    <TYPE_C_31_G_07
      name="J2"
      {...at(J2_X, 0)}
      pcbRotation={90}
      connections={{
        VBUS1: "net.VBUS_C",
        VBUS2: "net.VBUS_C",
        VBUS3: "net.VBUS_C",
        VBUS4: "net.VBUS_C",
        GND1: "net.GND",
        GND2: "net.GND",
        GND3: "net.GND",
        GND4: "net.GND",
        CC1: "net.CC_C",
        DP1: "net.USBC_D_P",
        DN1: "net.USBC_D_N",
        EH1: "net.GND",
        EH2: "net.GND",
        EH3: "net.GND",
        EH4: "net.GND",
      }}
    />
    {ESD_D("D5", "USBC_D_P", [36.15, 0.95], 90)}
    {ESD_D("D6", "USBC_D_N", [36.15, -0.95], 90)}
    {R("R22", "5.1k", "0402", "CC_C", "GND", [36.15, 2.85], 90)}
    <TPD1E10B06DPYR
      name="D7"
      connections={{ pin1: "net.VBUS_C", pin2: "net.GND" }}
      {...at(36.15, -2.95)}
      pcbRotation={90}
    />
    {C("C28", "1uF", "0402", "VBUS_C", "GND", [36.15, -5.1], 90)}

    {/* VBUS_C sense divider 10k/13k → GPIO5 (ADC1_CH4), bottom strip behind J2 */}
    {R("R23", "10k", "0402", "VBUS_C", "VBUS_C_SENSE", [38.0, -5.95])}
    {R("R24", "13k", "0402", "VBUS_C_SENSE", "GND", [40.0, -5.95])}
    {C("C29", "100nF", "0402", "VBUS_C_SENSE", "GND", [42.0, -5.95])}

    {/* ===================================================================
        SW1 pin-hole RECOVERY button (GPIO8) above the flash, Type-C half
        of the stick. Pins 1/3 and 2/4 are internally common.
        =================================================================== */}
    <SKSVCAE010
      name="SW1"
      {...at(33.6, 5.35)}
      connections={{
        pin1: "net.BTN_SW",
        pin3: "net.BTN_SW",
        pin2: "net.GND",
        pin4: "net.GND",
      }}
    />
    {R("R25", "1k", "0402", "RECOVERY_BTN", "BTN_SW", [38.0, 5.9])}
    {R("R26", "10k", "0402", "RECOVERY_BTN", "V3V3", [40.0, 5.9])}

    {/* Status LED on GPIO9 (Type-A end, under the light-pipe) */}
    <led
      name="LED1"
      color="green"
      footprint="0402"
      connections={{ anode: "net.STATUS_LED", cathode: "net.LED_K" }}
      {...at(8.0, 3.0)}
    />
    {R("R27", "1k", "0402", "LED_K", "GND", [8.0, 4.2])}

    {/* ===================================================================
        Antenna keep-out (Johanson thin-edge reference: 8 mm × 3.4 mm,
        no GND on any layer). KiCad rule areas (kicad_post.py) refine it: L1
        allows the feed trace, ANT1/R13 and the 0.6 mm edge GND strip; L2–L4
        carry no copper.
        =================================================================== */}
    <keepout
      shape="rect"
      {...at(ANT_KEEPOUT.cx, ANT_KEEPOUT.cy)}
      width={ANT_KEEPOUT.w}
      height={ANT_KEEPOUT.h}
      layers={["top", "inner1", "inner2", "bottom"]}
      allowPlacements
      allowTraces
    />

    {/* ===================================================================
        Bottom-side (L4) pogo test pads, 2.0 mm grid, under the power zone
        =================================================================== */}
    {TP("TP1", "U0RXD", [8.0, -5.4])}
    {TP("TP2", "TP_TX", [10.0, -5.4])}
    {TP("TP3", "BOOT", [12.0, -5.4])}
    {TP("TP4", "CHIP_PU", [14.0, -5.4])}
    {TP("TP5", "V3V3", [8.0, -3.4])}
    {TP("TP6", "VSYS", [10.0, -3.4])}
    {TP("TP7", "GND", [12.0, -3.4])}
    {TP("TP8", "USB_OE_N", [14.0, -3.4])}
    {TP("TP9", "USB_SEL", [8.0, -1.4])}
    {TP("TP10", "RECOVERY_BTN", [10.0, -1.4])}
    {TP("TP11", "IO10", [12.0, -1.4])}
    {TP("TP12", "IO11", [14.0, -1.4])}
  </board>
)
