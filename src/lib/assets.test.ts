import assert from 'node:assert/strict';
import test from 'node:test';
import { assetUrl } from './assets';

test('root-hosted assets retain their root paths and the Node fallback is safe', () => {
  assert.equal(assetUrl('/demos/bacon.png', '/'), '/demos/bacon.png');
  assert.equal(assetUrl('/images/gym.png'), '/images/gym.png');
});

test('project-hosted assets use the mount path and retain queries and fragments', () => {
  assert.equal(assetUrl('/demos/bacon.png', '/Gym-routine/'), '/Gym-routine/demos/bacon.png');
  assert.equal(assetUrl('/images/gym.png?size=small#preview', '/Gym-routine/'), '/Gym-routine/images/gym.png?size=small#preview');
  assert.equal(assetUrl('/demos/bacon.png', '/Gym-routine'), '/Gym-routine/demos/bacon.png');
});

test('already-prefixed paths are not prefixed twice, including the mount itself', () => {
  assert.equal(assetUrl('/Gym-routine/demos/bacon.png', '/Gym-routine/'), '/Gym-routine/demos/bacon.png');
  assert.equal(assetUrl('/Gym-routine?preview=1', '/Gym-routine/'), '/Gym-routine?preview=1');
  assert.equal(assetUrl('/Gym-routine#main', '/Gym-routine/'), '/Gym-routine#main');
  assert.equal(assetUrl('/Gym-routine', '/Gym-routine/'), '/Gym-routine');
  assert.equal(assetUrl('/Gym-routine-extra/demo.png', '/Gym-routine/'), '/Gym-routine/Gym-routine-extra/demo.png');
});

test('external URLs and browser-relative sources stay untouched', () => {
  for (const source of [
    'https://example.com/demo.png',
    'http://example.com/demo.webm',
    '//example.com/demo.png',
    'data:image/png;base64,AAAA',
    'blob:https://example.com/id',
    'demos/bacon.png',
    './demos/bacon.png',
    '../demo.png',
    '#preview',
    '?preview=1',
    '',
  ]) assert.equal(assetUrl(source, '/Gym-routine/'), source);
});
