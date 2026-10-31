import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: Array<ServerRoute> = [
  {
    path: '**',
    // Live backend data, SignalR connections and polling start in the browser.
    // Rendering these routes during the build would require a running backend.
    renderMode: RenderMode.Client
  }
];
