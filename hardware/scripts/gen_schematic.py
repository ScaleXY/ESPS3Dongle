#!/usr/bin/env python3
"""
Generate a KiCad schematic that is linked 1:1 to the board, so KiCad's
schematic↔PCB parity check and "Update PCB from Schematic" work.

tscircuit's own kicad_sch export fails ERC (869 violations) and is not linked
to the PCB, so it is not used. This script builds a net-label schematic from:
  * the board (refs, values, footprints, DNP/BOM flags, pad → net), and
  * tscircuit's circuit.json (pin names, MPN, LCSC numbers).
Components are grouped into labelled functional blocks. All pins are `passive`
(ERC then checks connectivity, not drive strength). Unconnected pins get
no-connect flags. Every footprint's path is set to its symbol's UUID.

Run with KiCad's Python:  gen_schematic.py <board.kicad_pcb> <circuit.json>
Writes <board>.kicad_sch next to the board and re-saves the board.
"""
import json
import os
import re
import sys
import uuid

import pcbnew

BOARD, CJSON = sys.argv[1], sys.argv[2]
NAME = os.path.splitext(os.path.basename(BOARD))[0]
SCH = os.path.join(os.path.dirname(BOARD), NAME + ".kicad_sch")
G = 2.54

SECTIONS = [
    ("USB-A plug, ESD", ["J1", "D1", "D2", "D3", "C1"]),
    ("Power path: TPS2116 priority mux (VBUS_A first) + TLV75733P 3.3 V LDO",
     ["U3", "R1", "R2", "R3", "C2", "C3", "U4", "C5"]),
    ("USB D+/D- switch (follows powering plug; OE pulled high = disconnected)",
     ["U5", "C6", "R4", "R5", "R6", "R14", "R15", "C23", "C24"]),
    ("ESP32-S3 (R16V / plain / R8 variants)", ["U1"]),
    ("ESP32-S3 supplies, reset, straps, UART",
     ["C7", "C8", "C9", "C10", "L1", "C11", "C12", "C13", "C14", "C15",
      "R7", "C16", "U6", "R8", "R9", "R10"]),
    ("40 MHz crystal", ["Y1", "L2", "C17", "C18"]),
    ("RF: chip-side C-L-C, 0R break, antenna-side pi, Johanson 2450AT18D (thin edge)",
     ["C19", "L3", "C20", "R11", "C21", "R12", "C22", "D4", "ANT1", "R13"]),
    ("16 MB QSPI flash (1.8 V on N16R16 / N16)", ["U2", "R16", "R17", "R18", "R19", "R20", "R21", "C25", "C26", "C27"]),
    ("USB-C plug (sink mount), ESD, CC Rd, VBUS_C sense", ["J2", "D5", "D6", "R22", "D7", "C28", "R23", "R24", "C29"]),
    ("Recovery button, status LED", ["SW1", "R25", "R26", "LED1", "R27"]),
    ("Bottom-side pogo test pads", [f"TP{i}" for i in range(1, 13)]),
]


def U():
    return str(uuid.uuid4())


def q(s):
    return '"' + str(s).replace("\\", "\\\\").replace('"', '\\"') + '"'


def snap(v, g=1.27):
    return round(round(v / g) * g, 4)


# ---------------------------------------------------------------- board data
b = pcbnew.LoadBoard(BOARD)
cj = json.load(open(CJSON))
scomp = {e["source_component_id"]: e for e in cj if e["type"] == "source_component"}
pin_names = {}
for e in cj:
    if e["type"] == "source_port" and e.get("source_component_id") in scomp:
        ref = scomp[e["source_component_id"]]["name"]
        pin_names.setdefault(ref, {})[str(e.get("pin_number"))] = e["name"]
meta = {c["name"]: c for c in scomp.values()}

parts = {}
for fp in b.GetFootprints():
    ref = fp.GetReference()
    if not ref:
        continue
    pins = {}
    for p in fp.Pads():
        n = p.GetNumber()
        if n == "":
            continue
        pins.setdefault(n, p.GetNetname())
        if p.GetNetname():
            pins[n] = p.GetNetname()
    parts[ref] = dict(fp=fp, value=fp.GetValue(), fpid=fp.GetFPIDAsString(), pins=pins,
                      dnp=fp.IsDNP(), in_bom=not fp.IsExcludedFromBOM())

assigned = [r for _, refs in SECTIONS for r in refs]
missing = sorted(set(parts) - set(assigned))
if missing:
    SECTIONS.append(("Other", missing))


def numkey(n):
    m = re.match(r"(\d+)", n)
    return (int(m.group(1)) if m else 10**6, n)


# ---------------------------------------------------------------- symbols
def text_w(s, size=1.27):
    return len(s) * size * 0.75


lib_symbols, placed, labels, noconns, texts, rects = [], [], [], [], [], []


def make_symbol(ref):
    """Return (lib_symbol_sexpr, pins[(num, name, x, y, side)], w, h) in symbol coords (y up)."""
    part = parts[ref]
    nums = sorted(part["pins"], key=numkey)
    names = pin_names.get(ref, {})
    two = len(nums) <= 2 and not ref.startswith("J")
    pins = []
    if two:
        body_w, body_h = 2 * G, 0.8 * G
        xs = [-2 * G, 2 * G]
        for i, n in enumerate(nums):
            pins.append((n, names.get(n, n), xs[i], 0.0, "L" if i == 0 else "R"))
        w, h = 4 * G, 2 * G
    else:
        left = nums[: (len(nums) + 1) // 2]
        right = nums[(len(nums) + 1) // 2:]
        lw = max([text_w(names.get(n, n)) for n in left] + [2])
        rw = max([text_w(names.get(n, n)) for n in right] + [2])
        body_w = snap(lw + rw + 2 * G, G)
        rows = max(len(left), len(right))
        body_h = (rows + 1) * G
        top = (rows - 1) / 2 * G
        for i, n in enumerate(left):
            pins.append((n, names.get(n, n), snap(-body_w / 2 - G), snap(top - i * G), "L"))
        for i, n in enumerate(right):
            pins.append((n, names.get(n, n), snap(body_w / 2 + G), snap(top - i * G), "R"))
        w, h = body_w + 2 * G, body_h
    sym = f"dongle:{ref}"
    hide = "(pin_numbers (hide yes)) (pin_names (offset 0) (hide yes))" if two else "(pin_names (offset 0.508))"
    pin_s = []
    for n, nm, x, y, side in pins:
        ang = 0 if side == "L" else 180
        pin_s.append(
            f'(pin passive line (at {x} {y} {ang}) (length {G}) '
            f'(name {q(nm)} (effects (font (size 1.0 1.0)))) (number {q(n)} (effects (font (size 1.0 1.0)))))'
        )
    lib = (
        f'(symbol {q(sym)} {hide} (exclude_from_sim no) (in_bom yes) (on_board yes)\n'
        f'  (property "Reference" {q(re.sub(r"[0-9]+$", "", ref))} (at 0 {snap(body_h / 2 + 1.27)} 0) (effects (font (size 1.27 1.27))))\n'
        f'  (property "Value" {q(ref)} (at 0 {snap(-body_h / 2 - 1.27)} 0) (effects (font (size 1.27 1.27))))\n'
        f'  (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) (hide yes)))\n'
        f'  (property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) (hide yes)))\n'
        f'  (symbol {q(ref + "_0_1")} (rectangle (start {snap(-body_w / 2)} {snap(body_h / 2)}) (end {snap(body_w / 2)} {snap(-body_h / 2)}) '
        f'(stroke (width 0.254) (type default)) (fill (type background))))\n'
        f'  (symbol {q(ref + "_1_1")} {" ".join(pin_s)})\n)'
    )
    return lib, pins, w, h, body_h


def place(ref, X, Y, pins, body_h, root):
    part = parts[ref]
    m = meta.get(ref, {})
    su = U()
    lcsc = ",".join((m.get("supplier_part_numbers") or {}).get("jlcpcb", []))
    mpn = m.get("manufacturer_part_number", "")
    props = [
        ("Reference", ref, 0, -body_h / 2 - 2.0, False),
        ("Value", part["value"], 0, body_h / 2 + 2.0, False),
        ("Footprint", part["fpid"], 0, 0, True),
        ("Datasheet", "", 0, 0, True),
        ("MPN", mpn, 0, 0, True),
        ("LCSC", lcsc, 0, 0, True),
    ]
    ps = "\n".join(
        f'  (property {q(k)} {q(v)} (at {snap(X + dx)} {snap(Y + dy)} 0) (effects (font (size 1.27 1.27)){" (hide yes)" if hid else ""}))'
        for k, v, dx, dy, hid in props
    )
    pin_u = " ".join(f'(pin {q(n)} (uuid {U()}))' for n, *_ in pins)
    placed.append(
        f'(symbol (lib_id {q("dongle:" + ref)}) (at {X} {Y} 0) (unit 1) (exclude_from_sim no) '
        f'(in_bom {"yes" if part["in_bom"] else "no"}) (on_board yes) (dnp {"yes" if part["dnp"] else "no"}) (uuid {su})\n'
        f'{ps}\n  {pin_u}\n  (instances (project {q(NAME)} (path {q("/" + root)} (reference {q(ref)}) (unit 1))))\n)'
    )
    for n, nm, px, py, side in pins:
        ax, ay = snap(X + px), snap(Y - py)
        net = part["pins"].get(n, "")
        if net and not net.startswith("unconnected-("):
            ang, just = (180, "right") if side == "L" else (0, "left")
            labels.append(
                f'(global_label {q(net)} (shape passive) (at {ax} {ay} {ang}) (fields_autoplaced yes) '
                f'(effects (font (size 1.0 1.0)) (justify {just})) (uuid {U()}) '
                f'(property "Intersheetrefs" "${{INTERSHEET_REFS}}" (at {ax} {ay} 0) (effects (font (size 1.0 1.0)) (hide yes))))'
            )
        else:
            noconns.append(f'(no_connect (at {ax} {ay}) (uuid {U()}))')
            nc_pads.append((ref, n, nm))
    return su


root = U()
sym_uuid = {}
nc_pads = []
# Layout: each section is a block; blocks flow left→right, wrapping at MAX_W.
MAX_W, X0, Y0 = 760.0, 25.4, 30.48
cx, cy, row_h = X0, Y0, 0.0
for title, refs in SECTIONS:
    refs = [r for r in refs if r in parts]
    big = [r for r in refs if len(parts[r]["pins"]) > 2 or r.startswith("J")]
    small = [r for r in refs if r not in big]
    built = {r: make_symbol(r) for r in refs}
    for r in refs:
        lib_symbols.append(built[r][0])
    lab = lambda r: max([text_w(parts[r]["pins"].get(n, "")) for n in parts[r]["pins"]] + [0]) + 2 * G
    # block geometry
    items, bx, by, bh = [], 0.0, 3 * G, 0.0
    for r in big:
        _, pins, w, h, bhh = built[r]
        wl = lab(r)
        items.append((r, bx + wl + w / 2, by + h / 2 + 2 * G))
        bx += w + 2 * wl + 2 * G
        bh = max(bh, h + 4 * G)
    small_cols = 2 if len(small) > 6 else 1
    if small:
        cell_w = max(lab(r) for r in small) * 2 + 4 * G + 2 * G
        cell_h = 4 * G
        per_col = -(-len(small) // small_cols)
        sx0 = bx
        for i, r in enumerate(small):
            c, k = divmod(i, per_col)
            items.append((r, sx0 + c * cell_w + cell_w / 2, by + k * cell_h + 2 * G))
        bx += small_cols * cell_w
        bh = max(bh, per_col * cell_h + 2 * G)
    bw, bh = bx + G, bh + 4 * G
    if cx + bw > X0 + MAX_W and cx > X0:
        cx, cy, row_h = X0, cy + row_h + 3 * G, 0.0
    for r, ix, iy in items:
        _, pins, w, h, bhh = built[r]
        sym_uuid[r] = place(r, snap(cx + ix, G), snap(cy + iy, G), pins, bhh, root)
    rects.append(f'(rectangle (start {snap(cx - G)} {snap(cy)}) (end {snap(cx + bw)} {snap(cy + bh)}) '
                 f'(stroke (width 0.254) (type dash)) (fill (type none)) (uuid {U()}))')
    texts.append(f'(text {q(title)} (exclude_from_sim no) (at {snap(cx)} {snap(cy + 2.54)} 0) '
                 f'(effects (font (size 2.0 2.0) (bold yes)) (justify left bottom)) (uuid {U()}))')
    cx += bw + 3 * G
    row_h = max(row_h, bh)

W, H = X0 + MAX_W + 25.4, cy + row_h + 40
notes = ("Generated by hardware/scripts/gen_schematic.py from the board + tscircuit netlist "
         "(source of truth: hardware/index.circuit.tsx). Net labels connect pins; all pins passive. "
         "Variants: N16R16 = ESP32-S3R16V + GD25LQ128E (1.8 V), R9 fitted; N16 = ESP32-S3 + same flash, R9 fitted; "
         "N16R8 = ESP32-S3R8 + 3.3 V flash (W25Q128JVPIQ), R9 NOT fitted.")
texts.append(f'(text {q(notes)} (exclude_from_sim no) (at {X0} {snap(H - 25)} 0) (effects (font (size 1.5 1.5)) (justify left bottom)) (uuid {U()}))')

sch = f"""(kicad_sch (version 20250114) (generator "eeschema") (generator_version "9.0")
(uuid {root})
(paper "User" {snap(W, 1)} {snap(H, 1)})
(title_block (title "ESP32-S3 dual-plug USB dongle") (rev "A") (company "") (comment 1 "Generated from the PCB netlist; all pins passive"))
(lib_symbols
{chr(10).join(lib_symbols)}
)
{chr(10).join(rects)}
{chr(10).join(texts)}
{chr(10).join(placed)}
{chr(10).join(labels)}
{chr(10).join(noconns)}
(sheet_instances (path "/" (page "1")))
(embedded_fonts no)
)
"""
open(SCH, "w").write(sch)

# ---------------------------------------------------------------- link board
for fp in b.GetFootprints():
    ref = fp.GetReference()
    fp.SetPath(pcbnew.KIID_PATH("/" + sym_uuid[ref]))
    fp.SetSheetname("/")
    fp.SetSheetfile(os.path.basename(SCH))
    m = meta.get(ref, {})
    for k, v in (("MPN", m.get("manufacturer_part_number", "")),
                 ("LCSC", ",".join((m.get("supplier_part_numbers") or {}).get("jlcpcb", [])))):
        fp.SetField(k, v)
        f = fp.GetField(k)
        f.SetVisible(False)
        f.SetLayer(pcbnew.F_Fab)
# No-connect pins: KiCad names their nets "unconnected-(REF-PIN-PadN)"; give the pads the same.
for ref, n, nm in nc_pads:
    name = f"unconnected-({ref}-{nm}-Pad{n})"
    ni = b.FindNet(name)
    if ni is None:
        ni = pcbnew.NETINFO_ITEM(b, name)
        b.Add(ni)
    for p in parts[ref]["fp"].Pads():
        if p.GetNumber() == n:
            p.SetNet(ni)
pcbnew.SaveBoard(BOARD, b)

pro_path = os.path.join(os.path.dirname(BOARD), NAME + ".kicad_pro")
pro = json.load(open(pro_path))
pro["sheets"] = [[root, "Root"]]
json.dump(pro, open(pro_path, "w"), indent=2)
print(f"wrote {SCH}: {len(placed)} symbols, {len(labels)} labels, {len(noconns)} no-connects")
