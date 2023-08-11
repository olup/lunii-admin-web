import { ConnectedApp } from "./components/ConnectedApp";
import { UnconnectedApp } from "./components/UnConnectedApp";
import { UnavailableApp } from "./components/UnavailableApp";
import { state } from "./store";

function App() {
  const luniiHandle = state.luniiHandle.use();

  if (!("showOpenFilePicker" in window)) return <UnavailableApp />;
  if (!luniiHandle) return <UnconnectedApp />;
  else return <ConnectedApp />;
}

export default App;
