import { describe, it, expect } from 'vitest'
import { flourishLevel } from './flourish'
import type { CausalStage } from './types'

const stage = (kind: CausalStage['kind']): CausalStage => ({
  kind,
  label: kind,
})

describe('flourishLevel', () => {
  it('stays silent for an ordinary placement', () => {
    expect(flourishLevel([stage('group'), stage('total')])).toBe('none')
    expect(flourishLevel([stage('group'), stage('decree'), stage('total')])).toBe(
      'none'
    )
    expect(flourishLevel([])).toBe('none')
  })

  it('escalates for a newly discovered interaction', () => {
    expect(
      flourishLevel([stage('group'), stage('milestone'), stage('total')])
    ).toBe('milestone')
  })

  it('reserves the loudest response for a completed table', () => {
    expect(
      flourishLevel([
        stage('group'),
        stage('milestone'),
        stage('completion'),
        stage('total'),
      ])
    ).toBe('completion')
  })
})
