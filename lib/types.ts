export type Note = {
  id: string
  title: string
  content: string
  createdAt: string
}

export type NoteLink = {
  id: string
  sourceNoteId: string
  targetNoteId: string
  reason: string
  confirmedAt: number
}

export type DismissedSuggestion = {
  sourceNoteId: string
  targetNoteId: string
}

export type Contradiction = {
  noteIds: string[]
  explanation: string
  quotes?: string[]
}

export type DismissedContradiction = {
  key: string  // stable: sorted noteIds joined + first 40 chars of explanation
}
