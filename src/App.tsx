import { ConnectedApp } from "./components/ConnectedApp";
import { UnConnectedApp } from "./components/UnConnectedApp";
import { UnavailableApp } from "./components/UnavailableApp";
import { state } from "./store";

function App() {
  const luniiHandle = state.luniiHandle.use();

  if (!("showOpenFilePicker" in window)) return <UnavailableApp />;
  if (!luniiHandle) return <UnConnectedApp />;
  else return <ConnectedApp />;
}

export default App;
