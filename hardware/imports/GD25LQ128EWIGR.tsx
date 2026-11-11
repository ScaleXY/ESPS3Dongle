import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["N_CS"],
  pin2: ["SO_IO1"],
  pin3: ["WP__IO2"],
  pin4: ["VSS"],
  pin5: ["SI_IO0"],
  pin6: ["SCLK"],
  pin7: ["HOLD__IO3"],
  pin8: ["VCC"],
  pin9: ["EP"]
} as const

const pinAttributes = {
  pin4: {requiresGround: true},
  pin8: {requiresPower: true}
} as const

const footprinterPinLabels = {
  ...pinLabels,
  "pin9": [...pinLabels["pin9"], "thermalpad"],
} as const

export const GD25LQ128EWIGR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={footprinterPinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C2928889"
  ]
}}
      manufacturerPartNumber="GD25LQ128EWIGR"
      footprint="dfn8_thermalpad3.4mmx4.3mm_pillpads_w7.31mm_pw0.58mm_pl1.28mm_pin1location(leftside,bottom)"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2928889.obj?uuid=aeccbecea0df4df4a2a68061a89a4c8e",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2928889.step?uuid=aeccbecea0df4df4a2a68061a89a4c8e",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: 0, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}