import { Injectable } from '@angular/core';
import { CircleDto } from '../../shapes/Circle';
import { ConfigurationService } from '../../service/configuration.service';

@Injectable({
  providedIn: 'root'
})
export class CircleRendererService {
  private ctx?: CanvasRenderingContext2D;

  constructor(private configurationService: ConfigurationService) {}

  setContext(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;
  }

  draw(circleDto: CircleDto): void {
    if (this.ctx === undefined) {
      return;
    }
    this.ctx.beginPath();
    this.ctx.arc(circleDto.posX, circleDto.posY, circleDto.radius, 0, 2 * Math.PI, false);
    this.ctx.fillStyle = circleDto.color;
    this.ctx.fill();
  }
}
