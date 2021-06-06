import { GetServerSideProps } from "next";
import { parseCookies } from "nookies";
import { FormEvent, useContext, useState } from "react"
import { AuthContext } from "../context/AuthContext";
import { withSSRGuest } from "../utils/withSSRGuest";

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { signIn } = useContext(AuthContext);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    
    const data = {
      email,
      password,
    }

    signIn(data);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Entrar</button>
    </form>
  )
}

/* Recuperando token do Server Side
  Os cookies podem ser acessados tanto pelo lado do browser como pelo lado do 
  servidor next. A não ser que o cookie seja HTTP only (nesse caso ele será
  acessível somente pelo lado do server e não pelo lado do browser). 
*/

export const getServerSideProps = withSSRGuest(async (ctx) => {
  //Caso não exista o cookie 'nextauth.token' salvo nos cookies não retorna nada (usuário continua na página de login)
  return {
    props: {},
  }
});

