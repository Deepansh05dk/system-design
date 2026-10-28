import { getCollection, type CollectionEntry } from 'astro:content';
import { modules } from '../data/modules';

export type Lesson = CollectionEntry<'lessons'>;

/** All lessons sorted in course order (module, then order). */
export async function getOrderedLessons(): Promise<Lesson[]> {
  const all = await getCollection('lessons');
  const moduleIndex = Object.fromEntries(modules.map((m, i) => [m.id, i]));
  return all.sort(
    (a, b) =>
      moduleIndex[a.data.module] - moduleIndex[b.data.module] || a.data.order - b.data.order,
  );
}

export async function getLessonsByModule() {
  const lessons = await getOrderedLessons();
  return modules.map((m) => ({
    module: m,
    lessons: lessons.filter((l) => l.data.module === m.id),
  }));
}
