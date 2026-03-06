import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Check, Plus, Trash2, Clock, AlertCircle } from 'lucide-react';

export default function DailyChecklist() {
  const { farmId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [category, setCategory] = useState("morning");

  function getDefaultTasks() {
    return [
      // Morning tasks
      { id: 1, text: "Milk cattle (morning session)", category: "morning", completed: false },
      { id: 2, text: "Check cattle health & temperature", category: "morning", completed: false },
      { id: 3, text: "Prepare feed for cattle", category: "morning", completed: false },
      { id: 4, text: "Clean barn/sheds", category: "morning", completed: false },

      // Afternoon tasks
      { id: 5, text: "Monitor water supply", category: "afternoon", completed: false },
      { id: 6, text: "Check cattle for injuries", category: "afternoon", completed: false },
      { id: 7, text: "Record production data", category: "afternoon", completed: false },

      // Evening tasks
      { id: 8, text: "Milk cattle (evening session)", category: "evening", completed: false },
      { id: 9, text: "Evening health check", category: "evening", completed: false },
      { id: 10, text: "Secure facility for night", category: "evening", completed: false },

      // Other
      { id: 11, text: "Equipment maintenance", category: "other", completed: false },
      { id: 12, text: "Order supplies", category: "other", completed: false }
    ];
  }

  const categories = {
    morning: { label: "Morning Tasks", color: "bg-orange-500/10", icon: "🌅" },
    afternoon: { label: "Afternoon Tasks", color: "bg-yellow-500/10", icon: "☀️" },
    evening: { label: "Evening Tasks", color: "bg-blue-500/10", icon: "🌙" },
    other: { label: "Other Tasks", color: "bg-purple-500/10", icon: "📋" }
  };

  // Load tasks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`farm-tasks-${farmId}`);
    try {
      if (saved) {
        setTasks(JSON.parse(saved));
      } else {
        setTasks(getDefaultTasks());
      }
    } catch {
      setTasks(getDefaultTasks());
    }
  }, [farmId]);

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem(`farm-tasks-${farmId}`, JSON.stringify(tasks));
  }, [tasks, farmId]);

  function addTask() {
    if (!newTask.trim()) return;

    const task = {
      id: Math.max(...tasks.map(t => t.id), 0) + 1,
      text: newTask,
      category: category,
      completed: false
    };

    setTasks([...tasks, task]);
    setNewTask("");
  }

  function toggleTask(id) {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }

  function deleteTask(id) {
    setTasks(tasks.filter(t => t.id !== id));
  }

  function resetTasks() {
    if (window.confirm("Reset all tasks for today?")) {
      setTasks(tasks.map(t => ({ ...t, completed: false })));
    }
  }

  const completedCount = tasks.filter(t => t.completed).length;
  const completionPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Clock className="w-8 h-8" />
              Daily Checklist
            </h1>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{completionPercentage}%</p>
              <p className="text-sm text-muted-foreground">{completedCount} of {tasks.length} complete</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-primary to-success"
            />
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatItem title="Completed" value={completedCount} icon="✓" />
          <StatItem title="Remaining" value={tasks.length - completedCount} icon="○" />
          <StatItem title="Total Tasks" value={tasks.length} icon="📋" />
        </motion.div>

        {/* Add New Task */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-3">Add Task</h3>
          <div className="flex gap-2 flex-col md:flex-row">
            <input
              type="text"
              placeholder="Enter new task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            >
              {Object.entries(categories).map(([key, val]) => (
                <option key={key} value={key}>{val.icon} {val.label}</option>
              ))}
            </select>
            <button onClick={addTask} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </motion.div>

        {/* Tasks by Category */}
        {Object.entries(categories).map(([catKey, catData]) => {
          const catTasks = tasks.filter(t => t.category === catKey);
          if (catTasks.length === 0) return null;

          const catCompleted = catTasks.filter(t => t.completed).length;

          return (
            <motion.div key={catKey} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${catData.color} border border-border rounded-lg p-5`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <span className="text-2xl">{catData.icon}</span>
                  {catData.label}
                </h3>
                <span className="text-sm text-muted-foreground font-medium">
                  {catCompleted}/{catTasks.length} complete
                </span>
              </div>

              <div className="space-y-2">
                {catTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => toggleTask(task.id)}
                    className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:border-primary cursor-pointer transition-all hover:shadow-md group"
                  >
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed
                        ? 'bg-success border-success'
                        : 'border-muted-foreground group-hover:border-primary'
                      }`}>
                      {task.completed && <Check className="w-4 h-4 text-background" />}
                    </div>
                    <span className={`flex-1 font-medium transition-all ${task.completed
                        ? 'line-through text-muted-foreground'
                        : 'text-foreground'
                      }`}>
                      {task.text}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                      }}
                      className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 rounded text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* Reset Button */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 justify-center">
          <button
            onClick={resetTasks}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors font-medium"
          >
            <AlertCircle className="w-4 h-4" />
            Reset Today's Tasks
          </button>
        </motion.div>
      </div>
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function StatItem({ title, value, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-4 text-center"
    >
      <p className="text-3xl font-bold text-primary mb-2">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </motion.div>
  );
}
