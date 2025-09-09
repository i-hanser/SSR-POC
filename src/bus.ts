class Bus {
  private target = new EventTarget();
  private listeners = new Map<string, Map<Function, EventListener>>();

  on<T = any>(event: string, handler: (payload: T) => void) {
    const listener: EventListener = (e) => handler((e as CustomEvent).detail);
    let map = this.listeners.get(event);
    if (!map) {
      map = new Map();
      this.listeners.set(event, map);
    }
    map.set(handler, listener);
    this.target.addEventListener(event, listener);
  }

  off<T = any>(event: string, handler: (payload: T) => void) {
    const map = this.listeners.get(event);
    const listener = map?.get(handler);
    if (listener) {
      this.target.removeEventListener(event, listener);
      map!.delete(handler);
    }
  }

  emit<T = any>(event: string, payload?: T) {
    this.target.dispatchEvent(new CustomEvent(event, { detail: payload }));
  }
}

export const bus = new Bus();
export const on = bus.on.bind(bus);
export const off = bus.off.bind(bus);
export const emit = bus.emit.bind(bus);
