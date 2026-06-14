import assert from 'node:assert/strict';
import { test } from 'node:test';
import { percentInputToChanceRatio, chanceRatioToPercentInput } from './rewardSettings.ts';

test('chanceRatioToPercentInput shows stored chance ratios as whole percentages', () => {
    assert.equal(chanceRatioToPercentInput(0.99), 99);
    assert.equal(chanceRatioToPercentInput(0.2), 20);
});

test('percentInputToChanceRatio stores 1 to 100 inputs as chance ratios', () => {
    assert.equal(percentInputToChanceRatio(1), 0.01);
    assert.equal(percentInputToChanceRatio(99), 0.99);
    assert.equal(percentInputToChanceRatio(100), 1);
});

test('reward chance percent input is clamped to the supported range', () => {
    assert.equal(percentInputToChanceRatio(0), 0.01);
    assert.equal(percentInputToChanceRatio(250), 1);
});
