/**
 * Board geometry for the ESP32-S3 dongle (plans/03 §1, §3, §4).
 *
 * Design frame: x = 0 at the Type-A board edge, x = BOARD_L at the Type-C end;
 * y = 0 on the centre line, +y = antenna edge, -y = USB/power edge.
 * tscircuit places the board centred on its origin, so `at()` converts.
 */

/** 13.6 mm nominal; +0.2 mm routing tolerance keeps it under the 14.0 mm limit. */
export const BOARD_W = 13.6
/** Set by placement: J1 (6.9) + power/RF zone (13) + U1 (8.2) + flash (7.5) + J2 rear (7.6). */
export const BOARD_L = 43.65

const HALF_W = BOARD_W / 2

/** J1 USB-A: footprint origin sits 4.572 mm behind its step (= board edge). */
export const J1_X = 4.572

/**
 * J2 USB-C sink-mount plug (C530607). From the STEP model's vertices: body 13.75 mm
 * long, nose 6.76 mm ahead of the footprint origin (= the end of EasyEDA's
 * cut-out), legs at the rear. USB Type-C needs >= 6.51 mm of exposed shell, so
 * the case front sits >= 0.25 mm behind the origin; with a ~1 mm case wall the
 * board edge sits 0.75 mm behind the origin → 7.5 mm plug overhang.
 * [U] confirm against the TYPE-C-31-G-07 drawing and the case design.
 */
export const J2_EDGE_BEHIND_ORIGIN = 0.75
export const J2_X = BOARD_L + J2_EDGE_BEHIND_ORIGIN

/**
 * Notch for the sink-mounted shell (Hroparts drawing TYPE-C-31-G-07): the shell
 * (8.25 ± 0.03 wide, 10.70 long) drops 0.95 mm into the board; its rear end is
 * 3.05 mm ahead of the part's rear = fp y +3.94. Notch starts at fp y +4.08
 * (0.14 mm behind the shell; B-row pads and EH tabs keep 0.2 mm copper-to-edge)
 * and is 8.66 mm wide (0.2 mm per side over the shell for JLC's ±0.2 mm routing).
 */
export const NOTCH = {
  x0: J2_X - 4.08, // rear end of the notch
  yLo: -4.33,
  yHi: 4.33,
}

/** U1 ESP32-S3 centre. Pin 1 (LNA_IN) is the top of the left side (toward ANT1). */
export const U1_X = 24.0
export const U1_Y = -0.8

/**
 * Johanson 2450AT18D "thin edge" layout (datasheet Rev 5.0 p.5): an 8 × 3.4 mm
 * ground clearance on the board edge. The antenna sits at the FEED end of the
 * clearance, against the ground plane (here the RF side, x = 17); the clearance
 * runs 4 mm on past its far end. Along the edge beyond the antenna a 0.6 mm
 * ground strip carries the L/C tuning part (R13) from the far-end lands to GND.
 */
export const ANT_KEEPOUT = (() => {
  const x0 = 9.0
  const w = 8.0
  const h = 3.4
  return { x0, x1: x0 + w, w, h, cx: x0 + w / 2, cy: HALF_W - h / 2, yLo: HALF_W - h }
})()
/** ANT1 centre: lands 1 × 0.6 mm at x ±1.5, y ±0.65; top lands 0.2 mm from the edge. */
export const ANT1_X = ANT_KEEPOUT.x1 - 2.0
export const ANT1_Y = HALF_W - 0.2 - 0.3 - 0.65
/** Edge ground strip for the tuning part (L1 only), from the plane to just past R13. */
export const ANT_GND_STRIP = { x0: ANT_KEEPOUT.x0, x1: ANT1_X - 3.35, yLo: HALF_W - 0.85 }

/** Convert design-frame mm to tscircuit board-centred pcbX/pcbY. */
export const at = (x: number, y: number) => ({
  pcbX: +(x - BOARD_L / 2).toFixed(4),
  pcbY: +y.toFixed(4),
})

const p = (x: number, y: number) => ({ x: +(x - BOARD_L / 2).toFixed(4), y })

/** Outline with the open-ended notch for the sink-mount USB-C plug. */
export const boardOutline = [
  p(0, -HALF_W),
  p(BOARD_L, -HALF_W),
  p(BOARD_L, NOTCH.yLo),
  p(NOTCH.x0, NOTCH.yLo),
  p(NOTCH.x0, NOTCH.yHi),
  p(BOARD_L, NOTCH.yHi),
  p(BOARD_L, HALF_W),
  p(0, HALF_W),
]
