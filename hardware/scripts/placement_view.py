#!/usr/bin/env python3
"""Render a placement-review SVG from tscircuit circuit.json.

Draws board outline, keepouts, courtyards (labelled), top pads (red),
bottom pads (blue), plated holes. Usage:
  placement_view.py circuit.json out.svg [x0 x1 y0 y1]   (design-frame mm crop)
Design frame: x = 0 at the Type-A edge (board-centred x + L/2), y up.
"""
import json, sys

src, out = sys.argv[1], sys.argv[2]
d = json.load(open(src))
board = next(e for e in d if e["type"] == "pcb_board")
L = board["width"]
off = L / 2
crop = list(map(float, sys.argv[3:7])) if len(sys.argv) >= 7 else [-16, L + 9, -7.5, 7.5]
x0, x1, y0, y1 = crop
S = 40  # px per mm
W, H = (x1 - x0) * S, (y1 - y0) * S
X = lambda x: (x + off - x0) * S
Y = lambda y: (y1 - y) * S
names = {e["source_component_id"]: e["name"] for e in d if e["type"] == "source_component"}
pc2name = {e["pcb_component_id"]: names.get(e["source_component_id"], "?")
           for e in d if e["type"] == "pcb_component"}
o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W:.0f}" height="{H:.0f}" '
     f'viewBox="0 0 {W:.0f} {H:.0f}"><rect width="100%" height="100%" fill="#111"/>']
# 1 mm grid
for gx in range(int(x0), int(x1) + 1):
    o.append(f'<line x1="{(gx-x0)*S}" y1="0" x2="{(gx-x0)*S}" y2="{H}" stroke="{"#333" if gx%5 else "#555"}" stroke-width="1"/>')
for gy in range(int(y0), int(y1) + 1):
    o.append(f'<line x1="0" y1="{Y(gy)}" x2="{W}" y2="{Y(gy)}" stroke="{"#333" if gy%5 else "#555"}" stroke-width="1"/>')
pts = " ".join(f"{X(p['x']):.1f},{Y(p['y']):.1f}" for p in board["outline"])
o.append(f'<polygon points="{pts}" fill="#1c3020" stroke="#ff0" stroke-width="2"/>')
for e in d:
    t = e["type"]
    if t == "pcb_keepout":
        c, w, h = e["center"], e.get("width", 0), e.get("height", 0)
        o.append(f'<rect x="{X(c["x"]-w/2)}" y="{Y(c["y"]+h/2)}" width="{w*S}" height="{h*S}" fill="#f0f" fill-opacity="0.15" stroke="#f0f" stroke-dasharray="6,4"/>')
for e in d:
    t = e["type"]
    if t == "pcb_smtpad":
        col = "#e33" if e["layer"] == "top" else "#39f"
        if e["shape"] in ("rect", "rotated_rect"):
            w, h = e["width"], e["height"]
            rot = e.get("ccw_rotation", 0)
            o.append(f'<rect x="{X(e["x"]-w/2)}" y="{Y(e["y"]+h/2)}" width="{w*S}" height="{h*S}" fill="{col}" fill-opacity="0.85" transform="rotate({-rot} {X(e["x"])} {Y(e["y"])})"/>')
        elif e["shape"] == "circle":
            o.append(f'<circle cx="{X(e["x"])}" cy="{Y(e["y"])}" r="{e["radius"]*S}" fill="{col}" fill-opacity="0.85"/>')
        elif e["shape"] in ("pill", "rotated_pill"):
            w, h = e["width"], e["height"]
            o.append(f'<rect x="{X(e["x"]-w/2)}" y="{Y(e["y"]+h/2)}" width="{w*S}" height="{h*S}" rx="{min(w,h)*S/2}" fill="{col}" fill-opacity="0.85"/>')
    elif t == "pcb_plated_hole":
        ow = e.get("outer_width", e.get("outer_diameter", 1)); oh = e.get("outer_height", ow)
        o.append(f'<rect x="{X(e["x"]-ow/2)}" y="{Y(e["y"]+oh/2)}" width="{ow*S}" height="{oh*S}" rx="{min(ow,oh)*S/2}" fill="#fa0"/>')
    elif t == "pcb_hole":
        r = e.get("hole_diameter", 1) / 2
        o.append(f'<circle cx="{X(e["x"])}" cy="{Y(e["y"])}" r="{r*S}" fill="#000" stroke="#aaa"/>')
    elif t == "pcb_via":
        o.append(f'<circle cx="{X(e["x"])}" cy="{Y(e["y"])}" r="{e["outer_diameter"]*S/2}" fill="#aaa"/>')
for e in d:
    t = e["type"]
    if t == "pcb_courtyard_rect":
        c, w, h = e["center"], e["width"], e["height"]
        o.append(f'<rect x="{X(c["x"]-w/2)}" y="{Y(c["y"]+h/2)}" width="{w*S}" height="{h*S}" fill="none" stroke="#0ff" stroke-width="1"/>')
    elif t == "pcb_courtyard_outline":
        p = " ".join(f"{X(q['x']):.1f},{Y(q['y']):.1f}" for q in e["outline"])
        o.append(f'<polygon points="{p}" fill="none" stroke="#0ff" stroke-width="1"/>')
for e in d:
    if e["type"] == "pcb_component":
        n = pc2name.get(e["pcb_component_id"], "?")
        c = e["center"]
        col = "#8cf" if e.get("layer") == "bottom" else "#fff"
        fs = 9 if (e.get("width", 1) * e.get("height", 1)) < 1.5 else 13
        o.append(f'<text x="{X(c["x"])}" y="{Y(c["y"])+3}" fill="{col}" font-size="{fs}" font-family="monospace" text-anchor="middle" font-weight="bold">{n}</text>')
o.append("</svg>")
open(out, "w").write("\n".join(o))
