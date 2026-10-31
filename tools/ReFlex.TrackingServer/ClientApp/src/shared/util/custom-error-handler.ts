import { ErrorHandler, Injectable, inject } from '@angular/core';
import { LogService } from 'src/app/log/log.service';

@Injectable()
export class CustomErrorHandler implements ErrorHandler {
  private readonly logService = inject(LogService);

  public handleError(error?: unknown): void {
    if (error === undefined) {
      this.logService.sendErrorLog(
        `undefined error: no error message specified`
      );

      return;
    }

    this.logService.sendErrorLog(`${error} - ${JSON.stringify(error)}`);

    console.error(error);
  }
}
