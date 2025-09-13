import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { BrutalInput } from '../components/Common/BrutalInput';
import { BrutalButton } from '../components/Common/BrutalButton';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('ALL FIELDS ARE REQUIRED');
      return;
    }

    const success = await login(email, password);
    if (success) {
      navigate('/');
    } else {
      setError('INVALID CREDENTIALS');
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

            <BrutalButton type="submit" className="w-full" size="lg">
              LOGIN TO PESTAPORA
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
            <p className="font-bold text-xs uppercase text-center mb-2">DEMO CREDENTIALS:</p>
            <p className="font-black text-xs uppercase text-center">admin@pestapora.com / pestapora123</p>
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
  const { register } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword || !name) {
      setError('ALL FIELDS ARE BRUTAL REQUIRED');
      return;
    }

    if (password !== confirmPassword) {
      setError('PASSWORDS DO NOT MATCH - BE MORE BRUTAL');
      return;
    }

    if (password.length < 6) {
      setError('PASSWORD TOO WEAK - NEEDS 6+ BRUTAL CHARACTERS');
      return;
    }

    const success = await register(email, password, name);
    if (success) {
      navigate('/');
    } else {
      setError('REGISTRATION FAILED - TRY AGAIN');
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

            <BrutalButton type="submit" className="w-full" size="lg">
              JOIN THE BRUTALITY
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