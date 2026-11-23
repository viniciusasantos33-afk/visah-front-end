import { Link } from 'react-router-dom';

export function NotFoundPage({ authenticated }: { authenticated: boolean }) {
  return (
    <section className="catalog-status" role="status">
      <div>
        <strong>Página não encontrada</strong>
        <p>Este endereço não corresponde a uma página do ViSah.</p>
        <Link to={authenticated ? '/' : '/entrar'}>Voltar ao início</Link>
      </div>
    </section>
  );
}
