import { Component } from 'react'
import { HistoryState } from '../types/history-state';
import { InteractionFrame } from '@reflex/shared-types';
import { Interaction } from '@reflex/shared-types';

// component for rendering point
export class History extends Component<InteractionFrame, HistoryState> {

  constructor(props: InteractionFrame) {
    super(props);

    // initial state: empty history
    this.state = { history: [] };
  }

  render() {

    if (this.props.frameId > 0 && this.state.history.findIndex((elem) => elem.frameId === this.props.frameId) < 0) {
      this.state.history.push(this.props);
    }

    if (this.state.history.length > 100) {
      this.state.history.splice(0,1);
    }

    return (
        this.state.history.filter((f) => f.frameId > 0).map((f) =>
        <div key={f.frameId} className="message__box">
          <p className="message__id">{f.frameId}</p>
          <div>
            [
              { f.interactions.map((c: Interaction, i: number) =>
                <p key={`${f.frameId}_${i}`} className="message__tp">
                    { JSON.stringify(c) }
                </p>
                )
              }
            ]
          </div>
        </div>
        )
    );
  }
}
