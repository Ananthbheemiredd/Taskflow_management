import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Task } from '../types';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Navbar } from '../components/Navbar';
import { Plus, Trash2, Edit, ArrowLeft, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { TaskModal } from '../components/TaskModal';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    loadProject();
  }, [id, filterStatus]);

  const loadProject = async () => {
    if (!id) return;
    try {
      const response = await api.getProject(id);
      setProject(response);
      let filteredTasks = response.tasks || [];
      if (filterStatus) {
        filteredTasks = filteredTasks.filter((t: Task) => t.status === filterStatus);
      }
      setTasks(filteredTasks);
    } catch (err: any) {
      setError(err.data?.error || 'Failed to load project');
      if (err.data?.error === 'not found') {
        navigate('/projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await api.deleteTask(taskId);
      loadProject();
    } catch (err: any) {
      setError(err.data?.error || 'Failed to delete task');
    }
  };

  const handleStatusChange = async (task: Task, newStatus: Task['status']) => {
    const originalStatus = task.status;
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    
    try {
      await api.updateTask(task.id, { status: newStatus });
    } catch (err: any) {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: originalStatus } : t));
      setError(err.data?.error || 'Failed to update task');
    }
  };

  const getStatusBadge = (status: Task['status']) => {
    const variants: Record<Task['status'], 'success' | 'warning' | 'default'> = {
      done: 'success',
      in_progress: 'warning',
      todo: 'default',
    };
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    const variants: Record<Task['priority'], 'danger' | 'warning' | 'default'> = {
      high: 'danger',
      medium: 'warning',
      low: 'default',
    };
    return <Badge variant={variants[priority]}>{priority}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="secondary" size="sm" onClick={() => navigate('/projects')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project?.name}</h1>
              {project?.description && (
                <p className="mt-2 text-gray-600">{project.description}</p>
              )}
            </div>
            <Button onClick={() => setIsTaskModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        {tasks.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600">No tasks yet. Create your first task to get started.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{task.title}</h3>
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                      {task.description && (
                        <p className="mt-2 text-sm text-gray-600">{task.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                        {task.due_date && (
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4" />
                            {format(new Date(task.due_date), 'MMM d, yyyy')}
                          </div>
                        )}
                        <div className="flex items-center">
                          <User className="mr-1 h-4 w-4" />
                          {task.assignee_id ? 'Assigned' : 'Unassigned'}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex gap-2">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value as Task['status'])}
                        className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingTask(task);
                          setIsTaskModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        projectId={id!}
        task={editingTask}
        onSave={() => {
          loadProject();
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
      />
    </div>
  );
}
