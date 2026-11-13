import { beforeEach, describe, expect, it, vi } from 'vitest';

const invoke = vi.fn();
vi.mock('./client', () => ({ supabase: { functions: { invoke } } }));

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  invoke.mockReset();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  });
  vi.stubGlobal('window', { dispatchEvent: vi.fn() });
  vi.stubGlobal('Event', class {});
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('submitScore', () => {
  const score = { name: 'Tunde', score: 10, coins: 1, distance: 5 };

  it('reports remote on success', async () => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null });
    const { submitScore } = await import('./leaderboard');
    expect(await submitScore(score)).toBe('remote');
    expect(store.size).toBe(0);
    expect(invoke).toHaveBeenCalledWith('submit-score', {
      body: { name: 'Tunde', score: 10, coins: 1, distance: 5, durationS: 0, maxSpeed: 0, nitroUses: 0 },
    });
  });

  it('forwards run metrics', async () => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null });
    const { submitScore } = await import('./leaderboard');
    await submitScore({ ...score, durationS: 12.5, maxSpeed: 300, nitroUses: 1 });
    expect(invoke.mock.calls[0][1].body).toMatchObject({ durationS: 12.5, maxSpeed: 300, nitroUses: 1 });
  });

  it('falls back to local when the function rejects the score', async () => {
    invoke.mockResolvedValue({ data: { ok: false, reason: 'score_too_high' }, error: null });
    const { submitScore } = await import('./leaderboard');
    expect(await submitScore(score)).toBe('local');
    expect(store.size).toBe(1);
  });

  it('falls back to local when invoke throws', async () => {
    invoke.mockRejectedValue(new Error('network'));
    const { submitScore } = await import('./leaderboard');
    expect(await submitScore(score)).toBe('local');
    expect(store.size).toBe(1);
  });

  it('falls back to local when the function errors', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const { submitScore } = await import('./leaderboard');
    expect(await submitScore(score)).toBe('local');
    expect(store.size).toBe(1);
  });

  it('rejects when the local write also fails', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'boom' } });
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => { throw new Error('quota'); },
    });
    const { submitScore } = await import('./leaderboard');
    await expect(submitScore(score)).rejects.toThrow('quota');
  });
});
