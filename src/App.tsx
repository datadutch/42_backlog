import React, { useEffect, useRef } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { create } from 'zustand'

// Backend API URL
const API_URL = 'https://bcklg42.uber.space/api/state'

interface Task {
  id: string
  title: string
  description: string
}

interface Column {
  id: string
  title: string
  taskIds: string[]
}

interface AppState {
  tasks: Record<string, Task>
  columns: Record<string, Column>
  columnOrder: string[]
  newTaskTitle: string
  newTaskDescription: string
  setData: (data: Partial<AppState>) => void
  addTask: () => void
  onDragEnd: (result: any) => void
}

const defaultColumns = {
  'column-1': { id: 'column-1', title: 'Backlog', taskIds: [] },
  'column-2': { id: 'column-2', title: 'In Progress', taskIds: [] },
  'column-3': { id: 'column-3', title: 'Finished', taskIds: [] },
}
const defaultColumnOrder = ['column-1', 'column-2', 'column-3']

const useStore = create<AppState>((set) => ({
  tasks: {},
  columns: defaultColumns,
  columnOrder: defaultColumnOrder,
  newTaskTitle: '',
  newTaskDescription: '',
  setData: (data) => set((state) => ({ ...state, ...data })),
  fetchState: async () => {
    try {
      const response = await fetch(API_URL)
      const data = await response.json()
      set((state) => ({
        ...state,
        tasks: data.tasks ?? state.tasks,
        columns: data.columns && Object.keys(data.columns).length > 0 ? data.columns : state.columns,
        columnOrder: data.columnOrder && data.columnOrder.length > 0 ? data.columnOrder : state.columnOrder,
      }))
    } catch (error) {
      console.error('Failed to fetch state:', error)
    }
  },
  saveState: async (state) => {
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(state),
      })
    } catch (error) {
      console.error('Failed to save state:', error)
    }
  },
  addTask: () => set((state) => {
    if (!state.newTaskTitle.trim()) return state

    const taskId = `task-${Object.keys(state.tasks).length + 1}`
    const newTask = {
      id: taskId,
      title: state.newTaskTitle,
      description: state.newTaskDescription,
    }

    return {
      ...state,
      tasks: {
        ...state.tasks,
        [taskId]: newTask,
      },
      columns: {
        ...state.columns,
        'column-1': {
          ...state.columns['column-1'],
          taskIds: [...state.columns['column-1'].taskIds, taskId],
        },
      },
      newTaskTitle: '',
      newTaskDescription: '',
    }
  }),
  onDragEnd: (result) => set((state) => {
    const { destination, source, draggableId } = result

    if (!destination) return state

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return state
    }

    const startColumn = state.columns[source.droppableId]
    const finishColumn = state.columns[destination.droppableId]

    if (startColumn === finishColumn) {
      const newTaskIds = Array.from(startColumn.taskIds)
      newTaskIds.splice(source.index, 1)
      newTaskIds.splice(destination.index, 0, draggableId)

      const newColumn = {
        ...startColumn,
        taskIds: newTaskIds,
      }

      return {
        ...state,
        columns: {
          ...state.columns,
          [newColumn.id]: newColumn,
        },
      }
    }

    const startTaskIds = Array.from(startColumn.taskIds)
    startTaskIds.splice(source.index, 1)
    const newStartColumn = {
      ...startColumn,
      taskIds: startTaskIds,
    }

    const finishTaskIds = Array.from(finishColumn.taskIds)
    finishTaskIds.splice(destination.index, 0, draggableId)
    const newFinishColumn = {
      ...finishColumn,
      taskIds: finishTaskIds,
    }

    return {
      ...state,
      columns: {
        ...state.columns,
        [newStartColumn.id]: newStartColumn,
        [newFinishColumn.id]: newFinishColumn,
      },
    }
  }),
}))

const App: React.FC = () => {
  const hasLoaded = useRef(false)
  const {
    tasks,
    columns,
    columnOrder,
    newTaskTitle,
    newTaskDescription,
    setData,
    fetchState,
    saveState,
    addTask,
    onDragEnd,
  } = useStore()

  // Fetch state from the backend on initial render and poll every 5 seconds
  useEffect(() => {
    fetchState().then(() => { hasLoaded.current = true })
    const interval = setInterval(fetchState, 5000)
    return () => clearInterval(interval)
  }, [fetchState])

  // Save state to the backend when tasks/columns change — but never before initial fetch
  useEffect(() => {
    if (!hasLoaded.current) return
    const state = useStore.getState()
    saveState({ tasks: state.tasks, columns: state.columns, columnOrder: state.columnOrder })
  }, [tasks, columns, columnOrder, saveState])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px' }}>
        <h1 style={{ margin: 0 }}>Kanban Board</h1>
        <span style={{ fontSize: '14px', color: '#666' }}>v0.4</span>
      </div>
      <div style={{ display: 'flex', padding: '10px', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <h3>Add New Task</h3>
          <input
            type="text"
            placeholder="Task title"
            value={newTaskTitle}
            onChange={(e) => setData({ newTaskTitle: e.target.value })}
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
          <textarea
            placeholder="Task description"
            value={newTaskDescription}
            onChange={(e) => setData({ newTaskDescription: e.target.value })}
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
          <button onClick={addTask} style={{ padding: '8px 16px' }}>
            Add Task
          </button>
        </div>
        <DragDropContext onDragEnd={onDragEnd}>
          {columnOrder.map((columnId) => {
            const column = columns[columnId]
            const columnTasks = column.taskIds.map((taskId) => tasks[taskId]).filter(Boolean)

            return (
              <Droppable key={column.id} droppableId={column.id}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={{
                      border: '1px solid #ccc',
                      borderRadius: '5px',
                      padding: '10px',
                      width: '300px',
                      backgroundColor: '#f0f0f0',
                    }}
                  >
                    <h3>{column.title}</h3>
                    {columnTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              backgroundColor: 'white',
                              padding: '10px',
                              marginBottom: '10px',
                              borderRadius: '5px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              ...provided.draggableProps.style,
                            }}
                          >
                            <h4>{task.title}</h4>
                            <p>{task.description}</p>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )
          })}
        </DragDropContext>
      </div>
    </div>
  )
}

export default App
