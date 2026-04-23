import React, { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

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

const initialData = {
  tasks: {
    'task-1': { id: 'task-1', title: 'First task', description: 'Description for the first task' },
    'task-2': { id: 'task-2', title: 'Second task', description: 'Description for the second task' },
  },
  columns: {
    'column-1': { id: 'column-1', title: 'Backlog', taskIds: ['task-1', 'task-2'] },
    'column-2': { id: 'column-2', title: 'In Progress', taskIds: [] },
    'column-3': { id: 'column-3', title: 'Finished', taskIds: [] },
  },
  columnOrder: ['column-1', 'column-2', 'column-3'],
}

const App: React.FC = () => {
  const [data, setData] = useState(initialData)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const startColumn = data.columns[source.droppableId]
    const finishColumn = data.columns[destination.droppableId]

    if (startColumn === finishColumn) {
      const newTaskIds = Array.from(startColumn.taskIds)
      newTaskIds.splice(source.index, 1)
      newTaskIds.splice(destination.index, 0, draggableId)

      const newColumn = {
        ...startColumn,
        taskIds: newTaskIds,
      }

      const newData = {
        ...data,
        columns: {
          ...data.columns,
          [newColumn.id]: newColumn,
        },
      }

      setData(newData)
      return
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

    const newData = {
      ...data,
      columns: {
        ...data.columns,
        [newStartColumn.id]: newStartColumn,
        [newFinishColumn.id]: newFinishColumn,
      },
    }

    setData(newData)
  }

  const addTask = () => {
    if (!newTaskTitle.trim()) return

    const taskId = `task-${Object.keys(data.tasks).length + 1}`
    const newTask = {
      id: taskId,
      title: newTaskTitle,
      description: newTaskDescription,
    }

    const newData = {
      ...data,
      tasks: {
        ...data.tasks,
        [taskId]: newTask,
      },
      columns: {
        ...data.columns,
        'column-1': {
          ...data.columns['column-1'],
          taskIds: [...data.columns['column-1'].taskIds, taskId],
        },
      },
    }

    setData(newData)
    setNewTaskTitle('')
    setNewTaskDescription('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <h1 style={{ textAlign: 'center' }}>Kanban Board</h1>
      <div style={{ display: 'flex', padding: '10px', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <h3>Add New Task</h3>
          <input
            type="text"
            placeholder="Task title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
          <textarea
            placeholder="Task description"
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
          <button onClick={addTask} style={{ padding: '8px 16px' }}>
            Add Task
          </button>
        </div>
        <DragDropContext onDragEnd={onDragEnd}>
          {data.columnOrder.map((columnId) => {
            const column = data.columns[columnId]
            const tasks = column.taskIds.map((taskId) => data.tasks[taskId])

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
                    {tasks.map((task, index) => (
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
