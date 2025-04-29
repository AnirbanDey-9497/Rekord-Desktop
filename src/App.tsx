import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ControlLayout } from "./layouts/ControlLayout";

const client = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={client}>
      <ControlLayout>
        Hello World
      </ControlLayout>
      <Toaster />
    </QueryClientProvider>
  );
};

export default App;
