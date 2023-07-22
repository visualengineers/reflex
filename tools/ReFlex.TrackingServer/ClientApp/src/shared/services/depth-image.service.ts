import { Inject, Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { ImageByteArray } from '@reflex/shared-types';
import { fromEventPattern, Observable, using } from 'rxjs';
import { LogService } from 'src/app/log/log.service';

@Injectable({
  providedIn: 'root'
})
export class DepthImageService {
  private readonly connection: signalR.HubConnection;

  // eslint-disable-next-line new-cap
  public constructor(@Inject('BASE_URL') private readonly baseUrl: string, private readonly logService: LogService) {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.baseUrl}dihub`)
      .build();

    this.connection.start().catch((error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  /**
   * @return an Observable of Array of ImageByteArray from the currently configured camera
   */
  public getDepthImage(): Observable<ImageByteArray> {
    const imageBytes$ = fromEventPattern<ImageByteArray>(
      (handler) => this.connection.on('depthImage', handler),
      (handler) => this.connection.off('depthImage', handler)
    );

    return using(() => {
      this.connection.send('startDepthImage').catch((error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      });

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      return { unsubscribe: async () => this.connection.send('stopDepthImage').catch((error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      }) };
    }, () => imageBytes$);

  }
}
