import { requireRole } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { type SubmissionSource, extractSubmission } from '@/lib/ingest/extract'
import {
  drizzleSubmissionAssignmentRepository,
  drizzleSubmissionEnrollmentRepository,
  drizzleSubmissionRepository,
} from '@/lib/repositories/drizzle-submissions'
import {
  AssignmentNotPublishedError,
  AuthenticationRoleError,
  EmptySubmissionError,
  NotEnrolledError,
  ResourceForbiddenError,
  ResourceNotFoundError,
  WordLimitExceededError,
} from '@/lib/services/errors'
import { createSubmission } from '@/lib/services/submission-service'
import { submissionTextInputSchema } from '@/lib/validation/inputs'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function sourceFromFile(file: File): SubmissionSource | null {
  const name = file.name.toLowerCase()
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    return 'docx'
  }
  return null
}

async function parseRequest(request: NextRequest): Promise<{
  readonly assignmentId: string
  readonly extractInput: { source: SubmissionSource; text?: string; buffer?: Buffer }
} | null> {
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData()
    const assignmentId = form.get('assignmentId')
    const file = form.get('file')
    const pastedText = form.get('text')
    if (typeof assignmentId !== 'string') return null

    if (file instanceof File && file.size > 0) {
      const source = sourceFromFile(file)
      if (source === null) return null
      const buffer = Buffer.from(await file.arrayBuffer())
      return { assignmentId, extractInput: { source, buffer } }
    }
    if (typeof pastedText === 'string') {
      return { assignmentId, extractInput: { source: 'text', text: pastedText } }
    }
    return null
  }

  const body = submissionTextInputSchema.parse(await request.json())
  return { assignmentId: body.assignmentId, extractInput: { source: 'text', text: body.text } }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireRole(['student'])
    const parsed = await parseRequest(request)
    if (parsed === null) {
      return NextResponse.json({ error: vi.errors.invalidInput }, { status: 400 })
    }

    const extracted = await extractSubmission(parsed.extractInput)
    const submission = await createSubmission({
      submissions: drizzleSubmissionRepository,
      assignments: drizzleSubmissionAssignmentRepository,
      enrollments: drizzleSubmissionEnrollmentRepository,
      actor,
      assignmentId: parsed.assignmentId,
      extracted,
      now: new Date(),
    })
    return NextResponse.json({ id: submission.id, status: submission.status }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof ResourceNotFoundError)
      return NextResponse.json({ error: vi.errors.notFound }, { status: 404 })
    if (error instanceof ResourceForbiddenError)
      return NextResponse.json({ error: vi.errors.forbidden }, { status: 403 })
    if (error instanceof AuthenticationRoleError)
      return NextResponse.json({ error: vi.errors.roleRequired }, { status: 403 })
    if (error instanceof AssignmentNotPublishedError)
      return NextResponse.json({ error: vi.errors.notPublished }, { status: 409 })
    if (error instanceof NotEnrolledError)
      return NextResponse.json({ error: vi.errors.notEnrolled }, { status: 403 })
    if (error instanceof WordLimitExceededError)
      return NextResponse.json({ error: vi.errors.wordLimit }, { status: 422 })
    if (error instanceof EmptySubmissionError)
      return NextResponse.json({ error: vi.errors.emptySubmission }, { status: 422 })
    return NextResponse.json({ error: vi.errors.invalidInput }, { status: 400 })
  }
}
