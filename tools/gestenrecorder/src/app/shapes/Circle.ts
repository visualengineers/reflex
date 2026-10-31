import { ConfigurationService } from '../service/configuration.service';

export interface CircleDto {
  posX: number;
  posY: number;
  radius: number;
  color: string;
}

export class CircleRenderer {

  public constructor(
    private readonly ctx: CanvasRenderingContext2D | undefined,
    private readonly configurationService: ConfigurationService
  ) {}

  public draw(circleDto: CircleDto): void {

    const minSize = this.configurationService.getCircleSize().min;

    if (this.ctx === undefined) {
      return;
    }

    this.ctx.fillStyle = circleDto.color;

    // crater resulting from touch
    this.ctx.globalAlpha = 0.4;
    this.ctx.beginPath();
    this.ctx.arc(circleDto.posX, circleDto.posY, circleDto.radius, 0, 2 * Math.PI);
    this.ctx.fill();

    // contact area on touch
    this.ctx.globalAlpha = 1.0;
    this.ctx.beginPath();
    this.ctx.arc(circleDto.posX, circleDto.posY, minSize - 5, 0, 2 * Math.PI);
    this.ctx.fill();

  }

  public drawOnTimeline(circleDto: CircleDto): void {

    if (this.ctx === undefined) {
      return;
    }

    this.ctx.fillStyle = circleDto.color;

    this.ctx.globalAlpha = 0.6;
    this.ctx.beginPath();
    this.ctx.arc(circleDto.posX, circleDto.posY, circleDto.radius, 0, 2 * Math.PI);
    this.ctx.fill();

  }
}
