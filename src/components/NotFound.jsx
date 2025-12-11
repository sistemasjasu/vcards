import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Página no encontrada</h2>
        <p>La tarjeta de presentación que buscas no existe.</p>
        <a href="/dvazquez" className="home-link">
          Volver al inicio
        </a>
      </div>
    </div>
  );
};

export default NotFound;
