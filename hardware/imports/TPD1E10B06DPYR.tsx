import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"]
} as const

const pinAttributes = {
  pin1: {isPassive: true},
  pin2: {isPassive: true}
} satisfies NonNullable<ChipProps["pinAttributes"]>

export const TPD1E10B06DPYR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      symbol={
        <symbol>
          <port name="pin2" pinNumber={2} aliases={["2"]} direction="right" schX={0.4} schY={0} schStemLength={0.2} />
          <port name="pin1" pinNumber={1} aliases={["1"]} direction="left" schX={-0.4} schY={0} schStemLength={0.2} />
          <schematicpath points={[{"x":-0.04,"y":0.18},{"x":-0.04,"y":0.18},{"x":0,"y":0.14},{"x":0,"y":-0.14},{"x":0.04,"y":-0.18},{"x":0.04,"y":-0.18}]} strokeColor="#880000" />
          <schematicpath svgPath="M 0.2 0.14 L 0 0 L 0.2 -0.14 Z" strokeColor="#880000" />
          <schematicpath svgPath="M -0.2 -0.14 L 0 0 L -0.2 0.14 Z" strokeColor="#880000" />
          <schematictext schX={0} schY={0.38} text="{NAME}" fontSize={0.2} anchor="bottom_center" />
        </symbol>
      }
      supplierPartNumbers={{
  "jlcpcb": [
    "C48260"
  ]
}}
      manufacturerPartNumber="TPD1E10B06DPYR"
      footprint="smdpads2_p1mm_pw0.6mm_ph0.6mm_cyw2.1mm_cyh1.12mm"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C48260.obj?uuid=f6b37c6d5ddb4dd6a33fc5b67c867f96",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C48260.step?uuid=f6b37c6d5ddb4dd6a33fc5b67c867f96",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.00005080000005364127, y: -0.00007619999996677507, z: -0.02 },
      }}
      {...props}
    />
  )
}