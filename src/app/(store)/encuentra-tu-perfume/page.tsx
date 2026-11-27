import type { Metadata } from 'next';
import { PerfumeFinder } from '@/views/store/finder/PerfumeFinder';

export const metadata: Metadata = {
  title: 'Encuentra tu perfume',
  description: 'Contesta 6 preguntas y te recomendamos 3 perfumes de nuestro catálogo, con el porqué de cada uno.',
};

export default function FinderPage() {
  return <PerfumeFinder />;
}
