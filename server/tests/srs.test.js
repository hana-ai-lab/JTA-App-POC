import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getNextDueAt, buildSession } from '../src/lib/srs.js';

describe('getNextDueAt', () => {
  const now = new Date('2026-04-01T12:00:00Z');

  it('returns +1 day for streak 0->1', () => {
    const result = getNextDueAt(0, true, now);
    assert.deepStrictEqual(result, new Date('2026-04-02T12:00:00Z'));
  });

  it('returns +3 days for streak 1->2', () => {
    const result = getNextDueAt(1, true, now);
    assert.deepStrictEqual(result, new Date('2026-04-04T12:00:00Z'));
  });

  it('returns +7 days for streak 2->3', () => {
    const result = getNextDueAt(2, true, now);
    assert.deepStrictEqual(result, new Date('2026-04-08T12:00:00Z'));
  });

  it('returns null (graduated) for streak 3->4', () => {
    const result = getNextDueAt(3, true, now);
    assert.strictEqual(result, null);
  });

  it('returns +10 min for incorrect answer', () => {
    const result = getNextDueAt(2, false, now);
    assert.deepStrictEqual(result, new Date('2026-04-01T12:10:00Z'));
  });
});

describe('buildSession', () => {
  it('returns up to 5 quizzes', () => {
    const dueQuizzes = Array.from({ length: 8 }, (_, i) => ({ quiz_id: i + 1 }));
    const wrongQuizzes = [];
    const unseenQuizzes = Array.from({ length: 10 }, (_, i) => ({ quiz_id: 100 + i }));
    const session = buildSession(dueQuizzes, wrongQuizzes, unseenQuizzes);
    assert.strictEqual(session.length, 5);
  });

  it('includes 0 new quizzes when due >= 20', () => {
    const dueQuizzes = Array.from({ length: 25 }, (_, i) => ({ quiz_id: i + 1 }));
    const unseenQuizzes = Array.from({ length: 10 }, (_, i) => ({ quiz_id: 100 + i }));
    const session = buildSession(dueQuizzes, [], unseenQuizzes);
    const newIds = session.filter(q => q.quiz_id >= 100);
    assert.strictEqual(newIds.length, 0);
  });

  it('includes max 1 new quiz when due >= 10', () => {
    const dueQuizzes = Array.from({ length: 12 }, (_, i) => ({ quiz_id: i + 1 }));
    const unseenQuizzes = Array.from({ length: 10 }, (_, i) => ({ quiz_id: 100 + i }));
    const session = buildSession(dueQuizzes, [], unseenQuizzes);
    const newIds = session.filter(q => q.quiz_id >= 100);
    assert.ok(newIds.length <= 1);
  });

  it('includes max 2 new quizzes when due < 10', () => {
    const dueQuizzes = Array.from({ length: 3 }, (_, i) => ({ quiz_id: i + 1 }));
    const unseenQuizzes = Array.from({ length: 10 }, (_, i) => ({ quiz_id: 100 + i }));
    const session = buildSession(dueQuizzes, [], unseenQuizzes);
    const newIds = session.filter(q => q.quiz_id >= 100);
    assert.ok(newIds.length <= 2);
  });

  it('prioritizes wrong quizzes over unseen', () => {
    const dueQuizzes = [];
    const wrongQuizzes = [{ quiz_id: 50 }];
    const unseenQuizzes = Array.from({ length: 10 }, (_, i) => ({ quiz_id: 100 + i }));
    const session = buildSession(dueQuizzes, wrongQuizzes, unseenQuizzes);
    assert.ok(session.some(q => q.quiz_id === 50));
  });
});
