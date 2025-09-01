import StudioClient from './StudioClient';

export default function Page() {
  const demo = process.env.DEMO_MODE === 'true';
  const demoUsername = demo ? 'demo' : '';
  return (
    <main className="p-6">
      <StudioClient demoUsername={demoUsername} />
    </main>
  );
}
