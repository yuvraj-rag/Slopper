import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { FoodItem } from '../cache';
import { rankByRelevance, scoreRelevance, singularPluralForms, tokenize } from './relevance';

function item(partial: Partial<FoodItem> & Pick<FoodItem, 'id' | 'name'>): FoodItem {
  return {
    nutrientsPer100g: {
      energyKcal: 100,
      protein: 1,
      fat: 1,
      carbs: 1,
      fiber: 1,
    },
    ...partial,
  };
}

describe('tokenize and plural forms', () => {
  it('tokenizes queries', () => {
    assert.deepEqual(tokenize('  Green  Apples! '), ['green', 'apples']);
  });

  it('links egg and eggs', () => {
    const forms = singularPluralForms('egg');
    assert.ok(forms.includes('eggs'));
    const fromEggs = singularPluralForms('eggs');
    assert.ok(fromEggs.includes('egg'));
  });
});

describe('rankByRelevance', () => {
  it('ranks whole apple above apple juice for query apple', () => {
    const foods = [
      item({ id: 'off:1', name: 'Apple juice', rawName: 'Apple juice' }),
      item({ id: 'usda:1', name: 'Apple, raw', rawName: 'Apple, raw, with skin' }),
    ];
    const ranked = rankByRelevance(foods, 'apple');
    assert.equal(ranked[0].id, 'usda:1');
  });

  it('ranks eggs as primary food above compound descriptions for query eggs', () => {
    const foods = [
      item({ id: 'usda:1', name: 'Bagels, eggs, bread', rawName: 'Bagels, eggs, bread' }),
      item({ id: 'usda:2', name: 'Egg, whole, raw', rawName: 'Egg, whole, raw, fresh' }),
    ];
    const ranked = rankByRelevance(foods, 'eggs');
    assert.equal(ranked[0].id, 'usda:2');
  });

  it('keeps relevant variants below direct matches', () => {
    const foods = [
      item({ id: '1', name: 'Apple, dried', rawName: 'Apple, dried, sulfured' }),
      item({ id: '2', name: 'Apple, raw', rawName: 'Apple, raw, with skin' }),
    ];
    const ranked = rankByRelevance(foods, 'apple');
    assert.equal(ranked[0].id, '2');
    assert.ok(scoreRelevance(ranked[0], 'apple') > scoreRelevance(ranked[1], 'apple'));
  });

  it('does not drop partial matches entirely', () => {
    const foods = [
      item({ id: '1', name: 'Chicken broth', rawName: 'Chicken broth' }),
      item({ id: '2', name: 'Chicken breast', rawName: 'Chicken breast, raw' }),
    ];
    const ranked = rankByRelevance(foods, 'chicken');
    assert.equal(ranked.length, 2);
    assert.equal(ranked[0].id, '2');
  });

  it('handles singular query against plural name', () => {
    const foods = [
      item({ id: '1', name: 'Bananas, raw', rawName: 'Bananas, raw' }),
      item({ id: '2', name: 'Banana chips', rawName: 'Banana chips' }),
    ];
    const ranked = rankByRelevance(foods, 'banana');
    assert.equal(ranked[0].id, '1');
  });
});
