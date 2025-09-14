import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BrutalInput } from '../components/Common/BrutalInput';
import { BrutalButton } from '../components/Common/BrutalButton';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('ALL FIELDS ARE REQUIRED');
      setLoading(false);
      return;
    }

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'INVALID CREDENTIALS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] py-8">
      <div className="max-w-md mx-auto px-4">
        <BrutalButton
          onClick={() => navigate('/')}
          variant="secondary"
          icon={ArrowLeft}
          className="mb-8"
        >
          BACK HOME
        </BrutalButton>

        <div className="bg-white border-6 border-black shadow-[12px_12px_0px_#000000] p-8">
          <h1 className="font-black text-3xl uppercase text-center mb-8 text-black">
            PESTAPORA <span className="text-[#00FF00]">LOGIN</span>
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <BrutalInput
              label="EMAIL ADDRESS"
              type="email"
              placeholder="YOUR@PESTAPORA.EMAIL"
              value={email}
              onChange={setEmail}
              icon={Mail}
              error={error && !email ? 'EMAIL IS REQUIRED' : ''}
            />

            <BrutalInput
              label="PASSWORD"
              type="password"
              placeholder="PASSWORD"
              value={password}
              onChange={setPassword}
              icon={Lock}
              error={error && !password ? 'PASSWORD IS REQUIRED' : ''}
            />

            {error && (
              <div className="bg-[#FF0000] text-white p-4 border-4 border-black shadow-[4px_4px_0px_#000000]">
                <p className="font-black text-sm uppercase text-center">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-[#00FF00] text-black p-4 border-4 border-black shadow-[4px_4px_0px_#000000]">
                <p className="font-black text-sm uppercase text-center">CHECK YOUR EMAIL TO CONFIRM!</p>
              </div>
            )}

            <BrutalButton type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'LOGGING IN...' : 'LOGIN TO PESTAPORA'}
            </BrutalButton>
          </form>

          <div className="mt-8 text-center">
            <p className="font-bold text-sm uppercase text-black mb-4">
              NOT A USER YET?
            </p>
            <Link to="/register">
              <BrutalButton variant="secondary" className="w-full">
                REGISTER FOR PESTAPORA
              </BrutalButton>
            </Link>
          </div>

          <div className="mt-8 bg-[#00FFFF] text-black p-4 border-4 border-black shadow-[4px_4px_0px_#000000]">
            <p className="font-bold text-xs uppercase text-center mb-2">CREATE ACCOUNT TO GET STARTED</p>
            <p className="font-black text-xs uppercase text-center">Real authentication with Supabase</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password || !confirmPassword || !name) {
      setError('ALL FIELDS ARE BRUTAL REQUIRED');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('PASSWORDS DO NOT MATCH - BE MORE BRUTAL');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('PASSWORD TOO WEAK - NEEDS 6+ BRUTAL CHARACTERS');
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password, name);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'REGISTRATION FAILED - TRY AGAIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] py-8">
      <div className="max-w-md mx-auto px-4">
        <BrutalButton
          onClick={() => navigate('/')}
          variant="secondary"
          icon={ArrowLeft}
          className="mb-8"
        >
          BACK HOME
        </BrutalButton>

        <div className="bg-white border-6 border-black shadow-[12px_12px_0px_#000000] p-8">
          <h1 className="font-black text-3xl uppercase text-center mb-8 text-black">
            BRUTAL <span className="text-[#FF0080]">REGISTER</span>
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <BrutalInput
              label="FULL NAME"
              type="text"
              placeholder="YOUR BRUTAL NAME"
              value={name}
              onChange={setName}
              icon={User}
            />

            <BrutalInput
              label="EMAIL ADDRESS"
              type="email"
              placeholder="YOUR@BRUTAL.EMAIL"
              value={email}
              onChange={setEmail}
              icon={Mail}
            />

            <BrutalInput
              label="PASSWORD"
              type="password"
              placeholder="BRUTAL PASSWORD (6+ CHARS)"
              value={password}
              onChange={setPassword}
              icon={Lock}
            />

            <BrutalInput
              label="CONFIRM PASSWORD"
              type="password"
              placeholder="CONFIRM BRUTAL PASSWORD"
              value={confirmPassword}
              onChange={setConfirmPassword}
              icon={Lock}
            />

            {error && (
              <div className="bg-[#FF0000] text-white p-4 border-4 border-black shadow-[4px_4px_0px_#000000]">
                <p className="font-black text-sm uppercase text-center">{error}</p>
              </div>
            )}

            <BrutalButton type="submit" className="w-full" size="lg" disabled={loading || success}>
              {loading ? 'JOINING...' : success ? 'CHECK YOUR EMAIL!' : 'JOIN THE BRUTALITY'}
            </BrutalButton>
          </form>

          <div className="mt-8 text-center">
            <p className="font-bold text-sm uppercase text-black mb-4">
              ALREADY BRUTAL?
            </p>
            <Link to="/login">
              <BrutalButton variant="secondary" className="w-full">
                LOGIN TO BRUTALITY
              </BrutalButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};