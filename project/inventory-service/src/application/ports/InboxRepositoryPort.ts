export interface InboxRepositoryPort {
  tryAccept(messageId: string): Promise<boolean>;
}

