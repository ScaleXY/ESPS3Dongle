#!/bin/sh
# tscircuit source -> KiCad board (placed, unrouted) in hardware/kicad/
#   1. tsci build (routing disabled) + KiCad export
#   2. scripts/kicad_post.py: stack-up, rules, net classes, planes, keep-outs, paste, DNP
#   3. kicad-cli DRC report + renders
set -e
cd "$(dirname "$0")/.."
export PATH="$HOME/.bun/bin:$PATH"
KICAD=/Applications/KiCad/KiCad.app/Contents
KPY="$KICAD/Frameworks/Python.framework/Versions/Current/bin/python3"
KCLI="$KICAD/MacOS/kicad-cli"

mkdir -p kicad/out
tsci build index.circuit.tsx --disable-parts-engine --routing-disabled \
  --ignore-warnings --ignore-errors --kicad-project >/dev/null
tsci export index.circuit.tsx -f readable-netlist -o kicad/netlist.txt >/dev/null
"$KPY" scripts/kicad_post.py dist/index/kicad kicad 2>&1 | grep -v "wxApp\|stdpbase"

B=kicad/esp32s3_dongle.kicad_pcb
S=kicad/esp32s3_dongle.kicad_sch
"$KPY" scripts/gen_schematic.py "$B" dist/index/circuit.json 2>&1 | grep -v "wxApp\|stdpbase\|memory leak"
mkdir -p kicad/out
"$KCLI" pcb drc --severity-all --schematic-parity --refill-zones --save-board -o kicad/out/drc.rpt "$B" 2>&1 | grep -v Fontconfig || true
"$KCLI" sch erc --severity-all -o kicad/out/erc.rpt "$S" 2>&1 | grep -v Fontconfig || true
"$KCLI" sch export pdf -o kicad/out/schematic.pdf "$S" >/dev/null 2>&1 || true
R="--quality high --background opaque"
"$KCLI" pcb render --side top --width 2400 --height 800 --zoom 1.9 $R -o kicad/out/top.png "$B" >/dev/null 2>&1 || true
"$KCLI" pcb render --side bottom --width 2400 --height 800 --zoom 1.9 $R -o kicad/out/bottom.png "$B" >/dev/null 2>&1 || true
"$KCLI" pcb render --width 2000 --height 1100 --zoom 1.5 --rotate '-50,0,25' $R -o kicad/out/iso.png "$B" >/dev/null 2>&1 || true
for L in F.Cu In1.Cu In2.Cu B.Cu; do
  "$KCLI" pcb export svg --mode-single --fit-page-to-board --exclude-drawing-sheet \
    --layers "$L,Edge.Cuts,F.Fab,F.Courtyard" -o "kicad/out/layer_$L.svg" "$B" >/dev/null 2>&1 || true
done
echo "done: $B"
