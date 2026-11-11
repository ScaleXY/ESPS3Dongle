import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["GND"],
  pin2: ["VOUT1"],
  pin3: ["VIN1"],
  pin4: ["PR1"],
  pin5: ["MODE"],
  pin6: ["VIN2"],
  pin7: ["VOUT2"],
  pin8: ["ST"]
} as const

const pinAttributes = {
  pin1: {requiresGround: true, mustBeConnected: true},
  pin3: {isInput: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "1uF"},
  pin6: {isInput: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "1uF"},
  pin2: {isOutput: true, canUseTriState: true, providesPower: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "100nF"},
  pin4: {isInput: true, mustBeConnected: true},
  pin5: {isInput: true, mustBeConnected: true},
  pin7: {isOutput: true, canUseTriState: true, providesPower: true},
  pin8: {isOutput: true, needsExternalPullup: true, canUseOpenDrain: true}
} satisfies NonNullable<ChipProps["pinAttributes"]>

export const TPS2116DRLR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C3235557"
  ]
}}
      manufacturerPartNumber="TPS2116DRLR"
      footprint="soic_p0.5mm_w1.96mm_pw0.28mm_pl0.68mm_pin1location(leftside,bottom)"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C3235557.obj?uuid=7de5db90ab974d88b4eb22e148e2ee81",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C3235557.step?uuid=7de5db90ab974d88b4eb22e148e2ee81",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.000012699999984988608, y: 0, z: -0.135 },
      }}
      {...props}
    />
  )
}