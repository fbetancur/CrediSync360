import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  function createTodo() {
    client.models.Todo.create({ content: window.prompt("Todo content") });
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-600 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My todos</h1>
        
        <button 
          onClick={createTodo}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors mb-4"
        >
          + new
        </button>
        
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li 
              key={todo.id}
              className="bg-gray-50 hover:bg-purple-50 p-4 rounded-lg transition-colors border border-gray-200"
            >
              {todo.content}
            </li>
          ))}
        </ul>
        
        <div className="mt-6 text-sm text-gray-600">
          🥳 App successfully hosted with Tailwind CSS v4!
          <br />
          <a 
            href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates"
            className="text-purple-600 hover:text-purple-800 font-semibold underline"
          >
            Review next step of this tutorial.
          </a>
        </div>
      </div>
    </main>
  );
}

export default App;
