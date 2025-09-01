export default function App() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28 }}>It works 🎉</h1>
      <p>Se você vê esse texto, React+TS está OK.</p>
      <button onClick={() => alert('OK!')} style={{ padding: 10 }}>
        Teste de clique
      </button>
    </div>
  );
}