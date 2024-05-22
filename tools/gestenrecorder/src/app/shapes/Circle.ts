import { ConfigurationService } from '../service/configuration.service';

export interface CircleDto {
    posX: number;
    posY: number;
    radius: number;
    color: string;
}

export class CircleRenderer {

    public constructor(
        private readonly _ctx: CanvasRenderingContext2D | undefined, 
        private readonly _configurationService: ConfigurationService) {}

    public draw(circleDto: CircleDto): void {

        const minSize = this._configurationService.getCircleSize().min;

        if (this._ctx === undefined) {
            return;
        }

        this._ctx.fillStyle = circleDto.color;

        // crater resulting from touch
        this._ctx.globalAlpha = 0.4;
        this._ctx.beginPath();
        this._ctx.arc(circleDto.posX, circleDto.posY, circleDto.radius, 0, 2 * Math.PI);
        this._ctx.fill();

        // contact area on touch
        this._ctx.globalAlpha = 1.0;
        this._ctx.beginPath();
        this._ctx.arc(circleDto.posX, circleDto.posY, minSize - 5, 0, 2 * Math.PI);
        this._ctx.fill();

    }

    public drawOnTimeline(circleDto: CircleDto): void {

        if (this._ctx === undefined) {
            return;
        }

        this._ctx.fillStyle = circleDto.color;

        this._ctx.globalAlpha = 0.6;
        this._ctx.beginPath();
        this._ctx.arc(circleDto.posX, circleDto.posY, circleDto.radius, 0, 2 * Math.PI);
        this._ctx.fill();

    }
}
