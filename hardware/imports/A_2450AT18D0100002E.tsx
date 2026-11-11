import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["FEED"],
  pin2: ["GND1"],
  pin3: ["GND2"],
  pin4: ["GND3"]
} as const

const pinAttributes = {
  pin2: {requiresGround: true},
  pin3: {requiresGround: true},
  pin4: {requiresGround: true}
} as const

export const A_2450AT18D0100002E = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C17410360"
  ]
}}
      manufacturerPartNumber="2450AT18D0100002E"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-1.500124mm" pcbY="-0.649986mm" width="0.999998mm" height="0.5999988mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="1.49987mm" pcbY="-0.649986mm" width="0.999998mm" height="0.5999988mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="1.49987mm" pcbY="0.649986mm" width="0.999998mm" height="0.5999988mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="-1.500124mm" pcbY="0.649986mm" width="0.999998mm" height="0.5999988mm" shape="rect" />
<silkscreenrect pcbX="0mm" pcbY="0mm" width="4.318mm" height="2.286mm" strokeWidth="0.1500124mm" />
<silkscreentext text="1" pcbX="-0.7991348mm" pcbY="-1.0659872mm" anchorAlignment="bottom_left" fontSize="1.599946mm" />
<silkscreentext text="{NAME}" pcbX="-0.001524mm" pcbY="2.153414mm" anchorAlignment="center" fontSize="1mm" />
<fabricationnotepath route={[{"x":-0.7646669999998039,"y":0.37845999999990454},{"x":-0.7646669999998039,"y":-0.25654000000008637},{"x":-0.3836669999998321,"y":-0.25654000000008637},{"x":-0.3836669999998321,"y":0.37845999999990454},{"x":-0.7646669999998039,"y":0.37845999999990454}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":-0.7261351999998169,"y":-1.0150094000000536},{"x":-0.7018303934950154,"y":-1.0736863934952225},{"x":-0.6431533999998464,"y":-1.0979912000001377},{"x":-0.6091427999998587,"y":-1.0979912000001377},{"x":-0.5773167723068582,"y":-1.0848084276931331},{"x":-0.5641339999999673,"y":-1.0529824000001327},{"x":-0.5641339999999673,"y":-0.35399979999999687},{"x":-0.587560946949452,"y":-0.29744214694960647},{"x":-0.6441185999998424,"y":-0.2740152000001217},{"x":-0.6541261999998369,"y":-0.2740152000001217},{"x":-0.680135799999789,"y":-0.28399740000008933},{"x":-0.7071359999998776,"y":-0.30401260000007824},{"x":-0.7871459999998933,"y":-0.38501320000000305},{"x":-0.8431275999998888,"y":-0.4139946000001373},{"x":-0.8651239999999234,"y":-0.43200320000005377},{"x":-0.8811259999999947,"y":-0.45999400000005153},{"x":-0.882141999999817,"y":-0.49799240000015743},{"x":-0.8661399999998594,"y":-0.5329936000000544},{"x":-0.8301227999999128,"y":-0.5590032000000065},{"x":-0.7801355999997668,"y":-0.5590032000000065},{"x":-0.7251445999999078,"y":-0.5329936000000544},{"x":-0.7271257999999534,"y":-0.534009600000104},{"x":-0.7261351999998169,"y":-1.0150094000000536}]} strokeWidth="0mm" isFilled hasStroke={false} />
<courtyardoutline outline={[{"x":-2.250122999999917,"y":1.199985399999946},{"x":2.2498690000001034,"y":1.199985399999946},{"x":2.2498690000001034,"y":-1.1999854000000596},{"x":-2.250122999999917,"y":-1.1999854000000596},{"x":-2.250122999999917,"y":1.199985399999946}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C17410360.obj?uuid=1cf61d20f320415581797e850a73e47b",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C17410360.step?uuid=1cf61d20f320415581797e850a73e47b",
        pcbRotationOffset: 180,
        modelOriginPosition: { x: -0.0001269999999067295, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}