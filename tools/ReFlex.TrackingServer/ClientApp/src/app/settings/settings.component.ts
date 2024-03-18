/* eslint-disable max-lines */
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { SettingsService } from 'src/shared/services/settingsService';
import { Subscription, combineLatest, interval } from 'rxjs';
import { LogService } from '../log/log.service';
import { TrackingService } from 'src/shared/services/tracking.service';
import { PerformanceService } from 'src/shared/services/performance.service';
import { switchMap } from 'rxjs/operators';
import { DEFAULT_SETTINGS, DepthCameraState, ExtremumTypeCheckMethod, FilterType, JsonSimpleValue, LimitationFilterType, PerformanceData, PerformanceDataItem, TrackingServerAppSettings } from '@reflex/shared-types';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit, OnDestroy {


  public settings: TrackingServerAppSettings = DEFAULT_SETTINGS;

  public canRestore = false;
  public isTrackingActive = false;
  public isCurrentlyInitializingLimitationFilter = false;
  public isLimitationFilterInitialized = false;

  public performanceDataFilter: PerformanceData = { data: [] };
  public performanceDataProcess: PerformanceData = { data: [] };

  public performanceDataFilterVis: Array<PerformanceDataItem> = [];
  public performanceDataProcessingVis: Array<PerformanceDataItem> = [];

  public performanceDataFilterGroups = ['limitationFilter', 'valueFilter', 'thresholdFilter', 'boxFilter', 'updatePointCloud'];
  public performanceDataProcessingGroups = ['processingPreparation', 'processingUpdate', 'processingConvert', 'processingSmoothing', 'processingExtremum'];

  public filters: Array<JsonSimpleValue> = Object.values(FilterType)
    .filter((k) => k === Number(k))
    .map((x) => (
      { name: FilterType[Number(x)], value: x }));

  public selectedFilterIdx = -1;

  public limitationFilters: Array<JsonSimpleValue> = Object.values(LimitationFilterType)
    .filter((k) => k === Number(k))
    .map((x) => (
      { name: LimitationFilterType[Number(x)], value: x }));

  public selectedLimitationFilterIdx = -1;

  public checks: Array<JsonSimpleValue> = Object.values(ExtremumTypeCheckMethod)
    .filter((k) => k === Number(k))
    .map((x) => (
      { name: ExtremumTypeCheckMethod[Number(x)], value: x }));

  public selectedExtremumCheckIdx = -1;

  public showSettingsJSON = false;
  public settingsJSON = '';

  private settingsSubscription?: Subscription;
  private trackingStatusSubscription?: Subscription;
  private performanceSubscription?: Subscription;
  private limitationFilterStatePolling?: Subscription;

  private _selectedFilterType: FilterType = FilterType.None;
  private _selectedLimitationFilterType: LimitationFilterType = LimitationFilterType.LimitationFilter;
  private _selectedCheckType: ExtremumTypeCheckMethod = ExtremumTypeCheckMethod.Global;

  public constructor(
    // eslint-disable-next-line new-cap
    @Inject('BASE_URL') private readonly baseUrl: string,
    private readonly settingsService: SettingsService,
    private readonly logService: LogService,
    private readonly trackingService: TrackingService,
    private readonly performanceService: PerformanceService
  ) {
  }

  public ngOnInit(): void {
    this.settingsSubscription = this.settingsService.getSettings().subscribe((result) => {
      this.settings = result;
      this.selectedFilterIdx = result.filterSettingValues.smoothingValues.type;
      this.selectedExtremumCheckIdx = result.filterSettingValues.extremumSettings.checkMethod;
      this.selectedLimitationFilterIdx = result.filterSettingValues.limitationFilterType;
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
    this.settingsService.update();
    this.updateCanRestore();

    this.trackingStatusSubscription = this.trackingService.getStatus()
      .subscribe((result) => {
        this.isTrackingActive = result.depthCameraStateName === DepthCameraState[DepthCameraState.Streaming];
      }, (error) => {
        console.error(error);
        this.logService.sendErrorLog(`${error}`);
      });

    this.performanceSubscription = this.performanceService.getData().subscribe((result) => {
      this.processPerformanceData(result);
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });

    this.limitationFilterStatePolling = interval(1000).pipe(
      switchMap(() =>
        combineLatest(
          [
            this.settingsService.isLimitationFilterInitializing(),
            this.settingsService.isLimitationFilterInitialized()
          ]
        ))
    ).subscribe((result) => {
      this.isCurrentlyInitializingLimitationFilter = result[0].value as boolean;
      this.isLimitationFilterInitialized = result[1].value as boolean;
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public ngOnDestroy(): void {
    this.settingsSubscription?.unsubscribe();
    this.trackingStatusSubscription?.unsubscribe();
    this.performanceSubscription?.unsubscribe();
    this.limitationFilterStatePolling?.unsubscribe();
  }

  public computeZeroPlane(): void {
    this.settingsService.getZeroPlaneDistance().subscribe((result) => {
      console.log(`Successfully updated distance: ${JSON.stringify(result)}`);
      this.settingsService.update();
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public initializeAdvancedLimitationFilter(): void {
    if (this.isCurrentlyInitializingLimitationFilter) {
      return;
    }
    this.settingsService.initializeAdvancedLimitationFilter().subscribe((result) => {
      console.log(`initialized Advanced Limitation Filter: ${result.value}:${result.name}`);
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public resetAdvancedLimitationFilter(): void {
    if (this.isCurrentlyInitializingLimitationFilter) {
      return;
    }

    this.settingsService.resetAdvancedLimitationFilter().subscribe((result) => {
      console.log(`reset Advanced Limitation Filter: ${result.value}:${result.name}`);
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public saveSettings(settings: TrackingServerAppSettings): void {
    this.settingsService.saveSettings(settings).subscribe((result) => {
      console.log(`Successfully sent POST request: ${JSON.stringify(result)}`);
      this.settingsService.update();
      this.updateCanRestore();
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public resetSettings(): void {
    this.settingsService.reset().subscribe((result) => {
      console.log(`reset default settings: ${JSON.stringify(result)}`);
      this.settingsService.update();
      this.updateCanRestore();
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public restoreSettings(): void {
    this.settingsService.restore().subscribe((result) => {
      console.log(`restore settings from backup: ${JSON.stringify(result)}`);
      this.settingsService.update();
      this.updateCanRestore();
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public updateCanRestore(): void {
    this.settingsService.getCanRestore().subscribe((result) => {
      this.canRestore = result.value as boolean;
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public saveBorder(): void {
    this.settingsService.setBorder(this.settings.filterSettingValues.borderValue).subscribe((result) => {
      console.log(`Successfully sent POST request: ${JSON.stringify(result)}`);
      this.settingsService.update();
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public saveMinDistanceFromSensor(): void {
    this.settingsService.setMinDistanceFromSensor(this.settings.filterSettingValues.minDistanceFromSensor).subscribe((result) => {
      console.log(`Successfully sent POST request: ${result}`);
      this.settingsService.update();
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public saveThreshold(): void {
    this.settingsService.setThreshold(this.settings.filterSettingValues.threshold).subscribe((result) => {
      console.log(`Successfully sent POST request: ${result.value}:${result.name}`);
      this.settingsService.update();
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public saveConfidence(): void {
    this.settingsService.setConfidence(this.settings.filterSettingValues.confidence).subscribe((result) => {
      console.log(`Successfully sent POST request: ${JSON.stringify(result)}`);
      this.settingsService.update();
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public saveSmoothingValues(): void {
    this.settingsService.setSmoothingValues(this.settings.filterSettingValues.smoothingValues).subscribe((result) => {
      console.log(`Successfully sent POST request: ${JSON.stringify(result)}`);
      this.settingsService.update();
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public saveExtremumValues(): void {
    this.settingsService.setExtremumSettings(this.settings.filterSettingValues.extremumSettings).subscribe((result) => {
      console.log(`Successfully sent POST request: ${JSON.stringify(result)}`);
      this.settingsService.update();
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public saveExtremumCheckType(): void {

    if (this.selectedExtremumCheckIdx <= 0 || this.selectedExtremumCheckIdx >= this.checks.length) {
      this._selectedCheckType = ExtremumTypeCheckMethod.Global;
    } else {
      this._selectedCheckType = this.selectedExtremumCheckIdx as ExtremumTypeCheckMethod;
    }

    this.settings.filterSettingValues.extremumSettings.checkMethod = this._selectedCheckType;

    this.saveExtremumValues();
  }

  public saveDistance(): void {
    this.settingsService.setDistance(this.settings.filterSettingValues.distanceValue).subscribe((result) => {
      console.log(`Successfully sent POST request: ${JSON.stringify(result)}`);
      this.settingsService.update();
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public saveOptimizedBoxFilter(): void {
    this.settingsService.setOptimizedBoxFilter(this.settings.filterSettingValues.useOptimizedBoxFilter).subscribe((result) => {
      console.log(`Successfully sent POST request: ${result.value}:${result.name}`);
      this.settingsService.update();
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public saveFilterRadius(): void {
    this.settingsService.setFilterRadius(this.settings.filterSettingValues.boxFilterRadius).subscribe((result) => {
      console.log(`Successfully sent POST request: ${result.value}:${result.name}`);
      this.settingsService.update();
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public saveFilterPasses(): void {
    this.settingsService.setFilterPasses(this.settings.filterSettingValues.boxFilterNumPasses).subscribe((result) => {
      console.log(`Successfully sent POST request: ${result.value}:${result.name}`);
      this.settingsService.update();
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public saveFilterThreads(): void {
    this.settingsService.setFilterThreads(this.settings.filterSettingValues.boxFilterNumThreads).subscribe((result) => {
      console.log(`Successfully sent POST request: ${result.value}:${result.name}`);
      this.settingsService.update();
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public saveMinAngle(): void {
    this.settingsService.setMinAngle(this.settings.filterSettingValues.minAngle).subscribe((result) => {
      console.log(`Successfully sent POST request: ${result.value}:${result.name}`);
      this.settingsService.update();
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public saveFilterType(): void {
    if (this.selectedFilterIdx <= 0 || this.selectedFilterIdx >= this.filters.length) {
      this._selectedFilterType = FilterType.None;
    } else {
      this._selectedFilterType = this.selectedFilterIdx as FilterType;
    }

    this.settings.filterSettingValues.smoothingValues.type = this._selectedFilterType;

    this.saveSmoothingValues();
  }

  public saveLimitationFilterType(): void {

    if (this.selectedLimitationFilterIdx <= 0 || this.selectedLimitationFilterIdx >= this.limitationFilters.length) {
      this._selectedLimitationFilterType = LimitationFilterType.LimitationFilter;
    } else {
      this._selectedLimitationFilterType = this.selectedLimitationFilterIdx as LimitationFilterType;
    }

    this.settings.filterSettingValues.limitationFilterType = this._selectedLimitationFilterType;

    this.settingsService.setLimitationFilterType(this.settings.filterSettingValues).subscribe((result) => {
      console.log(`Successfully sent POST request: ${result.value}:${result.name}`);
      this.settingsService.update();
    }, (error) => {
      console.error(error);
      this.logService.sendErrorLog(`${error}`);
    });
  }

  public displaySettingsJSON(settings: TrackingServerAppSettings): void {
    this.showSettingsJSON = true;

    this.settingsJSON = JSON.stringify(settings);
  }

  public hideSettingsJSON(): void {
    this.showSettingsJSON = false;

    this.settingsJSON = '';
  }

  public uploadConfig(e: Event): void {

    const input = e.target as HTMLInputElement;

    if (input.files === null) {
      return;
    }
    const file = input.files[0];

    const fileReader = new FileReader();
    fileReader.onload = (): void => {
      if (typeof fileReader.result === 'string') {
        const settings = JSON.parse(fileReader.result) as TrackingServerAppSettings;

        if (settings) {
          this.saveSettings(settings);
        } else {
          this.logService.sendErrorLog(`Cannot update Settings. provided file content is invalid: Text: ${fileReader.result}`);
        }
      }
    };

    fileReader.readAsText(file);
  }

  private processPerformanceData(data: PerformanceData): void {

    data.data.forEach((elem) => {

      const filterValid = (elem.boxFilter ?? 0) > 0 || (elem.limitationFilter ?? 0) > 0 || (elem.thresholdFilter ?? 0) > 0 || (elem.updatePointCloud ?? 0) > 0 || (elem.valueFilter ?? 0) > 0;
      const processValid = (elem.processingConvert ?? 0) > 0 || (elem.processingExtremum ?? 0) > 0 || (elem.processingPreparation ?? 0) > 0 || (elem.processingSmoothing ?? 0) > 0 || (elem.processingUpdate ?? 0) > 0;

      if (filterValid) {
        elem.totalFilter = (elem.boxFilter ?? 0) + (elem.limitationFilter ?? 0) + (elem.thresholdFilter ?? 0) + (elem.updatePointCloud ?? 0) + (elem.valueFilter ?? 0);

        const existingIdxData = this.performanceDataFilter.data.findIndex((item) => item.frameId === elem.frameId);
        if (existingIdxData < 0) {
          this.performanceDataFilter.data.push(elem);
        } else {
          this.performanceDataFilter.data[existingIdxData] = elem;
        }
        const existingIdx = this.performanceDataFilterVis.findIndex((item) => item.frameId === elem.frameId);
        if (existingIdx < 0) {
          this.performanceDataFilterVis.push(elem);
        } else {
          this.performanceDataFilterVis[existingIdx] = elem;
        }
        this.performanceDataFilterVis = this.performanceDataFilterVis.sort((a, b) => a.frameId - b.frameId).slice(-100);
      }

      if (processValid) {
        elem.totalProcessing = (elem.processingConvert ?? 0) + (elem.processingExtremum ?? 0) + (elem.processingPreparation ?? 0) + (elem.processingSmoothing ?? 0) + (elem.processingUpdate ?? 0);

        const existingIdxData = this.performanceDataProcess.data.findIndex((item) => item.frameId === elem.frameId);
        if (existingIdxData < 0) {
          this.performanceDataProcess.data.push(elem);
        } else {
          this.performanceDataProcess.data[existingIdxData] = elem;
        }

        const existingIdx = this.performanceDataProcessingVis.findIndex((item) => item.frameId === elem.frameId);
        if (existingIdx < 0) {
          this.performanceDataProcessingVis.push(elem);
        } else {
          this.performanceDataProcessingVis[existingIdx] = elem;
        }

        this.performanceDataProcessingVis = this.performanceDataProcessingVis.sort((a, b) => a.frameId - b.frameId).slice(-200);

      }
    });

    this.performanceDataFilter.data = this.performanceDataFilter.data.sort((a, b) => a.frameId - b.frameId).slice(-7);
    this.performanceDataProcess.data = this.performanceDataProcess.data.sort((a, b) => a.frameId - b.frameId).slice(-7);
  }
}
