import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'

export default function Login({ setToken }) {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('password123')
  const navigate = useNavigate()

  const API_URL = import.meta.env.VITE_API_URL  // ✅ Uses Render backend automatically

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`${API_URL}/api/login`, { email, password })

      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      setToken(res.data.token)
      navigate('/')
    } catch (err) {
      alert('Login failed – try Google or register')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-10 rounded-xl shadow-2xl w-96">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">MoneyFlow</h1>

        {/* Email/Password Login */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 rounded bg-gray-700 text-white"
            required
          />

          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 rounded bg-gray-700 text-white"
            required
          />

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded text-xl"
          >
            Login
          </button>
        </form>

        {/* Google Login */}
        <div className="mt-6">
          <a
            href={`${API_URL}/auth/google`}  // ✅ FIXED: No more localhost
            className="w-full bg-white text-gray-800 font-bold py-3 rounded flex items-center justify-center gap-3 hover:bg-gray-100 transition shadow-lg"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
            Continue with Google
          </a>
        </div>

        <p className="text-center mt-6 text-gray-400">
          Test account: <br />
          <strong>test@example.com</strong> / <strong>password123</strong>
        </p>

        <p className="text-center mt-4 text-gray-400">
          No account? <Link to="/register" className="text-green-400 hover:underline font-bold">Register</Link>
        </p>
      </div>
    </div>
  )
}
