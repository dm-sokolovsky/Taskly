import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Task = {
  id: string
  text: string
  completed: boolean
}

type TaskState = {
  tasks: Task[]
  warning: string
}

const storageKey = 'taskly.tasks.v1'

function readTasks(): TaskState {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved === null) return { tasks: [], warning: '' }

    const data: unknown = JSON.parse(saved)
    const ids = new Set<string>()
    if (!Array.isArray(data) || !data.every((item: unknown) => {
      if (typeof item !== 'object' || item === null) return false
      const task = item as Partial<Task>
      if (typeof task.id !== 'string' || !task.id || ids.has(task.id)
        || typeof task.text !== 'string' || !task.text.trim()
        || typeof task.completed !== 'boolean') return false
      ids.add(task.id)
      return true
    })) throw new Error('Invalid saved tasks')

    return {
      tasks: data.map(({ id, text, completed }: Task) => ({ id, text, completed })),
      warning: '',
    }
  } catch {
    return {
      tasks: [],
      warning: 'Не удалось прочитать сохранённые задачи. Можно начать новый список.',
    }
  }
}

function App() {
  const [state, setState] = useState(readTasks)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const checkboxRefs = useRef(new Map<string, HTMLInputElement>())
  const remaining = state.tasks.filter((task) => !task.completed).length
  const completed = state.tasks.length - remaining

  function updateTasks(tasks: Task[]) {
    let warning = ''
    try {
      localStorage.setItem(storageKey, JSON.stringify(tasks))
    } catch {
      warning = 'Изменения не сохранены. Хранилище браузера недоступно или заполнено. Не закрывайте страницу.'
    }
    setState({ tasks, warning })
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return

    const task: Task = { id: crypto.randomUUID(), text, completed: false }
    updateTasks([...state.tasks, task])
    setDraft('')
    inputRef.current?.focus()
  }

  function toggleTask(id: string) {
    updateTasks(state.tasks.map((task) => task.id === id
      ? { ...task, completed: !task.completed }
      : task))
  }

  function deleteTask(id: string) {
    const index = state.tasks.findIndex((task) => task.id === id)
    const nextTask = state.tasks[index + 1] ?? state.tasks[index - 1]
    updateTasks(state.tasks.filter((task) => task.id !== id))
    if (nextTask) checkboxRefs.current.get(nextTask.id)?.focus()
    else inputRef.current?.focus()
  }

  return (
    <div className="page">
      <header className="site-header">
        <a className="brand" href="./" aria-label="Taskly — главная">
          <span className="brand-mark" aria-hidden="true">✓</span>
          taskly<span className="brand-dot">.</span>
        </a>
      </header>

      <main className="workspace">
        <section className="task-card" aria-labelledby="tasks-heading">
          <div className="card-heading">
            <h1 id="tasks-heading">Мои задачи <span className="count-badge">{state.tasks.length}</span></h1>
          </div>

          <form className="add-form" onSubmit={addTask}>
            <label className="sr-only" htmlFor="new-task">Новая задача</label>
            <span className="input-plus" aria-hidden="true">+</span>
            <input id="new-task" ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Что нужно сделать?" autoComplete="off" />
            <button className="add-button" type="submit" disabled={!draft.trim()}>Добавить <span aria-hidden="true">↗</span></button>
          </form>

          {state.warning ? <p className="storage-warning" role="alert">{state.warning}</p> : null}

          {state.tasks.length === 0 ? (
            <div className="empty-state">
              <p>Задач пока нет. Добавьте первую выше.</p>
            </div>
          ) : (
            <ul className="task-list">
              {state.tasks.map((task) => (
                <li className={`task-row${task.completed ? ' is-completed' : ''}`} key={task.id}>
                  <label className="task-label">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      ref={(element) => {
                        if (element) checkboxRefs.current.set(task.id, element)
                        else checkboxRefs.current.delete(task.id)
                      }}
                    />
                    <span className="task-text">{task.text}</span>
                  </label>
                  <button className="delete-button" type="button" onClick={() => deleteTask(task.id)} aria-label={`Удалить задачу: ${task.text}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7m4-7v7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <footer className="card-footer">
            <span role="status">Осталось: <strong>{remaining}</strong></span>
            <span>Выполнено: {completed}</span>
          </footer>
        </section>
        <p className="local-note">Задачи хранятся только в этом браузере</p>
      </main>
    </div>
  )
}

export default App
