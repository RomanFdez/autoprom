import { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Trash2, Check, Square, CheckSquare } from 'lucide-react';

export default function Todos() {
    const { todos, addTodo, toggleTodo, deleteTodo } = useData();
    const [newText, setNewText] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        if (!newText.trim()) return;
        addTodo(newText.trim());
        setNewText('');
    };

    // Sort todos: pending first, then completed. Inside each group, by date desc? Or creation order?
    // Let's sort by done status (false first), then by createdAt (newest first).
    const sortedTodos = [...todos].sort((a, b) => {
        if (a.done === b.done) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return a.done ? 1 : -1;
    });

    return (
        <div className="page-container">
            <h1 className="page-title">Lista de Tareas</h1>

            <form onSubmit={handleAdd} className="todo-input-group">
                <input
                    type="text"
                    className="form-input"
                    placeholder="Escribe una nueva tarea..."
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                />
                <button type="submit" className="add-btn" disabled={!newText.trim()}>
                    <Plus color="white" size={24} />
                </button>
            </form>

            <div className="todo-list">
                {sortedTodos.length === 0 ? (
                    <div className="empty-state">
                        <p>No tienes tareas pendientes.</p>
                    </div>
                ) : (
                    sortedTodos.map(todo => (
                        <div key={todo.id} className={`todo-item ${todo.done ? 'done' : ''}`}>
                            <div
                                className="todo-checkbox-area"
                                onClick={() => toggleTodo(todo.id)}
                            >
                                {todo.done ? (
                                    <CheckSquare size={24} color="#4caf50" />
                                ) : (
                                    <Square size={24} color="#999" />
                                )}
                            </div>
                            <div className="todo-text" onClick={() => toggleTodo(todo.id)}>
                                {todo.text}
                            </div>
                            <button
                                className="delete-btn"
                                onClick={() => deleteTodo(todo.id)}
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                .page-container {
                    padding: 20px;
                    max-width: 600px;
                    margin: 0 auto;
                }
                .page-title {
                    margin-bottom: 20px;
                    font-size: 1.5rem;
                    color: var(--md-sys-color-on-background);
                }
                .todo-input-group {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 24px;
                }
                .form-input {
                    flex: 1;
                    padding: 12px;
                    border: 1px solid var(--md-sys-color-outline);
                    border-radius: 12px;
                    font-size: 1rem;
                    outline: none;
                    background: var(--md-sys-color-surface);
                    color: var(--md-sys-color-on-surface);
                    transition: border-color 0.2s, background-color 0.3s ease;
                }
                .form-input:focus {
                    border-color: var(--md-sys-color-primary);
                }
                .add-btn {
                    background-color: var(--md-sys-color-primary);
                    border: none;
                    border-radius: 12px;
                    width: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: opacity 0.2s;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .add-btn:active {
                    opacity: 0.8;
                }
                .add-btn:disabled {
                    background-color: var(--md-sys-color-outline);
                    cursor: default;
                }
                .todo-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .todo-item {
                    background: var(--md-sys-color-surface);
                    padding: 16px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    box-shadow: var(--elevation-1);
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }
                .todo-item.done {
                    background: var(--md-sys-color-background);
                    opacity: 0.8;
                    box-shadow: none;
                    border: 1px dashed var(--md-sys-color-outline);
                }
                .todo-checkbox-area {
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                }
                .todo-text {
                    flex: 1;
                    font-size: 1rem;
                    color: var(--md-sys-color-on-surface);
                    cursor: pointer;
                    word-break: break-all;
                }
                .todo-item.done .todo-text {
                    text-decoration: line-through;
                    color: var(--md-sys-color-secondary);
                }
                .delete-btn {
                    background: none;
                    border: none;
                    color: var(--md-sys-color-secondary);
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 50%;
                    transition: color 0.2s, background 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .delete-btn:hover {
                    color: var(--color-expense);
                    background: var(--md-sys-color-background);
                }
                .empty-state {
                    text-align: center;
                    color: var(--md-sys-color-secondary);
                    margin-top: 40px;
                }
            `}</style>
        </div>
    );
}
