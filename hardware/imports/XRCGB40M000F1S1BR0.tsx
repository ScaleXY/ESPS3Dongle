import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["OSC1"],
  pin2: ["NC1"],
  pin3: ["OSC2"],
  pin4: ["NC2"]
} as const

const pinAttributes = {
  pin2: {doNotConnect: true},
  pin4: {doNotConnect: true}
} as const

export const XRCGB40M000F1S1BR0 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C1870451"
  ]
}}
      manufacturerPartNumber="XRCGB40M000F1S1BR0"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-0.650113mm" pcbY="-0.450088mm" width="0.850011mm" height="0.6999986mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="0.650113mm" pcbY="-0.450088mm" width="0.850011mm" height="0.6999986mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="0.650113mm" pcbY="0.449834mm" width="0.850011mm" height="0.6999986mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="-0.649859mm" pcbY="0.450088mm" width="0.850011mm" height="0.6999986mm" shape="rect" />
<silkscreenpath route={[{"x":-1.2698729999999614,"y":1.0160000000000764},{"x":-1.2698729999999614,"y":-1.143000000000029},{"x":1.2701269999998885,"y":-1.143000000000029},{"x":1.2701269999998885,"y":1.0160000000000764},{"x":-1.2698729999999614,"y":1.0160000000000764}]} />
<silkscreenpath route={[{"x":-1.5238730000000942,"y":-0.2539999999999054},{"x":-1.5238730000000942,"y":-1.3969999999999345},{"x":-0.5078730000000178,"y":-1.3969999999999345}]} />
<silkscreentext text="{NAME}" pcbX="-0.126873mm" pcbY="2.016mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-1.3251185000000305,"y":1.0500873000000865},{"x":1.3251185000000305,"y":1.0500873000000865},{"x":1.3251185000000305,"y":-1.0500873000000865},{"x":-1.3251185000000305,"y":-1.0500873000000865},{"x":-1.3251185000000305,"y":1.0500873000000865}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C1870451.obj?uuid=3dcd01fb6c68411cae8127ed2e0ab3c7",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C1870451.step?uuid=3dcd01fb6c68411cae8127ed2e0ab3c7",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.0050000000000000044, y: 0, z: -0.01 },
      }}
      {...props}
    />
  )
}