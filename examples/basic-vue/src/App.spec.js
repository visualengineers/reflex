import { mount } from '@vue/test-utils'
import App from './App.vue'
import { vi } from 'vitest'

// mock the global Websocket
const WebSocketMock = vi.fn(() => ({
  onmessage: vi.fn(),
  onopen: vi.fn(),
  onclose: vi.fn(),
  onerror: vi.fn(),
}))

vi.stubGlobal('WebSocket', WebSocketMock);

test('renders the Home Component', () => {
  const wrapper = mount(App);

  const homeComponent = wrapper.get('[data-test="HomeComponent"]')

  expect(homeComponent).toBeTruthy();
})
