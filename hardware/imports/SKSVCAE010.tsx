import type { PushButtonProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"]
} as const

export const SKSVCAE010 = (props: PushButtonProps<typeof pinLabels>) => {
  const { name = "SW1", ...restProps } = props

  return (
    <pushbutton
      name={name}
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C115364"
  ]
}}
      manufacturerPartNumber="SKSVCAE010"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-1.499997mm" pcbY="0.575056mm" width="0.6999986mm" height="0.5999988mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="-1.499997mm" pcbY="-0.575056mm" width="0.6999986mm" height="0.5999988mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="1.499997mm" pcbY="0.575056mm" width="0.6999986mm" height="0.5999988mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="1.499997mm" pcbY="-0.575056mm" width="0.6999986mm" height="0.5999988mm" shape="rect" />
<silkscreenpath route={[{"x":-1.0008870000000343,"y":-1.0007600000000139},{"x":1.0006329999999934,"y":-1.0007600000000139}]} />
<silkscreenpath route={[{"x":-1.0008870000000343,"y":1.0007600000000139},{"x":-1.0008870000000343,"y":0.9982199999999466},{"x":-1.0031983999999738,"y":0.995908600000007}]} />
<silkscreenpath route={[{"x":-1.0008870000000343,"y":-1.0007600000000139},{"x":-1.0008870000000343,"y":-0.9982199999999466},{"x":-1.0031983999999738,"y":-0.9959085999998933}]} />
<silkscreenpath route={[{"x":1.0006329999999934,"y":-1.0007600000000139},{"x":1.0006329999999934,"y":-0.9982199999999466},{"x":1.0029444000000467,"y":-0.9959085999998933}]} />
<silkscreenpath route={[{"x":1.0006329999999934,"y":1.0007600000000139},{"x":1.0006329999999934,"y":0.9982199999999466},{"x":1.0029444000000467,"y":0.995908600000007}]} />
<silkscreenpath route={[{"x":-1.0008870000000343,"y":1.0007600000000139},{"x":1.0006329999999934,"y":1.0007600000000139}]} />
<silkscreenpath route={[{"x":-1.4001242000000502,"y":0.04389119999996183},{"x":-1.4001242000000502,"y":-0.04389119999984814}]} />
<silkscreenpath route={[{"x":1.399870200000123,"y":0.043865800000048694},{"x":1.399870200000123,"y":-0.043865800000048694}]} />
<silkscreencircle pcbX="-0.000127mm" pcbY="0mm" radius="0.46101mm" />
<silkscreentext text="{NAME}" pcbX="-0.000127mm" pcbY="1.9906mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-2.0999963000000434,"y":1.2000108000002},{"x":2.0999963000000434,"y":1.2000108000002},{"x":2.0999963000000434,"y":-1.199985399999946},{"x":-2.0999963000000434,"y":-1.199985399999946},{"x":-2.0999963000000434,"y":1.2000108000002}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C115364.obj?uuid=5d8beac7ca274e819b9b216e9dcc4a45",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C115364.step?uuid=5d8beac7ca274e819b9b216e9dcc4a45",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: -0.000012700000070253736, z: 0 },
      }}
      {...restProps}
    />
  )
}