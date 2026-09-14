import { Component, ElementRef, input, OnChanges, ViewChild } from '@angular/core';
import { PerformanceDataItem } from '@reflex/shared-types';
import * as d3 from 'd3';

@Component({
  selector: 'app-performance-visualization',
  templateUrl: './performance-visualization.component.html',
  styleUrls: ['./performance-visualization.component.scss']
})
export class PerformanceVisualizationComponent implements OnChanges {

  @ViewChild('panel')
  public d3Panel!: ElementRef;

  public readonly data = input<Array<PerformanceDataItem>>([]);

  public readonly groups = input<Array<string>>([]);

  public readonly visId = input('defaultVis');

  public readonly refreshRate = input(10);

  public readonly numSamples = input(200);

  public readonly isProcessingGraph = input(false);

  public width = 200;
  public height = 150;

  private showTooltip = false;
  private mousePosition = 0;

  private updateIdx = 0;

  private average = 0;

  public ngOnChanges(): void {

    this.updateIdx++;

    if (this.updateIdx % this.refreshRate() !== 0) {
      return;
    }

    // skip changes accroding to refresh rate
    this.updateIdx = 0;

    const entries = this.data().length;
    const isProcessingGraph = this.isProcessingGraph();
    if (isProcessingGraph) {
      // const prep = this.data.map((item) => item.processingPreparation ?? 0).reduce((prev, curr) => prev + curr, 0) / entries;
      // const upd = this.data.map((item) => item.processingUpdate ?? 0).reduce((prev, curr) => prev + curr, 0) / entries;
      // const conv = this.data.map((item) => item.processingConvert ?? 0).reduce((prev, curr) => prev + curr, 0) / entries;
      // const smooth = this.data.map((item) => item.processingSmoothing ?? 0).reduce((prev, curr) => prev + curr, 0) / entries;
      // const extr = this.data.map((item) => item.processingExtremum ?? 0).reduce((prev, curr) => prev + curr, 0) / entries;
      this.average = entries > 0
        ? this.data().map((item) => item.totalProcessing ?? 0).reduce((prev, curr) => prev + curr, 0) / entries
        : 0;
    } else {
      this.average = entries > 0
        ? this.data().map((item) => item.totalFilter ?? 0).reduce((prev, curr) => prev + curr, 0) / entries
        : 0;
    }

    d3.selectAll(`#${this.visId()} > *`).remove();

    this.width = this.d3Panel.nativeElement.clientWidth;
    this.height = this.d3Panel.nativeElement.clientHeight;

    const svg = d3.select(`#${this.visId()}`)
      .append('svg')
      .attr('viewBox', [0, 0, this.width, this.height])
      .attr('id', `${this.visId()}_svg`)
      .attr('width', this.width)
      .attr('height', this.height)
      .style('-webkit-tap-highlight-color', 'transparent')
      .style('overflow', 'visible')
      .on('pointerenter pointermove', (event: Event) => this.pointermoved(event))
      .on('pointerleave', () => this.pointerleft())
      .on('touchstart', (event) => event.preventDefault());

    const colors = ['#002338', '#225473', '#005b94', '#0071B7', '#3f99d1'];

    const stackedData = d3.stack<PerformanceDataItem>().keys(this.groups())(this.data());

    // Add X axis --> scale to number of samples
    const x = d3.scaleLinear()
      .domain([0, this.numSamples()])
      .range([0, this.width]);

    const y = d3.scaleLinear()
      .range([this.height, 0])
      .domain([0, d3.max(this.data(), (d) => this.isProcessingGraph() ? d.totalProcessing : d.totalFilter) ?? 100]);

    svg.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('.tick line').clone()
        .attr('x2', this.width)
        .attr('stroke-opacity', 0.2));

    const area = d3.area()
      .x((d, i) => x(i))
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]));


    // Show the areas
    const valueGroups = svg.selectAll('.valgroup')
      .data(stackedData)
      .enter()
      .append('g')
      .attr('class', 'valgroup')
      .style('fill', (d, i) => colors[i]);

    // @ts-ignore
    valueGroups.append('path').attr('d', (d) => area(d));

    const yAvg = y(this.average);

    // draw average line
    svg.append('g')
      .append('line')
      .attr('stroke', '#aaa')
      .attr('stroke-dasharray', '8 4')
      .attr('x1', x(0))
      .attr('y1', yAvg)
      .attr('x2', x(this.numSamples()))
      .attr('y2', yAvg);

    // darw background for average label
    const avgBg = svg.append('rect')
      .attr('width', x(0.15 * this.numSamples()))
      .attr('height', 20)
      .attr('x', x(0.85 * this.numSamples()))
      .attr('y', 0)
      .attr('fill', '#ffffff66');

    // draw averabe label
    const avgText = svg.append('g')
      .append('text')
      .call((text) => text
        .append('tspan')
        .data([`${this.average.toFixed(2)} ms`])
        .append('tspan')
        .attr('x', 0)
        .attr('y', (n, i) => `${i * 1.1}em`)
        .attr('font-weight', (n, i) => i ? null : 'bold')
        .text((d) => d));

    avgText.attr('transform', `translate(${x(0.9 * this.numSamples())},${yAvg - 12})`);

    avgBg.attr('transform', `translate(${0},${yAvg - 25})`);

    if (this.showTooltip) {

      // const bisect = d3.bisector((d: PerformanceDataItem) => d.frameId).center;
      const i = Math.round(x.invert(this.mousePosition));

      if (i >= this.data().length) {
        return;
      }
      // const i = bisect(this.data, x.invert(this.mousePosition));
      // Create the tooltip container.
      const tooltip = svg.append('g');
      tooltip.style('display', null);

      const yValue = isProcessingGraph ? this.data()[i].totalProcessing ?? 0 : this.data()[i].totalFilter ?? 0;

      const posX = x(i);
      const posY = y(yValue);

      tooltip.attr('transform', `translate(${posX},${posY})`);

      const path = tooltip.selectAll('path')
        .join('path')
        .attr('fill', '#ffffffaa')
        .attr('stroke', 'black');

      const text = tooltip.selectAll('text')
        .join('text')
        .call((tooltiptext) => tooltiptext
          .selectAll('tspan')
          .data(['Total: ', `${yValue.toFixed(2)} ms`])
          .join('tspan')
          .attr('x', 0)
          .attr('y', (n, ttidx) => `${ttidx * 1.1}em`)
          .attr('font-weight', (n, ttidx) => ttidx ? null : 'bold')
          .text((d) => d));

      const ttWidth = 50;
      const ttHeight = 25;

      // move the text upwards
      text.attr('transform', `translate(${-ttWidth / 2},${-ttHeight - 5})`);

      // draw the box
      path.attr('d', `M${(-ttWidth / 2) - 10},-5H-5l5,5l5,-5H${(ttWidth / 2) + 10}v${-ttHeight - 20}h-${ttWidth + 20}z`);
    }
  }


  private pointermoved(event: Event): void {
    this.showTooltip = true;
    this.mousePosition = d3.pointer(event)[0];
  }

  private pointerleft(): void {
    this.showTooltip = false;
  }
}
