import { WikiEntityView } from '@/components/wiki/WikiEntityView';
export default async function Page({ params }: { params: Promise<{ id: string; collection: string }> }) { const { id } = await params; return <WikiEntityView id={id} />; }
