import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normalizeInput } from '../src/utils/normalizeInput.js'
import { validateInput } from '../src/utils/validateInput.js'
import { buildSummary } from '../src/utils/buildSummary.js'
import { validateAiResponse } from '../src/utils/validateAiResponse.js'
import { getFallbackResponse } from '../src/services/fallbackService.js'
import { analyseSavingsController } from '../src/controllers/aiController.js'
import { store, snapshot } from '../src/data/chainStore.js'
import { onGoalCreated, onContributionRecorded } from '../src/handlers/eventHandlers.js'

const sample = JSON.parse(readFileSync(new URL('../scratch/sample-input.json', import.meta.url), 'utf8'))
const today = new Date('2026-07-15')
const res = () => ({ code: 200, body: null, status(c) { this.code = c; return this }, json(b) { this.body = b; return this } })

test('valid sample input passes validation and produces facts', () => {
  const input = normalizeInput(sample)
  assert.deepEqual(validateInput(input, today), [])
  const facts = buildSummary(input, today)
  assert.equal(facts.targetAmount, 2000000)
  assert.equal(facts.currentBalance, 650000)
  assert.ok(Number.isFinite(facts.percentComplete))
})

test('missing or broken input is rejected with named problems', () => {
  assert.ok(validateInput(normalizeInput({}), today).length > 0)
  const bad = structuredClone(sample)
  bad.financial_summary.target_amount = -5
  assert.ok(validateInput(normalizeInput(bad), today).some((p) => /target_amount/.test(p)))
})

test('numeric strings with commas are normalised', () => {
  const s = structuredClone(sample)
  s.financial_summary.current_savings_balance = '650,000'
  assert.equal(normalizeInput(s).financial_summary.current_savings_balance, 650000)
})

test('the fallback response is complete and passes the AI response checker', () => {
  const facts = buildSummary(normalizeInput(sample), today)
  const fb = getFallbackResponse(facts)
  assert.ok(fb.summary && fb.observations.length && fb.recommendations.length)
})

test('the checker accepts the pre-written analysis but rejects an AI reply that invents a number', () => {
  const facts = buildSummary(normalizeInput(sample), today)
  const good = { analysis: getFallbackResponse(facts) }
  const ok = validateAiResponse(good, facts)
  assert.equal(ok.valid, true, JSON.stringify(ok.problems))
  const invented = structuredClone(good)
  invented.analysis.summary += ' They will have saved 987,654,321 by then.'
  const bad = validateAiResponse(invented, facts)
  assert.equal(bad.valid, false)
  assert.ok(bad.problems.some((p) => /987654321|not in the facts/i.test(p)), JSON.stringify(bad.problems))
})

test('controller: empty body is a 400', async () => {
  const r = res()
  await analyseSavingsController({ body: {} }, r)
  assert.equal(r.code, 400)
})

test('controller: mock mode serves the pre-written analysis labelled as mock', async () => {
  process.env.AI_MODE = 'mock'
  const r = res()
  await analyseSavingsController({ body: sample }, r)
  assert.equal(r.code, 200)
  assert.equal(r.body.meta.source, 'mock')
  assert.ok(r.body.analysis.summary)
})

test('controller: live mode that fails (1 ms timeout) falls back instead of erroring', async () => {
  process.env.AI_MODE = 'live'
  process.env.MISTRAL_API_KEY = 'invalid-test-key'
  process.env.MISTRAL_MODEL = 'ministral-8b-latest'
  process.env.MISTRAL_TIMEOUT_MS = '1'
  const r = res()
  await analyseSavingsController({ body: sample }, r)
  assert.equal(r.code, 200)
  assert.equal(r.body.meta.source, 'mock')
  assert.ok(r.body.analysis.summary)
})

test('on-chain store: a goal, contributions and a replacement goal behave like the contract', async () => {
  await onGoalCreated({ wallet: '0xA', targetAmount: 1000, targetDate: '2027-01-01', recordedAt: 't', explorerUrl: 'u', display: { targetAmount: '1,000', targetDate: 'x' } })
  await onContributionRecorded({ amount: 100, totalContributed: 100, date: 'd', recordedAt: 't', txHash: '0x1', explorerUrl: 'u', display: { amount: '100', totalContributed: '100' } })
  await onContributionRecorded({ amount: 200, totalContributed: 300, date: 'd', recordedAt: 't', txHash: '0x2', explorerUrl: 'u', display: { amount: '200', totalContributed: '300' } })
  assert.equal(snapshot().goal.totalContributed, 300)
  assert.equal(snapshot().goal.percentComplete, 30)
  assert.equal(snapshot().contributions.length, 2)
  await onGoalCreated({ wallet: '0xA', targetAmount: 2000, targetDate: '2027-02-01', recordedAt: 't', explorerUrl: 'u', display: { targetAmount: '2,000', targetDate: 'x' } })
  assert.equal(snapshot().goal.totalContributed, 0)
  assert.equal(store.contributions.length, 0)
})
