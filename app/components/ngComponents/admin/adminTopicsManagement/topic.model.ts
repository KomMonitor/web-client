export interface Topic {
  topicDescription: string;
  topicId?: string;
  topicName: string;
  topicResource: string;
  topicType: string;
  displayOrder?: number;
  subTopics: Topic[];
}

export type TopicResourceType = 'indicator' | 'georesource';
export type TopicOrderMode = 'custom' | 'alphabetical';
