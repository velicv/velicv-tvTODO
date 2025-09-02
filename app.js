const { useState, useEffect } = React;

// Lucide React icons as simple SVG components
const Plus = ({ size = 24, className = "" }) => (
    React.createElement('svg', {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        className: className
    },
        React.createElement('line', { x1: "12", y1: "5", x2: "12", y2: "19" }),
        React.createElement('line', { x1: "5", y1: "12", x2: "19", y2: "12" })
    )
);

const Check = ({ size = 24, className = "" }) => (
    React.createElement('svg', {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        className: className
    },
        React.createElement('polyline', { points: "20,6 9,17 4,12" })
    )
);

const ChevronUp = ({ size = 24, className = "" }) => (
    React.createElement('svg', {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        className: className
    },
        React.createElement('polyline', { points: "18,15 12,9 6,15" })
    )
);

const ChevronDown = ({ size = 24, className = "" }) => (
    React.createElement('svg', {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        className: className
    },
        React.createElement('polyline', { points: "6,9 12,15 18,9" })
    )
);

const SmartTVTodoApp = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState('list');
  const [nextId, setNextId] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data from Google Sheets on component mount
  useEffect(() => {
    const loadFromGoogleSheets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const sheetId = '1_6iYoducZm7MksRutUIApIqLad2gNlE5MKZ_GXOKK_U';
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        
        let response;
        try {
          response = await fetch(csvUrl);
        } catch (corsError) {
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(csvUrl)}`;
          const proxyResponse = await fetch(proxyUrl);
          if (!proxyResponse.ok) {
            throw new Error('Failed to fetch via proxy. The Google Sheet may not be publicly accessible or there may be network issues.');
          }
          const proxyData = await proxyResponse.json();
          response = {
            ok: true,
            text: () => Promise.resolve(proxyData.contents)
          };
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch data from Google Sheets. Make sure the sheet is publicly accessible.');
        }
        
        const csvText = await response.text();
        const lines = csvText.trim().split('\n');
        
        if (lines.length <= 1) {
          throw new Error('No data found in the sheet or sheet is empty.');
        }
        
        const loadedTodos = [];
        let maxId = 0;
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line) {
            const columns = line.split(',').map(col => col.replace(/^"|"$/g, '').trim());
            if (columns[0]) {
              const id = i;
              const text = columns[0];
              const completed = columns[1] && (
                columns[1].toLowerCase() === 'true' || 
                columns[1].toLowerCase() === 'yes' || 
                columns[1].toLowerCase() === 'completed' ||
                columns[1] === '1'
              );
              
              loadedTodos.push({ id, text, completed });
              maxId = Math.max(maxId, id);
            }
          }
        }
        
        if (loadedTodos.length > 0) {
          setTodos(loadedTodos);
          setNextId(maxId + 1);
        } else {
          const defaultTodos = [
            { id: 1, text: 'Watch the morning news', completed: false },
            { id: 2, text: 'Check weather forecast', completed: true },
            { id: 3, text: 'Plan weekend activities', completed: false }
          ];
          setTodos(defaultTodos);
          setNextId(4);
        }
        
      } catch (err) {
        console.error('Error loading from Google Sheets:', err);
        setError(err.message);
        const defaultTodos = [
          { id: 1, text: 'Watch the morning news', completed: false },
          { id: 2, text: 'Check weather forecast', completed: true },
          { id: 3, text: 'Plan weekend activities', completed: false }
        ];
        setTodos(defaultTodos);
        setNextId(4);
      } finally {
        setLoading(false);
      }
    };

    loadFromGoogleSheets();
  }, []);

  // Handle keyboard navigation for TV remote
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (mode === 'list') {
            setSelectedIndex(prev => Math.max(0, prev - 1));
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (mode === 'list') {
            setSelectedIndex(prev => Math.min(todos.length, prev + 1));
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (mode === 'list') {
            setSelectedIndex(prev => Math.max(0, prev - 4));
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (mode === 'list') {
            setSelectedIndex(prev => Math.min(todos.length, prev + 4));
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (mode === 'list') {
            if (selectedIndex === todos.length) {
              setMode('add');
            } else if (selectedIndex < todos.length) {
              toggleTodo(todos[selectedIndex].id);
            }
          } else if (mode === 'add') {
            addTodo();
          }
          break;
        case 'Backspace':
        case 'Escape':
          e.preventDefault();
          if (mode === 'add') {
            setMode('list');
            setNewTodo('');
          } else if (mode === 'list' && selectedIndex < todos.length) {
            deleteTodo(todos[selectedIndex].id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, selectedIndex, todos, newTodo]);

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, { id: nextId, text: newTodo.trim(), completed: false }]);
      setNextId(nextId + 1);
      setNewTodo('');
      setMode('list');
      setSelectedIndex(todos.length);
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    const newTodos = todos.filter(todo => todo.id !== id);
    setTodos(newTodos);
    setSelectedIndex(Math.min(selectedIndex, newTodos.length - 1));
  };

  // Split todos into 4 columns
  const createColumns = () => {
    const itemsPerColumn = Math.ceil((todos.length + 1) / 4); // +1 for add button
    const columns = [[], [], [], []];
    
    // Distribute todos across columns
    todos.forEach((todo, index) => {
      const columnIndex = Math.floor(index / itemsPerColumn);
      columns[columnIndex].push({ ...todo, originalIndex: index });
    });
    
    // Add the "Add New Task" button to the last column with items
    let addButtonColumn = 0;
    for (let i = 3; i >= 0; i--) {
      if (columns[i].length > 0) {
        addButtonColumn = i;
        break;
      }
    }
    
    // If all columns are empty, add to first column
    if (todos.length === 0) {
      addButtonColumn = 0;
    }
    
    columns[addButtonColumn].push({ 
      id: 'add-button', 
      isAddButton: true, 
      originalIndex: todos.length 
    });
    
    return columns;
  };

  const completedCount = todos.filter(todo => todo.completed).length;

  return React.createElement('div', { 
    className: "min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8" 
  },
    React.createElement('div', { className: "text-center mb-8" },
      React.createElement('h1', { 
        className: "text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent" 
      }, "My Tasks"),
      React.createElement('div', { className: "text-2xl text-slate-300" },
        `${completedCount} of ${todos.length} completed`
      )
    ),
    React.createElement('div', { className: "max-w-7xl mx-auto" },
      loading ? React.createElement('div', { className: "text-center" },
        React.createElement('div', { className: "text-5xl mb-4" }, "📋"),
        React.createElement('div', { className: "text-4xl text-slate-300" }, "Loading your tasks...")
      ) : error ? React.createElement('div', { className: "text-center" },
        React.createElement('div', { className: "text-5xl mb-4" }, "⚠️"),
        React.createElement('div', { className: "text-3xl text-red-400 mb-4" }, error),
        React.createElement('div', { className: "text-2xl text-slate-400" }, "Using default tasks instead")
      ) : mode === 'list' ? React.createElement('div', { className: "grid grid-cols-4 gap-6" },
        ...createColumns().map((column, columnIndex) =>
          React.createElement('div', {
            key: columnIndex,
            className: "space-y-4"
          },
            ...column.map((item) => 
              item.isAddButton ? 
                React.createElement('div', {
                  key: 'add-button',
                  onClick: () => setMode('add'),
                  onMouseEnter: () => setSelectedIndex(item.originalIndex),
                  className: `flex items-center p-4 rounded-2xl text-2xl transition-all duration-300 cursor-pointer ${
                    selectedIndex === item.originalIndex 
                      ? 'bg-green-600 bg-opacity-50 border-4 border-green-400 transform scale-105' 
                      : 'bg-slate-700 bg-opacity-50 border-2 border-slate-500 hover:bg-slate-600'
                  }`
                },
                  React.createElement(Plus, { size: 24, className: "mr-4" }),
                  React.createElement('span', { className: "flex-1" }, "Add New Task"),
                  selectedIndex === item.originalIndex && React.createElement('div', {
                    className: "text-sm text-green-300 ml-2"
                  }, "CLICK"
                  )
                )
              :
                React.createElement('div', {
                  key: item.id,
                  onClick: () => toggleTodo(item.id),
                  onMouseEnter: () => setSelectedIndex(item.originalIndex),
                  className: `flex items-center p-4 rounded-2xl text-2xl transition-all duration-300 cursor-pointer ${
                    selectedIndex === item.originalIndex 
                      ? 'bg-blue-600 bg-opacity-50 border-4 border-blue-400 transform scale-105' 
                      : 'bg-slate-800 bg-opacity-50 border-2 border-slate-600 hover:bg-slate-700'
                  }`
                },
                  React.createElement('div', {
                    className: `w-6 h-6 rounded-full border-4 flex items-center justify-center mr-4 ${
                      item.completed ? 'bg-green-500 border-green-500' : 'border-slate-400'
                    }`
                  },
                    item.completed && React.createElement(Check, { size: 16, className: "text-white" })
                  ),
                  React.createElement('span', {
                    className: `flex-1 ${item.completed ? 'line-through text-slate-400' : ''}`
                  }, item.text),
                  selectedIndex === item.originalIndex && React.createElement('div', {
                    className: "text-xs text-blue-300 ml-2"
                  }, "CLICK")
                )
            )
          )
        )
      ) : React.createElement('div', {
        className: "bg-slate-800 bg-opacity-50 rounded-2xl p-8 border-4 border-blue-400 max-w-4xl mx-auto"
      },
        React.createElement('h2', {
          className: "text-5xl font-bold mb-8 text-center"
        }, "Add New Task"),
        React.createElement('input', {
          type: "text",
          value: newTodo,
          onChange: (e) => setNewTodo(e.target.value),
          placeholder: "What needs to be done?",
          className: "w-full p-6 text-4xl bg-slate-700 border-2 border-slate-500 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-400",
          autoFocus: true
        }),
        React.createElement('div', {
          className: "flex justify-center mt-8 space-x-8"
        },
          React.createElement('button', {
            onClick: addTodo,
            className: "px-8 py-4 bg-green-600 hover:bg-green-700 rounded-xl text-3xl font-semibold transition-colors"
          }, "Add Task"),
          React.createElement('button', {
            onClick: () => {
              setMode('list');
              setNewTodo('');
            },
            className: "px-8 py-4 bg-slate-600 hover:bg-slate-700 rounded-xl text-3xl font-semibold transition-colors"
          }, "Cancel")
        )
      )
    ),
    React.createElement('div', {
      className: "fixed bottom-8 left-8 right-8"
    },
      React.createElement('div', {
        className: "bg-black bg-opacity-60 rounded-xl p-4 text-center"
      },
        React.createElement('div', {
          className: "text-2xl text-slate-300"
        },
          mode === 'list' ? [
            React.createElement(ChevronUp, { className: "inline mr-2", size: 24, key: "up" }),
            React.createElement(ChevronDown, { className: "inline mr-2", size: 24, key: "down" }),
            "Navigate • ←→ Move between columns • CLICK or ENTER: Toggle/Add • BACKSPACE: Delete"
          ] : "Type your task • ENTER: Save • BACKSPACE: Cancel"
        )
      )
    ),
    React.createElement('div', {
      className: "fixed top-8 right-8"
    },
      React.createElement('div', {
        className: "bg-black bg-opacity-60 rounded-xl px-6 py-3"
      },
        React.createElement('div', {
          className: "text-2xl text-slate-300"
        }, "📺 Smart TV Mode")
      )
    )
  );
};

ReactDOM.render(React.createElement(SmartTVTodoApp), document.getElementById('root'));
