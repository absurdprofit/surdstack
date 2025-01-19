import './App.css';
import UserResource from '@<organisation-kebab>/api/resources/v1/user/UserResource';
import { use } from 'react';

const userClient = UserResource.createClient();
const userPromise = userClient.get('672308a65cab1b55442b2e39');

export function App() {
  const data = use(userPromise);

  return (
    <div>
      <h1>
        <span> Hello there, {data.displayName}</span>
        <br />
        Welcome rpc-test 👋
      </h1>
    </div>
  );
}

export default App;