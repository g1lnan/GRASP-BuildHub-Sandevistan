export class AuthenticationRoleError extends Error {
  readonly name = 'AuthenticationRoleError'
}

export class ResourceNotFoundError extends Error {
  readonly name = 'ResourceNotFoundError'
}

export class ResourceForbiddenError extends Error {
  readonly name = 'ResourceForbiddenError'
}

export class CourseArchivedError extends Error {
  readonly name = 'CourseArchivedError'
}

export class JoinCodeRevokedError extends Error {
  readonly name = 'JoinCodeRevokedError'
}

export class AlreadyEnrolledError extends Error {
  readonly name = 'AlreadyEnrolledError'
}

export class AssignmentNotPublishedError extends Error {
  readonly name = 'AssignmentNotPublishedError'
}

export class NotEnrolledError extends Error {
  readonly name = 'NotEnrolledError'
}

export class WordLimitExceededError extends Error {
  readonly name = 'WordLimitExceededError'
}

export class EmptySubmissionError extends Error {
  readonly name = 'EmptySubmissionError'
}

export class SubmissionNotReadyError extends Error {
  readonly name = 'SubmissionNotReadyError'
}

export class SessionNoProbesError extends Error {
  readonly name = 'SessionNoProbesError'
}

export class SessionNotFinalizableError extends Error {
  readonly name = 'SessionNotFinalizableError'
}

export class SessionHasNoTurnsError extends Error {
  readonly name = 'SessionHasNoTurnsError'
}

export class InvalidScoreEvidenceError extends Error {
  readonly name = 'InvalidScoreEvidenceError'
}

export class ScoringUnavailableError extends Error {
  readonly name = 'ScoringUnavailableError'
}

export class InvalidFeedbackEvidenceError extends Error {
  readonly name = 'InvalidFeedbackEvidenceError'
}

export class FeedbackUnavailableError extends Error {
  readonly name = 'FeedbackUnavailableError'
}

export class UnexpectedProbeError extends Error {
  readonly name = 'UnexpectedProbeError'
}

export class EmptyTurnTranscriptError extends Error {
  readonly name = 'EmptyTurnTranscriptError'
}

export class TurnConflictError extends Error {
  readonly name = 'TurnConflictError'
}

export class InvalidProbeClaimError extends Error {
  readonly name = 'InvalidProbeClaimError'
}

export class AsrConfigurationError extends Error {
  readonly name = 'AsrConfigurationError'
}

export class AsrTimeoutError extends Error {
  readonly name = 'AsrTimeoutError'
}

export class AsrTranscriptionError extends Error {
  readonly name = 'AsrTranscriptionError'
}

export class AsrNoSpeechError extends Error {
  readonly name = 'AsrNoSpeechError'
}

export class UnsupportedAudioError extends Error {
  readonly name = 'UnsupportedAudioError'
}

export class InvalidOverrideError extends Error {
  readonly name = 'InvalidOverrideError'
}

export class AppealNotAllowedError extends Error {
  readonly name = 'AppealNotAllowedError'
}

export class InvalidAppealError extends Error {
  readonly name = 'InvalidAppealError'
}
