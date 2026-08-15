import type { CalibrationSession } from '@/lib/domain/calibration'

/**
 * Golden calibration set for gate G1 (DESIGN §11). 20 hand-scored sessions
 * spanning all four quadrants, each with the model's per-dimension understanding
 * score and two independent blind lecturer scorings. Run before every release:
 * it catches calibration regressions that aggregate correlation over the live
 * dataset can hide. Real pilot data (300+ sessions) plugs in via `--source db`.
 *
 * Values are on the rubric's 1..5 scale. The two lecturers are close to the
 * model but disagree with it (and mildly with each other) as real markers do —
 * so MAE and κ are non-trivial and the correlation is strong but not perfect.
 * Edit a row to see the gate move.
 */
export const goldenCalibration: readonly CalibrationSession[] = [
  // --- Mastery: strong understanding -------------------------------------
  {
    id: 'm1',
    quadrant: 'mastery',
    model: { d1: 4.6, d2: 4.5, d3: 4.4, d4: 4.3, d5: 4.5 },
    lecturers: [
      { d1: 4.4, d2: 4.3, d3: 4.5, d4: 4.0, d5: 4.2 },
      { d1: 4.7, d2: 4.6, d3: 4.2, d4: 4.3, d5: 4.5 },
    ],
  },
  {
    id: 'm2',
    quadrant: 'mastery',
    model: { d1: 4.8, d2: 4.7, d3: 4.6, d4: 4.5, d5: 4.4 },
    lecturers: [
      { d1: 4.5, d2: 4.4, d3: 4.6, d4: 4.2, d5: 4.3 },
      { d1: 4.7, d2: 4.6, d3: 4.4, d4: 4.4, d5: 4.2 },
    ],
  },
  {
    id: 'm3',
    quadrant: 'mastery',
    model: { d1: 4.3, d2: 4.4, d3: 4.2, d4: 4.1, d5: 4.3 },
    lecturers: [
      { d1: 4.0, d2: 4.2, d3: 4.3, d4: 3.8, d5: 4.0 },
      { d1: 4.3, d2: 4.4, d3: 4.0, d4: 4.1, d5: 4.3 },
    ],
  },
  {
    id: 'm4',
    quadrant: 'mastery',
    model: { d1: 4.5, d2: 4.6, d3: 4.7, d4: 4.4, d5: 4.5 },
    lecturers: [
      { d1: 4.6, d2: 4.4, d3: 4.5, d4: 4.5, d5: 4.3 },
      { d1: 4.3, d2: 4.6, d3: 4.7, d4: 4.2, d5: 4.6 },
    ],
  },
  {
    id: 'm5',
    quadrant: 'mastery',
    model: { d1: 4.9, d2: 4.8, d3: 4.7, d4: 4.6, d5: 4.7 },
    lecturers: [
      { d1: 4.6, d2: 4.5, d3: 4.7, d4: 4.3, d5: 4.4 },
      { d1: 4.8, d2: 4.7, d3: 4.5, d4: 4.5, d5: 4.6 },
    ],
  },
  // --- Expression gap: solid understanding, weaker written product --------
  {
    id: 'e1',
    quadrant: 'expression_gap',
    model: { d1: 4.0, d2: 3.9, d3: 4.1, d4: 3.8, d5: 4.0 },
    lecturers: [
      { d1: 3.7, d2: 3.8, d3: 4.0, d4: 3.5, d5: 3.7 },
      { d1: 4.0, d2: 3.7, d3: 4.2, d4: 3.6, d5: 4.0 },
    ],
  },
  {
    id: 'e2',
    quadrant: 'expression_gap',
    model: { d1: 3.8, d2: 4.0, d3: 3.9, d4: 4.1, d5: 3.7 },
    lecturers: [
      { d1: 3.9, d2: 3.8, d3: 3.7, d4: 4.0, d5: 3.6 },
      { d1: 3.6, d2: 4.0, d3: 3.9, d4: 4.1, d5: 3.4 },
    ],
  },
  {
    id: 'e3',
    quadrant: 'expression_gap',
    model: { d1: 4.2, d2: 4.1, d3: 3.9, d4: 4.0, d5: 4.1 },
    lecturers: [
      { d1: 3.9, d2: 3.9, d3: 4.0, d4: 3.7, d5: 3.8 },
      { d1: 4.2, d2: 4.1, d3: 3.7, d4: 4.0, d5: 4.1 },
    ],
  },
  {
    id: 'e4',
    quadrant: 'expression_gap',
    model: { d1: 3.7, d2: 3.8, d3: 4.0, d4: 3.9, d5: 3.8 },
    lecturers: [
      { d1: 3.5, d2: 3.6, d3: 3.9, d4: 3.7, d5: 3.5 },
      { d1: 3.7, d2: 3.9, d3: 4.1, d4: 3.8, d5: 3.8 },
    ],
  },
  {
    id: 'e5',
    quadrant: 'expression_gap',
    model: { d1: 4.1, d2: 4.0, d3: 4.2, d4: 3.9, d5: 4.0 },
    lecturers: [
      { d1: 3.8, d2: 4.1, d3: 4.0, d4: 3.7, d5: 3.8 },
      { d1: 4.1, d2: 3.9, d3: 4.3, d4: 3.9, d5: 4.1 },
    ],
  },
  // --- Hollow: understanding weaker than the written product --------------
  {
    id: 'h1',
    quadrant: 'hollow',
    model: { d1: 2.8, d2: 2.6, d3: 2.5, d4: 2.4, d5: 2.7 },
    lecturers: [
      { d1: 3.0, d2: 2.8, d3: 2.7, d4: 2.6, d5: 2.6 },
      { d1: 2.9, d2: 2.6, d3: 2.4, d4: 2.5, d5: 2.9 },
    ],
  },
  {
    id: 'h2',
    quadrant: 'hollow',
    model: { d1: 3.0, d2: 2.8, d3: 2.7, d4: 2.6, d5: 2.9 },
    lecturers: [
      { d1: 2.7, d2: 2.9, d3: 2.9, d4: 2.4, d5: 2.7 },
      { d1: 3.0, d2: 2.6, d3: 2.6, d4: 2.6, d5: 3.0 },
    ],
  },
  {
    id: 'h3',
    quadrant: 'hollow',
    model: { d1: 2.5, d2: 2.4, d3: 2.6, d4: 2.3, d5: 2.5 },
    lecturers: [
      { d1: 2.7, d2: 2.6, d3: 2.5, d4: 2.5, d5: 2.3 },
      { d1: 2.4, d2: 2.3, d3: 2.8, d4: 2.2, d5: 2.6 },
    ],
  },
  {
    id: 'h4',
    quadrant: 'hollow',
    model: { d1: 3.1, d2: 2.9, d3: 2.8, d4: 3.0, d5: 2.7 },
    lecturers: [
      { d1: 2.8, d2: 3.0, d3: 3.0, d4: 2.8, d5: 2.5 },
      { d1: 3.1, d2: 2.7, d3: 2.7, d4: 3.0, d5: 2.8 },
    ],
  },
  {
    id: 'h5',
    quadrant: 'hollow',
    model: { d1: 2.7, d2: 2.6, d3: 2.4, d4: 2.5, d5: 2.6 },
    lecturers: [
      { d1: 2.9, d2: 2.5, d3: 2.6, d4: 2.3, d5: 2.8 },
      { d1: 2.6, d2: 2.8, d3: 2.2, d4: 2.6, d5: 2.5 },
    ],
  },
  // --- Needs support: weak understanding ----------------------------------
  {
    id: 'n1',
    quadrant: 'needs_support',
    model: { d1: 2.2, d2: 2.0, d3: 1.9, d4: 2.1, d5: 2.0 },
    lecturers: [
      { d1: 2.4, d2: 2.2, d3: 2.1, d4: 2.0, d5: 1.8 },
      { d1: 2.1, d2: 1.9, d3: 1.8, d4: 2.2, d5: 2.1 },
    ],
  },
  {
    id: 'n2',
    quadrant: 'needs_support',
    model: { d1: 1.8, d2: 1.9, d3: 2.0, d4: 1.7, d5: 1.9 },
    lecturers: [
      { d1: 2.0, d2: 1.7, d3: 1.9, d4: 1.9, d5: 1.7 },
      { d1: 1.7, d2: 2.0, d3: 2.2, d4: 1.6, d5: 2.0 },
    ],
  },
  {
    id: 'n3',
    quadrant: 'needs_support',
    model: { d1: 2.4, d2: 2.3, d3: 2.2, d4: 2.1, d5: 2.3 },
    lecturers: [
      { d1: 2.2, d2: 2.5, d3: 2.4, d4: 1.9, d5: 2.1 },
      { d1: 2.5, d2: 2.2, d3: 2.0, d4: 2.2, d5: 2.4 },
    ],
  },
  {
    id: 'n4',
    quadrant: 'needs_support',
    model: { d1: 1.6, d2: 1.7, d3: 1.5, d4: 1.8, d5: 1.6 },
    lecturers: [
      { d1: 1.8, d2: 1.5, d3: 1.7, d4: 1.6, d5: 1.4 },
      { d1: 1.5, d2: 1.9, d3: 1.4, d4: 2.0, d5: 1.7 },
    ],
  },
  {
    id: 'n5',
    quadrant: 'needs_support',
    model: { d1: 2.1, d2: 2.2, d3: 2.0, d4: 1.9, d5: 2.1 },
    lecturers: [
      { d1: 1.9, d2: 2.0, d3: 2.2, d4: 2.1, d5: 1.9 },
      { d1: 2.2, d2: 2.4, d3: 1.8, d4: 1.7, d5: 2.3 },
    ],
  },
]
