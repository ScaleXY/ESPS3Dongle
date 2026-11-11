import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["IN"],
  pin2: ["GND"],
  pin3: ["EN"],
  pin4: ["NC"],
  pin5: ["OUT"],
  pin6: ["EP"]
} as const

const pinAttributes = {
  pin2: {requiresGround: true},
  pin4: {doNotConnect: true}
} as const

export const TLV75733PDYDR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C22399950"
  ]
}}
      manufacturerPartNumber="TLV75733PDYDR"
      footprint={<footprint>
        <smtpad portHints={["pin2"]} pcbX="0mm" pcbY="-1.2000738mm" width="0.5999988mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="0.94996mm" pcbY="-1.2000738mm" width="0.5999988mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="-0.94996mm" pcbY="-1.2000738mm" width="0.5999988mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="0.94996mm" pcbY="1.2000738mm" width="0.5999988mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin5"]} pcbX="-0.94996mm" pcbY="1.2000738mm" width="0.5999988mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin6"]} pcbX="0mm" pcbY="-0mm" width="1.6999966mm" height="0.9750044mm" shape="rect" />
<silkscreenpath route={[{"x":-1.524000000000001,"y":0.6984999999998536},{"x":-1.524000000000001,"y":-0.698500000000081}]} />
<silkscreenpath route={[{"x":1.397000000000162,"y":0.4224274000000605},{"x":1.397000000000162,"y":-0.42235120000009374}]} />
<silkscreenpath route={[{"x":-0.3809999999998581,"y":0.8889999999998963},{"x":0.3810000000000855,"y":0.8889999999998963}]} />
<silkscreentext text="{NAME}" pcbX="-0.0381mm" pcbY="2.7018mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-1.774000000000001,"y":1.951799999999821},{"x":1.6977999999999156,"y":1.951799999999821},{"x":1.6977999999999156,"y":-2.1804000000001906},{"x":-1.774000000000001,"y":-2.1804000000001906},{"x":-1.774000000000001,"y":1.951799999999821}]} />
      </footprint>}
      
      {...props}
    />
  )
}