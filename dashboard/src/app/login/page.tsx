'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email, password: password }),
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      login(email, data.access_token);
    } catch (err) {
      setError('Failed to login. Please check credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg text-text-primary">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-card-bg p-8 rounded-2xl border border-border-color shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent-blue">RoadSoS X</h1>
          <p className="text-text-secondary mt-2">Intelligent Mobility Dashboard</p>
        </div>
        
        {error && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-6 border border-red-500/30 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-app-bg border border-border-color rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-app-bg border border-border-color rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-blue"
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-accent-blue hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-colors mt-4"
          >
            Sign In to Dashboard
          </button>
        </form>
      </motion.div>
    </div>
  );
}
