import { Topic, TopicOrderMode } from '../topic.model';

type TopicComparator = (a: Topic, b: Topic) => number;

function comparatorFor(order: TopicOrderMode): TopicComparator {
  return order === 'custom'
    ? (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    : (a, b) => a.topicName.localeCompare(b.topicName);
}

function sortInPlace(topics: Topic[], compare: TopicComparator): void {
  topics.sort(compare);
  for (const topic of topics) {
    if (topic.subTopics?.length) {
      sortInPlace(topic.subTopics, compare);
    }
  }
}

/**
 * Orders a topic tree for display.
 *
 * The former `sortByOrder` pipe only ever saw one level at a time, because the
 * old list component re-applied it in every recursion step. The tree view reads
 * children straight off the node and sorts nothing itself, so the whole tree has
 * to be ordered up front.
 *
 * Only the root array is copied; the nested `subTopics` arrays are sorted in
 * place. Sorting is a display concern, and keeping the node objects identical to
 * the ones in the metadata store is what lets a drag & drop write the new
 * `displayOrder` back onto the very objects the tree is rendering.
 */
export function sortTopicTree(topics: readonly Topic[], order: TopicOrderMode): Topic[] {
  const roots = [...topics];
  sortInPlace(roots, comparatorFor(order));
  return roots;
}
