/**
 * Timer Accuracy Validation Script
 *
 * This script validates that the PerformanceTracker's timer measurements
 * are accurate within 10ms tolerance in real-world scenarios.
 */

import { PerformanceTracker } from '../../src/shared/utils/PerformanceTracker'

interface ValidationResult {
  test: string
  expected: number
  actual: number
  difference: number
  withinTolerance: boolean
  status: 'PASS' | 'FAIL'
}

const TOLERANCE_MS = 10
const results: ValidationResult[] = []

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function validateTimerAccuracy() {
  console.log('🧪 PerformanceTracker Timer Accuracy Validation\n')
  console.log('━'.repeat(80))
  console.log(`Tolerance: ±${TOLERANCE_MS}ms\n`)

  // Test 1: Short duration (50ms)
  const tracker1 = new PerformanceTracker()
  tracker1.startMessageTiming('test1')
  await sleep(50)
  tracker1.endMessageTiming('test1')

  const metrics1 = tracker1.getMessageLatencyMetrics()
  const actual1 = metrics1[0]?.value ?? 0
  results.push({
    test: 'Short duration timing (50ms)',
    expected: 50,
    actual: actual1,
    difference: Math.abs(actual1 - 50),
    withinTolerance: Math.abs(actual1 - 50) <= TOLERANCE_MS,
    status: Math.abs(actual1 - 50) <= TOLERANCE_MS ? 'PASS' : 'FAIL'
  })

  // Test 2: Medium duration (200ms)
  const tracker2 = new PerformanceTracker()
  tracker2.startMessageTiming('test2')
  await sleep(200)
  tracker2.endMessageTiming('test2')

  const metrics2 = tracker2.getMessageLatencyMetrics()
  const actual2 = metrics2[0]?.value ?? 0
  results.push({
    test: 'Medium duration timing (200ms)',
    expected: 200,
    actual: actual2,
    difference: Math.abs(actual2 - 200),
    withinTolerance: Math.abs(actual2 - 200) <= TOLERANCE_MS,
    status: Math.abs(actual2 - 200) <= TOLERANCE_MS ? 'PASS' : 'FAIL'
  })

  // Test 3: Multiple concurrent timings
  const tracker3 = new PerformanceTracker()
  tracker3.startMessageTiming('msg1')
  await sleep(50)
  tracker3.startMessageTiming('msg2')
  await sleep(50)
  tracker3.endMessageTiming('msg1') // Should be ~100ms
  await sleep(50)
  tracker3.endMessageTiming('msg2') // Should be ~100ms

  const metrics3 = tracker3.getMessageLatencyMetrics()
  const actual3a = metrics3[0]?.value ?? 0
  const actual3b = metrics3[1]?.value ?? 0
  results.push({
    test: 'Concurrent timing #1 (100ms)',
    expected: 100,
    actual: actual3a,
    difference: Math.abs(actual3a - 100),
    withinTolerance: Math.abs(actual3a - 100) <= TOLERANCE_MS,
    status: Math.abs(actual3a - 100) <= TOLERANCE_MS ? 'PASS' : 'FAIL'
  })
  results.push({
    test: 'Concurrent timing #2 (100ms)',
    expected: 100,
    actual: actual3b,
    difference: Math.abs(actual3b - 100),
    withinTolerance: Math.abs(actual3b - 100) <= TOLERANCE_MS,
    status: Math.abs(actual3b - 100) <= TOLERANCE_MS ? 'PASS' : 'FAIL'
  })

  // Test 4: Statistics calculation accuracy
  const tracker4 = new PerformanceTracker()
  tracker4.trackMessageLatency(100)
  tracker4.trackMessageLatency(200)
  tracker4.trackMessageLatency(300)

  const stats = tracker4.getStatistics()
  results.push({
    test: 'Statistics average calculation',
    expected: 200,
    actual: stats.messageLatency.avg,
    difference: Math.abs(stats.messageLatency.avg - 200),
    withinTolerance: Math.abs(stats.messageLatency.avg - 200) <= 0.01, // Should be exact
    status: Math.abs(stats.messageLatency.avg - 200) <= 0.01 ? 'PASS' : 'FAIL'
  })

  // Test 5: Connection duration tracking
  const tracker5 = new PerformanceTracker()
  tracker5.trackConnectionEvent('connected')
  await sleep(150)
  tracker5.trackConnectionEvent('disconnected')

  const history = tracker5.getConnectionHistory()
  const duration = history[1]?.duration ?? 0
  results.push({
    test: 'Connection duration tracking (150ms)',
    expected: 150,
    actual: duration,
    difference: Math.abs(duration - 150),
    withinTolerance: Math.abs(duration - 150) <= TOLERANCE_MS,
    status: Math.abs(duration - 150) <= TOLERANCE_MS ? 'PASS' : 'FAIL'
  })

  // Print results
  console.log('\n📊 Validation Results:\n')
  results.forEach((result, index) => {
    const statusIcon = result.status === 'PASS' ? '✅' : '❌'
    console.log(`${statusIcon} Test ${index + 1}: ${result.test}`)
    console.log(`   Expected: ${result.expected.toFixed(2)}ms`)
    console.log(`   Actual:   ${result.actual.toFixed(2)}ms`)
    console.log(`   Diff:     ${result.difference.toFixed(2)}ms`)
    console.log(`   Status:   ${result.status}\n`)
  })

  console.log('━'.repeat(80))

  const passCount = results.filter(r => r.status === 'PASS').length
  const totalCount = results.length
  const allPassed = passCount === totalCount

  console.log(`\n🎯 Overall Result: ${passCount}/${totalCount} tests passed`)

  if (allPassed) {
    console.log('✅ ALL TIMER ACCURACY TESTS PASSED')
    console.log('   Timer measurements are accurate within ±10ms tolerance')
  } else {
    console.log('❌ SOME TESTS FAILED')
    console.log('   Timer accuracy outside acceptable tolerance')
  }

  return allPassed
}

// Run validation if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateTimerAccuracy()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('Validation failed with error:', error)
      process.exit(1)
    })
}

export { validateTimerAccuracy }
