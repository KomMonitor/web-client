import {
  TopicNode,
  buildTopicHierarchyForm,
  patchTopicHierarchyFromChain,
  topicHierarchyToApi,
  topicOptionsFor,
} from './topic-hierarchy-form.model';

const SUB_SUB_SUB: TopicNode = { topicId: 't-1-1-1-1', topicName: 'Ebene 4' };
const SUB_SUB: TopicNode = { topicId: 't-1-1-1', topicName: 'Ebene 3', subTopics: [SUB_SUB_SUB] };
const SUB: TopicNode = { topicId: 't-1-1', topicName: 'Ebene 2', subTopics: [SUB_SUB] };
const MAIN: TopicNode = { topicId: 't-1', topicName: 'Umwelt', subTopics: [SUB] };
const OTHER_MAIN: TopicNode = { topicId: 't-2', topicName: 'Soziales' };
const ROOTS: TopicNode[] = [MAIN, OTHER_MAIN];

describe('topic-hierarchy form model', () => {
  describe('buildTopicHierarchyForm', () => {
    it('requires a main topic by default', () => {
      const form = buildTopicHierarchyForm();

      expect(form.controls.mainTopic.hasError('topicRequired')).toBe(true);
      form.controls.mainTopic.setValue(MAIN);
      expect(form.valid).toBe(true);
    });

    it('can be built without the main-topic requirement', () => {
      const form = buildTopicHierarchyForm({ requireMainTopic: false });

      expect(form.valid).toBe(true);
    });

    it('clears every deeper level when a higher one changes', () => {
      const form = buildTopicHierarchyForm();
      patchTopicHierarchyFromChain(form, [MAIN, SUB, SUB_SUB, SUB_SUB_SUB]);

      form.controls.mainTopic.setValue(OTHER_MAIN);

      expect(form.getRawValue()).toEqual({
        mainTopic: OTHER_MAIN,
        subTopic: null,
        subsubTopic: null,
        subsubsubTopic: null,
      });
    });

    it('only clears levels below the one that changed', () => {
      const form = buildTopicHierarchyForm();
      patchTopicHierarchyFromChain(form, [MAIN, SUB, SUB_SUB, SUB_SUB_SUB]);

      form.controls.subsubTopic.setValue(SUB_SUB);

      expect(form.controls.mainTopic.value).toBe(MAIN);
      expect(form.controls.subTopic.value).toBe(SUB);
      expect(form.controls.subsubsubTopic.value).toBeNull();
    });
  });

  describe('patchTopicHierarchyFromChain', () => {
    it('applies a resolved chain without the cascade wiping it out', () => {
      const form = buildTopicHierarchyForm();

      patchTopicHierarchyFromChain(form, [MAIN, SUB, SUB_SUB]);

      expect(form.getRawValue()).toEqual({
        mainTopic: MAIN,
        subTopic: SUB,
        subsubTopic: SUB_SUB,
        subsubsubTopic: null,
      });
    });

    it('clears the selection for an empty chain', () => {
      const form = buildTopicHierarchyForm();
      patchTopicHierarchyFromChain(form, [MAIN, SUB]);

      patchTopicHierarchyFromChain(form, []);

      expect(topicHierarchyToApi(form)).toBe('');
      expect(form.controls.mainTopic.hasError('topicRequired')).toBe(true);
    });
  });

  describe('topicHierarchyToApi', () => {
    it('returns the deepest selected topic id', () => {
      const form = buildTopicHierarchyForm();

      patchTopicHierarchyFromChain(form, [MAIN]);
      expect(topicHierarchyToApi(form)).toBe('t-1');

      patchTopicHierarchyFromChain(form, [MAIN, SUB]);
      expect(topicHierarchyToApi(form)).toBe('t-1-1');

      patchTopicHierarchyFromChain(form, [MAIN, SUB, SUB_SUB, SUB_SUB_SUB]);
      expect(topicHierarchyToApi(form)).toBe('t-1-1-1-1');
    });

    it('returns an empty string when nothing is selected', () => {
      expect(topicHierarchyToApi(buildTopicHierarchyForm())).toBe('');
    });

    it('cannot report a stale deeper level after the main topic changed', () => {
      const form = buildTopicHierarchyForm();
      patchTopicHierarchyFromChain(form, [MAIN, SUB, SUB_SUB]);

      form.controls.mainTopic.setValue(OTHER_MAIN);

      expect(topicHierarchyToApi(form)).toBe('t-2');
    });
  });

  describe('topicOptionsFor', () => {
    it('offers the roots for the main level', () => {
      const form = buildTopicHierarchyForm();

      expect(topicOptionsFor(form, 'mainTopic', ROOTS)).toBe(ROOTS);
    });

    it('offers the children of the level above', () => {
      const form = buildTopicHierarchyForm();
      patchTopicHierarchyFromChain(form, [MAIN, SUB]);

      expect(topicOptionsFor(form, 'subTopic', ROOTS)).toEqual([SUB]);
      expect(topicOptionsFor(form, 'subsubTopic', ROOTS)).toEqual([SUB_SUB]);
    });

    it('offers nothing when the level above is unset or childless', () => {
      const form = buildTopicHierarchyForm();

      expect(topicOptionsFor(form, 'subTopic', ROOTS)).toEqual([]);

      form.controls.mainTopic.setValue(OTHER_MAIN);
      expect(topicOptionsFor(form, 'subTopic', ROOTS)).toEqual([]);
    });
  });
});
