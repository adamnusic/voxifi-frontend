import { Switch, Route } from "wouter";
import Visualizer from "@/pages/visualizer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Visualizer} />
    </Switch>
  );
}

function App() {
  return <Router />;
}

export default App;
