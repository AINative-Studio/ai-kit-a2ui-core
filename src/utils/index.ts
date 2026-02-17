/**
 * JSON Utilities
 *
 * Comprehensive JSON repair, diagnostic, and extraction utilities.
 */

export {
  // JSON Repair
  JSONRepair,
  createJSONRepair,
  repairJSON,
  type RepairOptions,
  type RepairResult,
  type RepairFix,
  type RepairFixType
} from './json-repair.js'

export {
  // JSON Diagnostics
  JSONDiagnostics,
  createJSONDiagnostics,
  diagnoseJSON,
  type DiagnosticResult,
  type JSONError,
  type JSONWarning,
  type JSONErrorType,
  type StructureInfo
} from './json-diagnostics.js'

export {
  // JSON Extractor
  JSONExtractor,
  createJSONExtractor,
  extractJSON
} from './json-extractor.js'

export {
  // Conflict Resolver
  ConflictResolver,
  conflictResolver,
  resolveConflict,
  type ConflictResolutionStrategy,
  type Change,
  type Operation,
  type CRDTState
} from './conflict-resolver.js'
