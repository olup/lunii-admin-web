import { ConnectedApp } from "./components/ConnectedApp";
import { UnconnectedApp } from "./components/UnConnectedApp";
import { UnavailableApp } from "./components/UnavailableApp";
import { Shell } from "./components/Shell";
import { state } from "./store";

function App() {
  const handle = state.luniiHandle.use();
  const supported =
    "showDirectoryPicker" in window &&
    "showOpenFilePicker" in window &&
    !!navigator.locks;
  return (
    <Shell>
      {!supported ? (
        <UnavailableApp />
      ) : handle ? (
        <ConnectedApp />
      ) : (
        <UnconnectedApp />
      )}
    </Shell>
  );
}
export default App;
