import { describe, it, expect } from 'vitest'
import { DISPLAY_CONDITIONS_OVERRIDE } from './FloatingStrategyPanel'

describe('FloatingStrategyPanel — DISPLAY_CONDITIONS_OVERRIDE', () => {
  describe('老闆型 (boss_cheap)', () => {
    it('should have correct conditions text', () => {
      expect(DISPLAY_CONDITIONS_OVERRIDE['boss_cheap']).toEqual([
        '適合風度: STRONG, TURBULENT, GUSTY, CALM（全天候）',
        '營收 YOY > 30%',
        '靠近月線或破月線（偏離 ≤ 3%）',
      ])
    })
  })

  describe('老闆型 (boss_pullback)', () => {
    it('should have correct conditions text', () => {
      expect(DISPLAY_CONDITIONS_OVERRIDE['boss_pullback']).toEqual([
        '適合風度: STRONG, TURBULENT, GUSTY, CALM（全天候）',
        '營收 YOY > 30%',
        '靠近月線或破月線（偏離 ≤ 3%）',
      ])
    })
  })

  describe('上班族強勢 (office_strong)', () => {
    it('should have correct conditions text', () => {
      expect(DISPLAY_CONDITIONS_OVERRIDE['office_strong']).toEqual([
        '適合風度: STRONG, GUSTY',
        '週 MACD 趨勢向上',
        '日 MACD 紅柱',
        '日 MACD 紅柱 ≤ 2 天（早期進場）',
        '循環為易漲（高勝率）',
      ])
    })
  })

  describe('上班族周趨勢 (office_trend)', () => {
    it('should have correct conditions text', () => {
      expect(DISPLAY_CONDITIONS_OVERRIDE['office_trend']).toEqual([
        '適合風度: STRONG, GUSTY',
        '週 MACD 趨勢向上',
        '價格靠近 5 日均線（1.5% 內）',
      ])
    })
  })
})
