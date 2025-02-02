import './App.css';
import UserResource from '@<organisation-kebab>/api/resources/v1/user/UserResource';
import TokenResource from '@<organisation-kebab>/api/resources/v1/auth/token/TokenResource';
import { use, useState } from 'react';
import { GrantType } from '@<organisation-kebab>/schema';

const userClient = UserResource.createClient();
const userPromise = userClient.get('672308a65cab1b55442b2e39');
const tokenClient = TokenResource.createClient();

async function getToken() {
  const token = await tokenClient.post({
    grant_type: GrantType.ClientCredentials,
    client_id: '67186368cd24a0368736a43e',
    client_secret: 'secret',
  });
  return token;
}

export function App() {
  const data = use(userPromise);
  const [token, setToken] = useState({});

  return (
    <div>
      <h1>
        <span> Hello there, {data.displayName}</span>
        <br />
        Welcome rpc-test 👋
      </h1>

      <button onClick={() => getToken().then(setToken)}>Get Token</button>
      <pre dangerouslySetInnerHTML={{ __html: JSON.stringify(token, null, 2) }}></pre>
    </div>
  );
}

export default App;