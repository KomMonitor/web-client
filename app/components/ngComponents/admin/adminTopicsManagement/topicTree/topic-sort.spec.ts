import { Topic } from '../topic.model';
import { sortTopicTree } from './topic-sort';

function topic(name: string, displayOrder: number, subTopics: Topic[] = []): Topic {
  return {
    topicId: name.toLowerCase(),
    topicName: name,
    topicDescription: '',
    topicType: 'main',
    displayOrder,
    subTopics,
  };
}

describe('sortTopicTree', () => {
  it('orders every level by displayOrder in custom mode', () => {
    const topics = [
      topic('Bevölkerung', 1, [topic('Altersstruktur', 1), topic('Zuzug', 0)]),
      topic('Bildung', 0),
    ];

    const sorted = sortTopicTree(topics, 'custom');

    expect(sorted.map((t) => t.topicName)).toEqual(['Bildung', 'Bevölkerung']);
    expect(sorted[1].subTopics!.map((t) => t.topicName)).toEqual(['Zuzug', 'Altersstruktur']);
  });

  it('orders every level by name in alphabetical mode', () => {
    const topics = [
      topic('Mobilität', 0, [topic('Radverkehr', 0), topic('Bus und Bahn', 1)]),
      topic('Bildung', 1),
    ];

    const sorted = sortTopicTree(topics, 'alphabetical');

    expect(sorted.map((t) => t.topicName)).toEqual(['Bildung', 'Mobilität']);
    expect(sorted[1].subTopics!.map((t) => t.topicName)).toEqual(['Bus und Bahn', 'Radverkehr']);
  });

  it('keeps the node objects and leaves the passed root array alone', () => {
    const first = topic('Bevölkerung', 1);
    const second = topic('Bildung', 0);
    const topics = [first, second];

    const sorted = sortTopicTree(topics, 'custom');

    expect(sorted).not.toBe(topics);
    expect(topics.map((t) => t.topicName)).toEqual(['Bevölkerung', 'Bildung']);
    expect(sorted[0]).toBe(second);
  });
});
