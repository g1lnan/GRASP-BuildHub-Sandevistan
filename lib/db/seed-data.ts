import type { FeedbackOutput } from '@/lib/ai/feedback-schemas'

export const seedIds = {
  institution: '10000000-0000-4000-8000-000000000001',
  lecturer: '20000000-0000-4000-8000-000000000001',
  studentA: '20000000-0000-4000-8000-000000000002',
  studentB: '20000000-0000-4000-8000-000000000003',
  researcher: '20000000-0000-4000-8000-000000000004',
  course: '30000000-0000-4000-8000-000000000001',
  enrollmentA: '40000000-0000-4000-8000-000000000001',
  enrollmentB: '40000000-0000-4000-8000-000000000002',
  publishedAssignment: '50000000-0000-4000-8000-000000000001',
  draftAssignment: '50000000-0000-4000-8000-000000000002',
} as const

export const demoPassword = 'GraspDemo2026!'

export const seedUsers = [
  {
    id: seedIds.lecturer,
    email: 'lecturer@grasp.demo',
    role: 'lecturer',
    displayName: 'Giảng viên Demo',
  },
  {
    id: seedIds.studentA,
    email: 'student.a@grasp.demo',
    role: 'student',
    displayName: 'Nguyễn Minh Anh',
  },
  {
    id: seedIds.studentB,
    email: 'student.b@grasp.demo',
    role: 'student',
    displayName: 'Trần Gia Bảo',
  },
  {
    id: seedIds.researcher,
    email: 'researcher@grasp.demo',
    role: 'researcher',
    displayName: 'Nhà nghiên cứu Demo',
  },
] as const

// ---------------------------------------------------------------------------
// Cohort demo data (Step 8) — a scored class so the 2×2 matrix has real dots.
// product_score is on a /10 scale, understanding (composite) on /5.
// Thresholds: product ≥ 6.5, understanding ≥ 3.5 (see lib/domain/quadrant).
// ---------------------------------------------------------------------------

export type CohortStudent = {
  readonly id: string
  readonly email: string
  readonly displayName: string
  /** false = already present in seedUsers (student A/B); true = insert as new user. */
  readonly isNew: boolean
  readonly productScore: number
  readonly understanding: number
}

export const cohortStudents: readonly CohortStudent[] = [
  // mastery (product ≥ 6.5, understanding ≥ 3.5)
  {
    id: seedIds.studentA,
    email: 'student.a@grasp.demo',
    displayName: 'Nguyễn Minh Anh',
    isNew: false,
    productScore: 9.0,
    understanding: 4.4,
  },
  {
    id: '20000000-0000-4000-8000-000000000007',
    email: 'student.e@grasp.demo',
    displayName: 'Vũ Khánh Đăng',
    isNew: true,
    productScore: 7.5,
    understanding: 3.8,
  },
  {
    id: '20000000-0000-4000-8000-000000000010',
    email: 'student.h@grasp.demo',
    displayName: 'Bùi Quang Huy',
    isNew: true,
    productScore: 8.0,
    understanding: 4.0,
  },
  {
    id: '20000000-0000-4000-8000-000000000014',
    email: 'student.l@grasp.demo',
    displayName: 'Lý Tuấn Kiệt',
    isNew: true,
    productScore: 9.2,
    understanding: 4.6,
  },
  // hollow (product ≥ 6.5, understanding < 3.5)
  {
    id: seedIds.studentB,
    email: 'student.b@grasp.demo',
    displayName: 'Trần Gia Bảo',
    isNew: false,
    productScore: 8.5,
    understanding: 2.6,
  },
  {
    id: '20000000-0000-4000-8000-000000000012',
    email: 'student.j@grasp.demo',
    displayName: 'Đặng Văn Khoa',
    isNew: true,
    productScore: 7.5,
    understanding: 3.0,
  },
  // expression gap (product < 6.5, understanding ≥ 3.5)
  {
    id: '20000000-0000-4000-8000-000000000005',
    email: 'student.c@grasp.demo',
    displayName: 'Lê Thị Cúc',
    isNew: true,
    productScore: 5.0,
    understanding: 4.2,
  },
  {
    id: '20000000-0000-4000-8000-000000000011',
    email: 'student.i@grasp.demo',
    displayName: 'Ngô Thảo My',
    isNew: true,
    productScore: 6.0,
    understanding: 3.9,
  },
  {
    id: '20000000-0000-4000-8000-000000000015',
    email: 'student.m@grasp.demo',
    displayName: 'Cao Ngọc Nhi',
    isNew: true,
    productScore: 5.5,
    understanding: 4.1,
  },
  // needs support (product < 6.5, understanding < 3.5)
  {
    id: '20000000-0000-4000-8000-000000000006',
    email: 'student.d@grasp.demo',
    displayName: 'Phạm Đức Duy',
    isNew: true,
    productScore: 4.5,
    understanding: 2.3,
  },
  {
    id: '20000000-0000-4000-8000-000000000008',
    email: 'student.f@grasp.demo',
    displayName: 'Hoàng Thu Hà',
    isNew: true,
    productScore: 6.0,
    understanding: 3.1,
  },
  {
    id: '20000000-0000-4000-8000-000000000013',
    email: 'student.k@grasp.demo',
    displayName: 'Trịnh Mai Lan',
    isNew: true,
    productScore: 5.5,
    understanding: 2.8,
  },
  {
    id: '20000000-0000-4000-8000-000000000016',
    email: 'student.n@grasp.demo',
    displayName: 'Phan Đình Phúc',
    isNew: true,
    productScore: 4.0,
    understanding: 2.1,
  },
] as const

/** One extra enrolled student with a submission but no scored session (matrix "pending"). */
export const pendingStudent = {
  id: '20000000-0000-4000-8000-000000000009',
  email: 'student.g@grasp.demo',
  displayName: 'Đỗ Gia Hân',
} as const

export const cohortEssayText =
  'Trong bài viết này, em trình bày luận điểm chính rằng chính sách công cần dựa trên bằng chứng thực nghiệm. ' +
  'Em đưa ra bằng chứng từ số liệu khảo sát và phân tích giới hạn của phương pháp. ' +
  'Cuối cùng, em thừa nhận rằng vẫn còn những điểm chưa chắc chắn trong lập luận của mình.'

// Concepts are mapped to Chương trình GDPT 2018 competency codes (illustrative):
//   GQVĐ = Giải quyết vấn đề & sáng tạo · NLNN = Năng lực ngôn ngữ · TDPB = Tư duy phản biện
export const cohortClaimNodes = [
  {
    id: 'n1',
    kind: 'thesis' as const,
    text: 'chính sách công cần dựa trên bằng chứng thực nghiệm',
    quoteSpan: { start: 44, end: 96 },
    concepts: ['GQVĐ 3.1 · Phân tích và đánh giá giải pháp', 'NLNN 4.2 · Lập luận bằng dẫn chứng'],
    confidence: 0.9,
  },
  {
    id: 'n2',
    kind: 'evidence' as const,
    text: 'bằng chứng từ số liệu khảo sát',
    quoteSpan: { start: 120, end: 150 },
    concepts: ['GQVĐ 2.3 · Sử dụng bằng chứng thực nghiệm'],
    confidence: 0.8,
  },
  {
    id: 'n3',
    kind: 'assumption' as const,
    text: 'vẫn còn những điểm chưa chắc chắn trong lập luận',
    quoteSpan: { start: 200, end: 248 },
    concepts: ['TDPB 1.3 · Nhận diện giả định và giới hạn'],
    confidence: 0.7,
  },
] as const

/** GDPT 2018 competency codes covered by this assignment's claim graph (for the console chip row). */
export const cohortCompetencies: readonly string[] = [
  'GQVĐ 3.1 · Phân tích và đánh giá giải pháp',
  'GQVĐ 2.3 · Sử dụng bằng chứng thực nghiệm',
  'NLNN 4.2 · Lập luận bằng dẫn chứng',
  'TDPB 1.3 · Nhận diện giả định và giới hạn',
]

export const cohortProbes = [
  {
    claimNodeId: 'n1',
    probeType: 'counterfactual' as const,
    bloomLevel: 'evaluate' as const,
    textVi: 'Nếu không có số liệu thực nghiệm, luận điểm của bạn có còn đứng vững không? Vì sao?',
    expectedSignals: ['giới hạn bằng chứng', 'điều kiện áp dụng'],
    aiFragilityScore: 0.72,
  },
  {
    claimNodeId: 'n2',
    probeType: 'novel_transfer' as const,
    bloomLevel: 'apply' as const,
    textVi: 'Hãy áp dụng lập luận này vào một tình huống chính sách khác mà bạn tự nghĩ ra.',
    expectedSignals: ['chuyển giao', 'ví dụ mới'],
    aiFragilityScore: 0.68,
  },
  {
    claimNodeId: 'n3',
    probeType: 'self_critique' as const,
    bloomLevel: 'reflect' as const,
    textVi: 'Điểm nào trong lập luận của bạn là yếu nhất, và bạn sẽ củng cố nó thế nào?',
    expectedSignals: ['tự nhận biết', 'hướng cải thiện'],
    aiFragilityScore: 0.75,
  },
] as const

export const cohortTurnTranscripts = [
  'Em nghĩ luận điểm chính vẫn cần bằng chứng thực nghiệm để thuyết phục, nếu thiếu số liệu thì lập luận sẽ yếu đi.',
  'Em áp dụng vào chính sách giao thông: cần khảo sát số liệu tai nạn trước khi thay đổi quy định.',
  'Điểm yếu nhất là em chưa so sánh nhiều nguồn bằng chứng; em sẽ bổ sung thêm dữ liệu đối chứng.',
] as const

/** Shared learning-feedback report so the student result screen renders without an AI call. */
export const cohortFeedback: FeedbackOutput = {
  strengths: [
    {
      concept: 'Lập luận bằng dẫn chứng',
      explanationVi:
        'Bạn gắn luận điểm chính với số liệu thực nghiệm một cách rõ ràng và thuyết phục khi trả lời.',
      citations: [{ turnOrdinal: 1, quote: 'bằng chứng thực nghiệm' }],
    },
    {
      concept: 'Chuyển giao sang tình huống mới',
      explanationVi:
        'Bạn vận dụng được lập luận sang một bối cảnh chính sách khác do chính bạn tự nghĩ ra.',
      citations: [{ turnOrdinal: 2, quote: 'chính sách giao thông' }],
    },
  ],
  gaps: [
    {
      concept: 'So sánh nhiều nguồn bằng chứng',
      explanationVi:
        'Bạn mới dựa vào một nguồn số liệu; nên đối chiếu thêm nguồn khác để củng cố kết luận của mình.',
      citations: [{ turnOrdinal: 3, quote: 'nhiều nguồn bằng chứng' }],
    },
  ],
  reviseConcepts: ['Đối chứng nguồn bằng chứng', 'Kiểm định giả định'],
  bodyVi:
    'Bạn hiểu và bảo vệ tốt luận điểm chính của mình, đặc biệt ở khả năng gắn lập luận với bằng chứng và vận dụng sang một tình huống mới. Điều nên cải thiện là đối chiếu nhiều nguồn bằng chứng để loại trừ các cách giải thích thay thế.',
} as const

export const seedAssignments = [
  {
    id: seedIds.publishedAssignment,
    title: 'Phân tích lập luận chính sách',
    prompt: 'Trình bày luận điểm, bằng chứng và giới hạn của một chính sách công.',
    dueAt: new Date('2026-09-30T16:59:59.000Z'),
    publishedAt: new Date('2026-07-01T00:00:00.000Z'),
    subjectConcepts: ['luận điểm', 'bằng chứng', 'phản biện'],
  },
  {
    id: seedIds.draftAssignment,
    title: 'Đánh giá nguồn bằng chứng',
    prompt: 'So sánh độ tin cậy của các nguồn bằng chứng trong một tình huống cụ thể.',
    dueAt: new Date('2026-10-31T16:59:59.000Z'),
    publishedAt: null,
    subjectConcepts: ['nguồn tin', 'độ tin cậy'],
  },
] as const
