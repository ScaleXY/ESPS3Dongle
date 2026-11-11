#!/usr/bin/env python3
"""Print design-frame positions of ports: ports.py circuit.json REF[,REF...]"""
import json, sys
d = json.load(open(sys.argv[1]))
L = next(e for e in d if e["type"] == "pcb_board")["width"]
want = set(sys.argv[2].split(","))
sc = {e["source_component_id"]: e["name"] for e in d if e["type"] == "source_component"}
sp = {e["source_port_id"]: e for e in d if e["type"] == "source_port"}
nets = {}
for e in d:
    if e["type"] == "source_trace":
        for p in e.get("connected_source_port_ids", []):
            for n in e.get("connected_source_net_ids", []):
                nets[p] = n
netname = {e["source_net_id"]: e["name"] for e in d if e["type"] == "source_net"}
for e in d:
    if e["type"] == "pcb_port":
        s = sp[e["source_port_id"]]
        ref = sc.get(s["source_component_id"])
        if ref in want:
            print(f'{ref:5s} {s["name"]:12s} x={e["x"]+L/2:7.2f} y={e["y"]:6.2f}  {netname.get(nets.get(s["source_port_id"]), "")}')
for e in d:
    if e["type"] == "pcb_plated_hole":
        print("PTH", {k: e[k] for k in e if k in ("x", "y", "shape", "outer_width", "outer_height", "hole_width", "hole_height", "ccw_rotation")})
