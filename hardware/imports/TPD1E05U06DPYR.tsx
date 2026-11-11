import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["I","O"],
  pin2: ["GND"]
} as const

const pinAttributes = {
  pin2: {requiresGround: true}
} as const

export const TPD1E05U06DPYR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C436349"
  ]
}}
      manufacturerPartNumber="TPD1E05U06DPYR"
      footprint="smdpads2_p0.65mm_pw0.4mm_ph0.6mm_cyw1.55mm_cyh1.1mm"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C436349.obj?uuid=6b949832b6e54429b6fc36202eac00ba",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C436349.step?uuid=6b949832b6e54429b6fc36202eac00ba",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.03 },
      }}
      {...props}
    />
  )
}