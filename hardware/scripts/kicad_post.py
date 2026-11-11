#!/usr/bin/env python3
"""
Turn the tscircuit KiCad export into the Rev A KiCad board, ready for routing.

Run with KiCad's bundled Python (it needs `pcbnew`):
  /Applications/KiCad/KiCad.app/Contents/Frameworks/Python.framework/Versions/3.9/bin/python3 \
      scripts/kicad_post.py dist/index/kicad kicad

What it does (plans/03 §2, §4, §5):
  * 4-layer JLC04161H-7628 stack-up (1.6 mm, ENIG) and layer roles
  * JLCPCB-safe design rules, net classes (50 Ω RF, 90 Ω USB, power), custom .kicad_dru
  * L2 solid GND plane; L3 GND under RF + crystal; antenna keep-out rule areas;
    L2 clearance under the chip-side shunt-cap stub
  * Paste: 1:1 on pads (tscircuit exports 70 % apertures as separate pads),
    windowed paste on exposed pads
  * DNP / BOM / position-file attributes, reference designators moved to Fab
  * Fab notes on Cmts.User
Nothing is routed: no tracks are added. Zones are filled only to show the planes.
"""
import json
import os
import re
import shutil
import sys

import pcbnew

SRC_DIR, OUT_DIR = sys.argv[1], sys.argv[2]
NAME = "esp32s3_dongle"
SRC = os.path.join(SRC_DIR, "index.kicad_pcb")
OUT_PCB = os.path.join(OUT_DIR, NAME + ".kicad_pcb")
os.makedirs(OUT_DIR, exist_ok=True)

# Design-frame → KiCad coordinates. tscircuit's board centre lands on (100, 100);
# design x = 0 is the Type-A edge, +y (design) = antenna edge = −y in KiCad.
sys.path.insert(0, os.path.dirname(__file__))
geo = open(os.path.join(os.path.dirname(__file__), "..", "lib", "geometry.ts")).read()
BOARD_L = float(re.search(r"export const BOARD_L = ([\d.]+)", geo).group(1))
J2_X = BOARD_L + float(re.search(r"export const J2_EDGE_BEHIND_ORIGIN = ([\d.]+)", geo).group(1))
HALF_W = 13.6 / 2


def K(x, y):
    return pcbnew.VECTOR2I(pcbnew.FromMM(100 + x - BOARD_L / 2), pcbnew.FromMM(100 - y))


F_Cu, In1, In2, B_Cu = pcbnew.F_Cu, pcbnew.In1_Cu, pcbnew.In2_Cu, pcbnew.B_Cu

# --------------------------------------------------------------------------
# 1. Paste (done on the s-expression before pcbnew loads it): drop tscircuit's
#    separate 70 % aperture pads, use 1:1 pad paste, and windowed paste on the
#    exposed pads, kept clear of the tented thermal vias:
#      U1 EPAD 4×4: four 1.4 mm quadrant windows (49 %), vias on the "+" between
#      U2 EP 3.4×4.3: 2×2 windows 1.2×1.1 (36 %), vias at the pad ends
#      U4 EP: one window, 70 × 75 %
# --------------------------------------------------------------------------
from sexpr import parse, dump, find, first  # noqa: E402

EXPOSED = {  # (ref, pad) -> [(dx, dy, w, h)] in pad-local mm; w/h <= 1 means "fraction of pad"
    ("U1", "57"): [(sx * 1.1, sy * 1.1, 1.4, 1.4) for sx in (-1, 1) for sy in (-1, 1)],
    ("U2", "9"): [(sx * 0.85, sy * 0.9, 1.2, 1.1) for sx in (-1, 1) for sy in (-1, 1)],
    ("U4", "6"): [(0.0, 0.0, 0.70, 0.75)],
}
SILK_TO_FAB = {"J1", "J2", "Y1", "ANT1"}  # vendor outlines that overhang the edge / sit on pads
NO_PASTE_REFS = {f"TP{i}" for i in range(1, 13)}  # bare pogo pads, not assembled

tree = parse(open(SRC).read())
# tscircuit exports each <via> twice: a real (via) and an empty "Unknown" footprint.
for fp in find(tree, "footprint"):
    if not find(fp, "pad") and not any(pr[1] == '"Reference"' for pr in find(fp, "property")):
        tree.remove(fp)
for fp in find(tree, "footprint"):
    ref = next((pr[2].strip('"') for pr in find(fp, "property") if pr[1] == '"Reference"'), "")
    fpid = fp[1]
    # 0201–1206 passives: drop silk outlines (no room on a 13.6 mm board; refs live on F.Fab)
    if re.fullmatch(r"[RCL]\d+", ref):
        for g in [c for c in fp if isinstance(c, list) and c and c[0].startswith("fp_")]:
            lay = first(g, "layer")
            if lay and lay[1].strip('"') == "F.SilkS":
                fp.remove(g)
    if ref in SILK_TO_FAB:
        for g in [c for c in fp if isinstance(c, list) and c and c[0].startswith("fp_")]:
            lay = first(g, "layer")
            if lay and lay[1].strip('"') == "F.SilkS":
                lay[1] = '"F.Fab"'
    new_items = []
    for pad in find(fp, "pad"):
        num, kind = pad[1].strip('"'), pad[2]
        layers_node = first(pad, "layers")
        layers = [l.strip('"') for l in layers_node[1:]]
        if kind == "smd" and num == "" and all(l.endswith(".Paste") for l in layers):
            fp.remove(pad)
            continue
        if kind != "smd" or ref in NO_PASTE_REFS:
            continue
        paste = "F.Paste" if "F.Cu" in layers else "B.Paste"
        if (ref, num) in EXPOSED:
            at = first(pad, "at")
            sx, sy = (float(v) for v in first(pad, "size")[1:3])
            x0, y0 = float(at[1]), float(at[2])
            ang = at[3:4]
            for dx, dy, w, h in EXPOSED[(ref, num)]:
                w = w * sx if w <= 1 else w
                h = h * sy if h <= 1 else h
                new_items.append(["pad", '""', "smd", "rect",
                                  ["at", f"{x0 + dx:.4f}", f"{y0 + dy:.4f}"] + ang,
                                  ["size", f"{w:.4f}", f"{h:.4f}"], ["layers", paste]])
        elif paste not in layers:
            layers_node.append(paste)
    fp.extend(new_items)
PRE = os.path.join(OUT_DIR, ".pre_" + NAME + ".kicad_pcb")
open(PRE, "w").write(dump(tree))
b = pcbnew.LoadBoard(PRE)
os.remove(PRE)

# --------------------------------------------------------------------------
# 2. Attributes: DNP, BOM/pos exclusion, refs to Fab.
# --------------------------------------------------------------------------
DNP = {"C3", "C8", "C21", "C22", "C23", "C24", "D4", "R6", "U6"}
for fp in b.GetFootprints():
    ref = fp.GetReference()
    if ref in DNP:
        fp.SetDNP(True)
    if ref in NO_PASTE_REFS:
        fp.SetExcludedFromBOM(True)
        fp.SetExcludedFromPosFiles(True)
    t = fp.Reference()
    t.SetLayer(pcbnew.B_Fab if fp.GetLayer() == B_Cu else pcbnew.F_Fab)
    t.SetTextSize(pcbnew.VECTOR2I(pcbnew.FromMM(0.5), pcbnew.FromMM(0.5)))
    t.SetTextThickness(pcbnew.FromMM(0.08))
    t.SetPosition(fp.GetPosition())

# --------------------------------------------------------------------------
# 3. Zones and rule areas. Remove tscircuit's blanket keep-out first.
# --------------------------------------------------------------------------
for z in list(b.Zones()):
    b.Remove(z)


def poly_zone(pts, layers, net=None, name="", priority=0, rule=None):
    z = pcbnew.ZONE(b)
    ls = pcbnew.LSET()
    for l in layers:
        ls.AddLayer(l)
    z.SetLayerSet(ls)
    o = z.Outline()
    o.NewOutline()
    for x, y in pts:
        o.Append(K(x, y))
    z.SetZoneName(name)
    if rule:
        z.SetIsRuleArea(True)
        z.SetDoNotAllowTracks("tracks" in rule)
        z.SetDoNotAllowVias("vias" in rule)
        z.SetDoNotAllowPads("pads" in rule)
        z.SetDoNotAllowFootprints("footprints" in rule)
        z.SetDoNotAllowZoneFills("fills" in rule)
    else:
        z.SetNetCode(b.GetNetcodeFromNetname(net))
        z.SetAssignedPriority(priority)
        z.SetLocalClearance(pcbnew.FromMM(0.2))
        z.SetMinThickness(pcbnew.FromMM(0.15))
        z.SetThermalReliefGap(pcbnew.FromMM(0.2))
        z.SetThermalReliefSpokeWidth(pcbnew.FromMM(0.25))
        z.SetPadConnection(pcbnew.ZONE_CONNECTION_THERMAL)
    b.Add(z)
    return z


def rect(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


notch_x0 = J2_X - 4.08
outline = [(0, -HALF_W), (BOARD_L, -HALF_W), (BOARD_L, -4.33), (notch_x0, -4.33),
           (notch_x0, 4.33), (BOARD_L, 4.33), (BOARD_L, HALF_W), (0, HALF_W)]

# Antenna clearance (Johanson thin-edge 8 × 3.4 mm, "No GND on all layers").
# Johanson thin-edge (datasheet Rev 5.0 p.5): clearance x 9–17, 3.4 mm deep; ANT1 at
# the feed end (x 13–17). L1 keeps a 0.6 mm GND strip along the edge from the plane
# (x <= 9) to R13 (the L/C tuning part), so the strip is cut out of the L1 rule area.
ANT_Y0, ANT_STRIP_X1, ANT_STRIP_Y0 = HALF_W - 3.4, 11.65, HALF_W - 0.85
AK = rect(9.0, ANT_Y0, 17.0, HALF_W + 0.5)
AK_L1 = [(9.0, ANT_Y0), (17.0, ANT_Y0), (17.0, HALF_W + 0.5), (ANT_STRIP_X1, HALF_W + 0.5),
         (ANT_STRIP_X1, ANT_STRIP_Y0), (9.0, ANT_STRIP_Y0)]
poly_zone(AK_L1, [F_Cu], name="ANT_KEEPOUT_L1 (feed trace + ANT1/R13 only)", rule={"vias", "fills"})
poly_zone(AK, [In1, In2, B_Cu], name="ANT_KEEPOUT_L2-L4 (no copper)",
          rule={"tracks", "vias", "pads", "fills"})
# HDG: 15 mil / 100 Ω stub on C19's GND pad — clear L2 under it, L3 is its reference.
c19 = b.FindFootprintByReference("C19")
gp = [p for p in c19.Pads() if p.GetNetname() == "GND"][0].GetPosition()
gx, gy = pcbnew.ToMM(gp.x) - 100 + BOARD_L / 2, 100 - pcbnew.ToMM(gp.y)
poly_zone(rect(gx - 0.35, gy - 0.25, gx + 0.35, gy + 0.65), [In1],
          name="C19_STUB_L2_CLEAR", rule={"fills"})

# L2: solid GND, whole board. L3: GND under RF chain, VDD3P3 network, crystal, U1 top half.
poly_zone(outline, [In1], net="GND", name="L2_GND", priority=0)
poly_zone(rect(12.5, 0.0, 27.0, HALF_W), [In2], net="GND", name="L3_GND_RF_XTAL", priority=1)

pcbnew.ZONE_FILLER(b).Fill(b.Zones())

# --------------------------------------------------------------------------
# 4. Fab notes, title block
# --------------------------------------------------------------------------
tb = b.GetTitleBlock()
tb.SetTitle("ESP32-S3 dual-plug USB dongle")
tb.SetRevision("A (placement, unrouted)")
tb.SetComment(0, "4L JLC04161H-7628, 1.6 mm, 1 oz outer / 0.5 oz inner, ENIG")
tb.SetComment(1, "Source: hardware/index.circuit.tsx -> scripts/build_kicad.sh")

NOTES = """FAB NOTES (Rev A)
1. 4 layers, JLCPCB JLC04161H-7628, 1.6 mm +/-10 %, ENIG, green mask, white silk.
   L1 sig/RF | PP 7628 0.2104 Dk4.4 | L2 GND | core 1.065 Dk4.38 | L3 GND(RF)/PWR/QSPI | PP 0.2104 | L4 GND/test pads
2. Impedance control: 50 ohm CPWG on L1 (ref L2) [RF_50R, start 0.33 w / 0.30 gap];
   90 ohm diff on L1 (ref L2) [USB_90R, start 0.25 w / 0.15 gap]. Confirm in JLC calculator.
3. Outline 43.65 x 13.6 mm with open notch 3.33 x 8.66 mm for the USB-C sink-mount plug
   (shell 8.25 wide sits 0.95 mm into the board, Hroparts TYPE-C-31-G-07 drawing).
   Routing tolerance +/-0.2 mm keeps width <= 14.0 mm. Inner notch corners: mill radius OK.
4. U1 EPAD (9) and U2 EP (2) vias 0.30/0.60: tented on L4, open on L1; paste windows
   avoid them. No via-in-pad fill/cap required (may be ordered as an option).
5. Antenna keep-out 8 x 3.4 mm: no copper on L2-L4; L1 = feed, ANT1/R13 + 0.6 mm edge GND strip.
6. Single-sided assembly (top). L4 carries bare test pads only.
"""
t = pcbnew.PCB_TEXT(b)
t.SetText(NOTES)
t.SetLayer(pcbnew.Cmts_User)
t.SetTextSize(pcbnew.VECTOR2I(pcbnew.FromMM(0.8), pcbnew.FromMM(0.8)))
t.SetTextThickness(pcbnew.FromMM(0.1))
t.SetHorizJustify(pcbnew.GR_TEXT_H_ALIGN_LEFT)
t.SetVertJustify(pcbnew.GR_TEXT_V_ALIGN_TOP)
t.SetPosition(K(-16, -12))
b.Add(t)

pcbnew.SaveBoard(OUT_PCB, b)

# --------------------------------------------------------------------------
# 5. Text edits pcbnew's API doesn't expose cleanly: stack-up, layer names.
# --------------------------------------------------------------------------
pcb = open(OUT_PCB).read()
pcb = re.sub(r'\(1 "In1\.Cu" (\w+)( "[^"]*")?\)', r'(1 "In1.Cu" power "L2.GND")', pcb)
pcb = re.sub(r'\(2 "In2\.Cu" (\w+)( "[^"]*")?\)', r'(2 "In2.Cu" mixed "L3.GND_PWR_QSPI")', pcb)
pcb = re.sub(r'\(0 "F\.Cu" (\w+)( "[^"]*")?\)', r'(0 "F.Cu" signal "L1.TOP")', pcb)
pcb = re.sub(r'\(31 "B\.Cu" (\w+)( "[^"]*")?\)', r'(31 "B.Cu" signal "L4.BOTTOM")', pcb)
pcb = re.sub(r'\(2 "B\.Cu" (\w+)( "[^"]*")?\)', r'(2 "B.Cu" signal "L4.BOTTOM")', pcb)
pcb = re.sub(r'\(4 "In1\.Cu" (\w+)( "[^"]*")?\)', r'(4 "In1.Cu" power "L2.GND")', pcb)
pcb = re.sub(r'\(6 "In2\.Cu" (\w+)( "[^"]*")?\)', r'(6 "In2.Cu" mixed "L3.GND_PWR_QSPI")', pcb)

STACKUP = """
\t\t(stackup
\t\t\t(layer "F.SilkS" (type "Top Silk Screen") (color "White"))
\t\t\t(layer "F.Paste" (type "Top Solder Paste"))
\t\t\t(layer "F.Mask" (type "Top Solder Mask") (color "Green") (thickness 0.01))
\t\t\t(layer "F.Cu" (type "copper") (thickness 0.035))
\t\t\t(layer "dielectric 1" (type "prepreg") (color "FR4 natural") (thickness 0.2104) (material "7628") (epsilon_r 4.4) (loss_tangent 0.02))
\t\t\t(layer "In1.Cu" (type "copper") (thickness 0.0152))
\t\t\t(layer "dielectric 2" (type "core") (color "FR4 natural") (thickness 1.065) (material "FR4") (epsilon_r 4.38) (loss_tangent 0.02))
\t\t\t(layer "In2.Cu" (type "copper") (thickness 0.0152))
\t\t\t(layer "dielectric 3" (type "prepreg") (color "FR4 natural") (thickness 0.2104) (material "7628") (epsilon_r 4.4) (loss_tangent 0.02))
\t\t\t(layer "B.Cu" (type "copper") (thickness 0.035))
\t\t\t(layer "B.Mask" (type "Bottom Solder Mask") (color "Green") (thickness 0.01))
\t\t\t(layer "B.Paste" (type "Bottom Solder Paste"))
\t\t\t(layer "B.SilkS" (type "Bottom Silk Screen") (color "White"))
\t\t\t(copper_finish "ENIG")
\t\t\t(dielectric_constraints yes)
\t\t)"""
if "(stackup" in pcb:
    pcb = re.sub(r"\n\s*\(stackup.*?\n\s*\(dielectric_constraints \w+\)\s*\n\s*\)", STACKUP, pcb, flags=re.S)
else:
    pcb = re.sub(r"\(setup\b", "(setup" + STACKUP, pcb, count=1)
pcb = re.sub(r"\(general\s*\(thickness [\d.]+\)", "(general\n\t\t(thickness 1.6)", pcb, count=1)
open(OUT_PCB, "w").write(pcb)

# --------------------------------------------------------------------------
# 6. Project: design rules + net classes; custom rules file.
# --------------------------------------------------------------------------
def nc(name, clearance, track, via_d=0.45, via_h=0.2, dp_w=0.25, dp_g=0.15):
    return {
        "name": name, "clearance": clearance, "track_width": track,
        "via_diameter": via_d, "via_drill": via_h,
        "microvia_diameter": 0.3, "microvia_drill": 0.1,
        "diff_pair_width": dp_w, "diff_pair_gap": dp_g, "diff_pair_via_gap": 0.25,
        "wire_width": 6, "bus_width": 12, "line_style": 0,
        "pcb_color": "rgba(0, 0, 0, 0.000)", "schematic_color": "rgba(0, 0, 0, 0.000)",
    }


classes = [
    {**nc("Default", 0.1, 0.15), "priority": 2147483647},
    {**nc("RF_50R", 0.15, 0.33), "priority": 0},
    {**nc("USB_90R", 0.15, 0.25, dp_w=0.25, dp_g=0.15), "priority": 1},
    {**nc("RF_SUPPLY", 0.15, 0.5, 0.6, 0.3), "priority": 2},
    {**nc("POWER", 0.15, 0.5, 0.6, 0.3), "priority": 3},
    {**nc("XTAL", 0.15, 0.15), "priority": 4},
]
patterns = [
    {"netclass": "RF_50R", "pattern": "RF_*"},
    {"netclass": "USB_90R", "pattern": "USB*_D_?"},
    {"netclass": "RF_SUPPLY", "pattern": "VDD3P3"},
    {"netclass": "POWER", "pattern": "VBUS_?"},
    {"netclass": "POWER", "pattern": "VSYS"},
    {"netclass": "POWER", "pattern": "V3V3"},
    {"netclass": "POWER", "pattern": "GND"},
    {"netclass": "XTAL", "pattern": "XTAL_?"},
    {"netclass": "XTAL", "pattern": "XIN"},
]
pro = {
    "board": {
        "design_settings": {
            "defaults": {"copper_text_size_h": 0.8, "copper_text_size_v": 0.8, "silk_text_size_h": 0.8,
                         "silk_text_size_v": 0.8, "silk_line_width": 0.12, "fab_text_size_h": 0.5,
                         "fab_text_size_v": 0.5, "board_outline_line_width": 0.05},
            "diff_pair_dimensions": [{"gap": 0.0, "via_gap": 0.0, "width": 0.0},
                                     {"gap": 0.15, "via_gap": 0.25, "width": 0.25}],
            "rules": {
                "min_clearance": 0.1, "min_track_width": 0.1, "min_connection": 0.1,
                "min_via_diameter": 0.4, "min_via_annular_width": 0.1,
                "min_through_hole_diameter": 0.2, "min_hole_to_hole": 0.25,
                "min_hole_clearance": 0.28, "min_copper_edge_clearance": 0.2,
                "min_microvia_diameter": 0.2, "min_microvia_drill": 0.1,
                "min_silk_clearance": 0.0, "min_text_height": 0.6, "min_text_thickness": 0.08,
                "min_resolved_spokes": 2, "solder_mask_to_copper_clearance": 0.0,
                "use_height_for_length_calcs": True, "max_error": 0.005,
            },
            "track_widths": [0.0, 0.15, 0.25, 0.33, 0.5, 0.65],
            "via_dimensions": [{"diameter": 0.0, "drill": 0.0},
                               {"diameter": 0.45, "drill": 0.2},
                               {"diameter": 0.6, "drill": 0.3}],
            "zones_allow_external_fillets": False,
            "rule_severities": {"lib_footprint_issues": "ignore", "lib_footprint_mismatch": "ignore",
                                "footprint_link_issues": "ignore",
                                "silk_overlap": "warning", "silk_over_copper": "warning",
                                "silk_edge_clearance": "warning"},
        },
    },
    "erc": {"rule_severities": {"lib_symbol_issues": "ignore", "lib_symbol_mismatch": "ignore",
                                "footprint_link_issues": "ignore"}},
    "meta": {"filename": NAME + ".kicad_pro", "version": 3},
    "net_settings": {"classes": classes, "meta": {"version": 4},
                     "net_colors": None, "netclass_assignments": None,
                     "netclass_patterns": patterns},
    "pcbnew": {"page_layout_descr_file": ""},
    "sheets": [],
    "text_variables": {},
}
json.dump(pro, open(os.path.join(OUT_DIR, NAME + ".kicad_pro"), "w"), indent=2)

DRU = """(version 1)
# Custom rules for the ESP32-S3 dongle (plans/02 §3, §5; plans/03 §4, §5).

(rule "RF line: no vias"
  (condition "A.NetClass == 'RF_50R'")
  (constraint via_count (max 0)))

(rule "RF line: 50 ohm CPWG gap to GND copper (tracks, pours)"
  (condition "A.NetClass == 'RF_50R' && A.Type == 'Track' && (B.Type == 'Zone' || B.Type == 'Track')")
  (constraint clearance (min 0.3)))

(rule "Crystal: no vias on clock traces"
  (condition "A.NetClass == 'XTAL'")
  (constraint via_count (max 0)))

(rule "USB 90 ohm pairs"
  (condition "A.inDiffPair('USB*_D_*')")
  (constraint diff_pair_gap (min 0.13) (opt 0.15) (max 0.17))
  (constraint diff_pair_uncoupled (max 2.0))
  (constraint skew (max 0.5))
  (constraint via_count (max 2)))

(rule "NPTH (J1 pegs) to copper: JLC 0.2 mm"
  (condition "A.Pad_Type == 'NPTH, mechanical'")
  (constraint hole_clearance (min 0.2)))

(rule "VDD3P3 RF supply >= 20 mil"
  (condition "A.NetName == 'VDD3P3'")
  (constraint track_width (min 0.5)))

(rule "Main 3V3 / VSYS / VBUS >= 0.4 mm"
  (condition "A.NetClass == 'POWER' && A.NetName != 'GND'")
  (constraint track_width (min 0.4)))
"""
open(os.path.join(OUT_DIR, NAME + ".kicad_dru"), "w").write(DRU)

# 3D models next to the project
src3d = os.path.join(SRC_DIR, "3dmodels")
dst3d = os.path.join(OUT_DIR, "3dmodels")
if os.path.isdir(src3d):
    shutil.rmtree(dst3d, ignore_errors=True)
    shutil.copytree(src3d, dst3d)
print("wrote", OUT_PCB)
