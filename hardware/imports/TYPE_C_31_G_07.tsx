import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin25: ["EH3"],
  pin26: ["EH4"],
  pin27: ["EH1"],
  pin28: ["EH2"],
  pin29: ["GND1","A12"],
  pin30: ["SSRXP2","A11"],
  pin31: ["SSRXN2","A10"],
  pin32: ["VBUS1","A9"],
  pin33: ["SBU1","A8"],
  pin34: ["DN1","A7"],
  pin35: ["DP1","A6"],
  pin36: ["CC1","A5"],
  pin37: ["VBUS2","A4"],
  pin38: ["SSTXN1","A3"],
  pin39: ["SSTXP1","A2"],
  pin40: ["GND2","A1"],
  pin41: ["GND3","B12"],
  pin42: ["SSRXP1","B11"],
  pin43: ["SSRXN1","B10"],
  pin44: ["VBUS3","B9"],
  pin45: ["SBU2","B8"],
  pin46: ["DN2","B7"],
  pin47: ["DP2","B6"],
  pin48: ["CC2","B5"],
  pin49: ["VBUS4","B4"],
  pin50: ["SSTXN2","B3"],
  pin51: ["SSTXP2","B2"],
  pin52: ["GND4","B1"]
} as const

export const TYPE_C_31_G_07 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C530607"
  ]
}}
      manufacturerPartNumber="TYPE-C-31-G-07"
      // Edited vs. the EasyEDA import (Hroparts drawing TYPE-C-31-G-07, 2018-08-01):
      //  - courtyard ±4.4 mm over the notch (±5.0 mm rear tabs only over the pad field)
      //  - EH1/EH2 SMT tabs shortened 0.1 mm at the front so they keep 0.2 mm
      //    copper-to-edge from the notch, which starts at fp y = 4.08 mm
      footprint={<footprint>
        <platedhole  portHints={["pin25"]} pcbX="-4.249928mm" pcbY="6.2373891mm" holeWidth="0.5000244mm" holeHeight="1.7999964mm" outerWidth="0.999998mm" outerHeight="2.1999956mm" shape="pill" />
<platedhole  portHints={["pin26"]} pcbX="4.249928mm" pcbY="6.2373891mm" holeWidth="0.5000244mm" holeHeight="1.7999964mm" outerWidth="0.999998mm" outerHeight="2.1999956mm" shape="pill" />
<smtpad portHints={["pin29"]} pcbX="-2.750058mm" pcbY="6.3374651mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin30"]} pcbX="-2.249932mm" pcbY="6.3374651mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin31"]} pcbX="-1.75006mm" pcbY="6.3374651mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin32"]} pcbX="-1.249934mm" pcbY="6.3374651mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin33"]} pcbX="-0.750062mm" pcbY="6.3374651mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin34"]} pcbX="-0.25019mm" pcbY="6.3374651mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin35"]} pcbX="0.249936mm" pcbY="6.3374651mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin36"]} pcbX="0.749808mm" pcbY="6.3374651mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin37"]} pcbX="1.249934mm" pcbY="6.3374651mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin38"]} pcbX="1.75006mm" pcbY="6.3374651mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin39"]} pcbX="2.249932mm" pcbY="6.3374651mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin40"]} pcbX="2.750058mm" pcbY="6.3374651mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin41"]} pcbX="2.750058mm" pcbY="4.7875571mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin42"]} pcbX="2.249932mm" pcbY="4.7875571mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin43"]} pcbX="1.75006mm" pcbY="4.7875571mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin44"]} pcbX="1.249934mm" pcbY="4.7875571mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin45"]} pcbX="0.749808mm" pcbY="4.7875571mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin46"]} pcbX="0.249936mm" pcbY="4.7875571mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin47"]} pcbX="-0.25019mm" pcbY="4.7875571mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin48"]} pcbX="-0.750062mm" pcbY="4.7875571mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin49"]} pcbX="-1.249934mm" pcbY="4.7875571mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin50"]} pcbX="-1.75006mm" pcbY="4.7875571mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin51"]} pcbX="-2.249932mm" pcbY="4.7875571mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin52"]} pcbX="-2.750058mm" pcbY="4.7875571mm" width="0.270002mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin27"]} pcbX="-3.574796mm" pcbY="4.99mm" width="0.5999988mm" height="1.4mm" shape="rect" />
<smtpad portHints={["pin28"]} pcbX="3.57505mm" pcbY="4.99mm" width="0.5999988mm" height="1.4mm" shape="rect" />
<silkscreenpath route={[{"x":4.124959999999987,"y":3.9374445000000833},{"x":-4.125061599999867,"y":3.9374445000000833}]} />
<silkscreenpath route={[{"x":4.124959999999987,"y":-6.832561899999973},{"x":4.124959999999987,"y":3.9374445000000833}]} />
<silkscreenpath route={[{"x":-4.125061599999867,"y":-6.832561899999973},{"x":4.124959999999987,"y":-6.832561899999973}]} />
<silkscreenpath route={[{"x":-4.125061599999867,"y":3.9374445000000833},{"x":-4.125061599999867,"y":-6.832561899999973}]} />
<silkscreenpath route={[{"x":-3.966159199999993,"y":-6.86255929999993},{"x":-4.125061599999867,"y":-6.86255929999993}]} />
<silkscreenpath route={[{"x":-4.125061599999867,"y":-6.578561899999954},{"x":-4.125061599999867,"y":-6.832561899999973}]} />
<silkscreenpath route={[{"x":4.124959999999987,"y":-6.562559899999997},{"x":4.124959999999987,"y":-6.832561899999973},{"x":3.4899599999999964,"y":-6.832561899999973}]} />
<silkscreenpath route={[{"x":1.5338297999999213,"y":-6.86255929999993},{"x":2.53382780000004,"y":-6.86255929999993}]} />
<silkscreenpath route={[{"x":0.03383279999991373,"y":-6.86255929999993},{"x":0.5338318000000299,"y":-6.86255929999993}]} />
<silkscreenpath route={[{"x":-3.4661601999999903,"y":-6.86255929999993},{"x":-3.966159199999993,"y":-6.86255929999993}]} />
<silkscreenpath route={[{"x":-1.4661641999999802,"y":-6.86255929999993},{"x":-2.466162200000099,"y":-6.86255929999993}]} />
<silkscreenpath route={[{"x":4.124959999999987,"y":-4.5625638999999865},{"x":4.124959999999987,"y":-5.5625618999999915}]} />
<silkscreenpath route={[{"x":4.124959999999987,"y":-2.5625678999999764},{"x":4.124959999999987,"y":-3.5625658999998677}]} />
<silkscreenpath route={[{"x":4.124959999999987,"y":-0.5625464999998258},{"x":4.124959999999987,"y":-1.5625444999999445}]} />
<silkscreenpath route={[{"x":4.124959999999987,"y":1.4374495000000707},{"x":4.124959999999987,"y":0.4374515000000656}]} />
<silkscreenpath route={[{"x":4.124959999999987,"y":3.4374455000000808},{"x":4.124959999999987,"y":2.4374475000001894}]} />
<silkscreenpath route={[{"x":0.03383279999991373,"y":-6.86255929999993},{"x":-0.6250685999999632,"y":-6.86255929999993}]} />
<silkscreenpath route={[{"x":-4.125061599999867,"y":-4.5625638999999865},{"x":-4.125061599999867,"y":-5.5625618999999915}]} />
<silkscreenpath route={[{"x":-4.125061599999867,"y":-2.5625678999999764},{"x":-4.125061599999867,"y":-3.5625658999998677}]} />
<silkscreenpath route={[{"x":-4.125061599999867,"y":-0.5625464999998258},{"x":-4.125061599999867,"y":-1.5625444999999445}]} />
<silkscreenpath route={[{"x":-4.125061599999867,"y":1.4374495000000707},{"x":-4.125061599999867,"y":0.4374515000000656}]} />
<silkscreenpath route={[{"x":-4.125061599999867,"y":3.4374455000000808},{"x":-4.125061599999867,"y":2.4374475000001894}]} />
<silkscreenpath route={[{"x":3.1380430000000388,"y":6.937438500000098},{"x":3.499942199999964,"y":6.937438500000098}]} />
<silkscreenpath route={[{"x":-3.5000438000000713,"y":6.937438500000098},{"x":-3.138170000000059,"y":6.937438500000098}]} />
<silkscreenpath route={[{"x":4.124959999999987,"y":3.9374445000000833},{"x":4.124959999999987,"y":4.917097100000092}]} />
<silkscreenpath route={[{"x":-4.125061599999867,"y":3.9374445000000833},{"x":-4.125061599999867,"y":4.917097100000092}]} />
<silkscreentext text="{NAME}" pcbX="-0.006858mm" pcbY="8.3430511mm" anchorAlignment="center" fontSize="1mm" />
<fabricationnotepath route={[{"x":-3.872991999999954,"y":3.7625147000001107},{"x":-3.872991999999954,"y":-6.510464499999898},{"x":3.872991999999954,"y":-6.510464499999898},{"x":3.872991999999954,"y":3.7625147000001107},{"x":3.99999200000002,"y":3.8895147000000634},{"x":4.126991999999973,"y":3.7625147000001107},{"x":4.126991999999973,"y":-6.637464499999965},{"x":4.089794561210624,"y":-6.7272670612105685},{"x":3.99999200000002,"y":-6.764464499999917},{"x":-3.99999200000002,"y":-6.764464499999917},{"x":-4.089794561210624,"y":-6.7272670612105685},{"x":-4.126991999999973,"y":-6.637464499999965},{"x":-4.126991999999973,"y":3.7625147000001107},{"x":-3.99999200000002,"y":3.8895147000000634},{"x":-3.872991999999954,"y":3.7625147000001107}]} strokeWidth="0mm" isFilled hasStroke={false} />
<courtyardoutline outline={[{"x":-5.0,"y":7.5873869},{"x":5.0,"y":7.5873869},{"x":5.0,"y":4.08},{"x":4.4,"y":4.08},{"x":4.4,"y":-7.0124579},{"x":-4.4,"y":-7.0124579},{"x":-4.4,"y":4.08},{"x":-5.0,"y":4.08},{"x":-5.0,"y":7.5873869}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C530607.obj?uuid=9cb7b45e9645413d802e18074be9ebc6",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C530607.step?uuid=9cb7b45e9645413d802e18074be9ebc6",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 6.762477999999874, z: -0.24999019999999983 },
      }}
      {...props}
    />
  )
}