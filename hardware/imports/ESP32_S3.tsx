import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["LNA_IN"],
  pin2: ["VDD3P31"],
  pin3: ["VDD3P32"],
  pin4: ["CHIP_PU"],
  pin5: ["GPIO0"],
  pin6: ["GPIO1"],
  pin7: ["GPIO2"],
  pin8: ["GPIO3"],
  pin9: ["GPIO4"],
  pin10: ["GPIO5"],
  pin11: ["GPIO6"],
  pin12: ["GPIO7"],
  pin13: ["GPIO8"],
  pin14: ["GPIO9"],
  pin15: ["GPIO10"],
  pin16: ["GPIO11"],
  pin17: ["GPIO12"],
  pin18: ["GPIO13"],
  pin19: ["GPIO14"],
  pin20: ["VDD3P3_RTC"],
  pin21: ["XTAL_32K_P"],
  pin22: ["XTAL_32K_N"],
  pin23: ["GPIO17"],
  pin24: ["GPIO18"],
  pin25: ["GPIO19"],
  pin26: ["GPIO20"],
  pin27: ["GPIO21"],
  pin28: ["SPICS1"],
  pin29: ["VDD_SPI"],
  pin30: ["SPIHD"],
  pin31: ["SPIWP"],
  pin32: ["SPICS0"],
  pin33: ["SPICLK"],
  pin34: ["SPIQ"],
  pin35: ["SPID"],
  pin36: ["SPICLK_N"],
  pin37: ["SPICLK_P"],
  pin38: ["GPIO33"],
  pin39: ["GPIO34"],
  pin40: ["GPIO35"],
  pin41: ["GPIO36"],
  pin42: ["GPIO37"],
  pin43: ["GPIO38"],
  pin44: ["MTCK"],
  pin45: ["MTDO"],
  pin46: ["VDD3P3_CPU"],
  pin47: ["MTDI"],
  pin48: ["MTMS"],
  pin49: ["U0TXD"],
  pin50: ["U0RXD"],
  pin51: ["GPIO45"],
  pin52: ["GPIO46"],
  pin53: ["XTAL_N"],
  pin54: ["XTAL_P"],
  pin55: ["VDDA1"],
  pin56: ["VDDA2"],
  pin57: ["EP"]
} as const

const pinAttributes = {
  pin55: {requiresPower: true},
  pin56: {requiresPower: true}
} as const

const footprinterPinLabels = {
  ...pinLabels,
  "pin57": [...pinLabels["pin57"], "thermalpad"],
} as const

export const ESP32_S3 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={footprinterPinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C2913192"
  ]
}}
      manufacturerPartNumber="ESP32-S3"
      footprint="qfn56_thermalpad4mmx4mm_p0.4mm_h7.68mm_pw0.2mm_pl0.66mm"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2913192.obj?uuid=6d30b5a04660477fbdff168686b01590",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2913192.step?uuid=6d30b5a04660477fbdff168686b01590",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.86 },
      }}
      {...props}
    />
  )
}