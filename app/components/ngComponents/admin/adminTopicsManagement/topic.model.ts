import { TopicOverviewType } from 'models/data-management-api';

/**
 * Topic as delivered by the Data Management API (TopicOverviewType), loosened
 * where the admin add/edit forms build topic objects before they are persisted:
 * topicId is unset until the backend assigns one, and subTopics is always
 * materialized as an array client-side.
 */
export interface Topic extends Omit<TopicOverviewType, 'topicId' | 'subTopics' | 'displayOrder'> {
  topicId?: string;
  displayOrder?: number;
  subTopics?: Topic[];
}

export type TopicResourceType = 'indicator' | 'georesource';
export type TopicOrderMode = 'custom' | 'alphabetical';
