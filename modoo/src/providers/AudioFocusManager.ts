export type AudioRole = 'main' | 'background';

export type FocusAction = 'pause' | 'stop' | 'duck' | 'restore';

type FocusListener = (action: FocusAction) => void;

interface FocusEntry {
  role: AudioRole;
  listener: FocusListener;
}

class AudioFocusManager {
  private entries = new Map<string, FocusEntry>();

  request(id: string, role: AudioRole, listener: FocusListener): void {
    if (this.entries.has(id)) {
      return;
    }

    if (role === 'main') {
      for (const [entryId, entry] of this.entries) {
        if (entry.role === 'main' && entryId !== id) {
          entry.listener('stop');
        }
        if (entry.role === 'background') {
          entry.listener('duck');
        }
      }
    }

    if (role === 'background') {
      const hasActiveMain = [...this.entries.values()].some((e) => e.role === 'main');
      if (hasActiveMain) {
        listener('duck');
      }
    }

    this.entries.set(id, { role, listener });
  }

  release(id: string): void {
    const entry = this.entries.get(id);
    this.entries.delete(id);

    if (entry?.role === 'main') {
      const hasActiveMain = [...this.entries.values()].some((e) => e.role === 'main');
      if (!hasActiveMain) {
        for (const [, bgEntry] of this.entries) {
          if (bgEntry.role === 'background') {
            bgEntry.listener('restore');
          }
        }
      }
    }
  }

  hasActiveMain(): boolean {
    return [...this.entries.values()].some((e) => e.role === 'main');
  }

  get entryCount(): number {
    return this.entries.size;
  }

  stopAll(): void {
    for (const [id, entry] of this.entries) {
      entry.listener('stop');
    }
    this.entries.clear();
  }
}

export { AudioFocusManager };
export const audioFocusManager = new AudioFocusManager();
