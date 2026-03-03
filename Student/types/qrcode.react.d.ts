declare module 'qrcode.react' {
  import { Component } from 'react'

  interface QRCodeProps {
    value: string
    size?: number
    level?: 'L' | 'M' | 'Q' | 'H'
    includeMargin?: boolean
    fgColor?: string
    bgColor?: string
    imageSettings?: {
      src: string
      x?: number
      y?: number
      height?: number
      width?: number
      excavate?: boolean
    }
  }

  export class QRCodeSVG extends Component<QRCodeProps> {}
  export class QRCodeCanvas extends Component<QRCodeProps> {}
  export default class QRCode extends Component<QRCodeProps> {}
}
