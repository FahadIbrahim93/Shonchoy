import React, { useState } from 'react';
import { Mic, Send, MessageSquare } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ForecastPoint, InventoryItem, Locale } from '../types';
import { formatBDT, TRANSLATIONS } from '../i18n';
import { api } from '../services/api';

interface AnalyticsViewProps {
  locale: Locale;
  forecast: ForecastPoint[];
  items: InventoryItem[];
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  locale,
  forecast,
  items,
}) => {
  const t = TRANSLATIONS[locale];
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  const stockChartData = [...items]
    .map((it) => ({
      name: it.name.length > 18 ? `${it.name.slice(0, 18)}…` : it.name,
      value: Math.round(it.quantity * it.price),
      quantity: it.quantity,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const quickQuestions =
    locale === 'bn'
      ? [
          'কোন পণ্যগুলো দ্রুত পুনরায় স্টক করা উচিত?',
          'বকেয়া ইনভয়েসগুলোর সারসংক্ষেপ দিন',
          'আগামী সপ্তাহের বিক্রয় পরামর্শ দিন',
        ]
      : [
          'Which items need restocking urgently?',
          'Summarize unpaid customer invoices',
          'How can I optimize bKash and Nagad collections?',
        ];

  const handleAsk = async (promptText?: string) => {
    const q = (promptText ?? question).trim();
    if (!q) return;
    setQuestion(q);
    setLoading(true);
    setError('');
    setAnswer('');
    try {
      const res = await api.askAssistant(q, locale);
      setAnswer(res.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach AI advisor.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setError('Voice recognition is not supported in this browser. Type your question below.');
      return;
    }
    const recognition = new SpeechRec();
    recognition.lang = locale === 'bn' ? 'bn-BD' : 'en-US';
    recognition.interimResults = false;
    setListening(true);
    setError('');

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || '';
      if (transcript) {
        setQuestion(transcript);
      }
      setListening(false);
    };
    recognition.onerror = () => {
      setListening(false);
      setError('Could not capture voice input. Please try typing.');
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognition.start();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">
            {t.revenueForecast}
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            {t.actualSales} · {t.projectedForecast}
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `৳${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(value: number | string | undefined) =>
                    typeof value === 'number' ? formatBDT(value) : ''
                  }
                />
                <Area
                  type="monotone"
                  dataKey="actualRevenue"
                  name={t.actualSales}
                  stroke="#059669"
                  fill="#059669"
                  fillOpacity={0.14}
                  strokeWidth={2}
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="forecastRevenue"
                  name={t.projectedForecast}
                  stroke="#0284c7"
                  strokeDasharray="5 4"
                  fill="#0284c7"
                  fillOpacity={0.08}
                  strokeWidth={2}
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">
            {t.topStockValue}
          </h2>
          <p className="text-xs text-slate-500 mb-5">BDT valuation across top SKUs</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stockChartData}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `৳${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(value: number | string | undefined) =>
                    typeof value === 'number' ? formatBDT(value) : ''
                  }
                />
                <Bar dataKey="value" fill="#0f172a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Server-Side Gemini AI Advisor */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {t.aiAssistantTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-1">{t.aiAssistantDesc}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleAsk(q)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex flex-wrap gap-2"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t.aiPlaceholder}
            className="flex-1 min-w-[240px] px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
          />
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border rounded-lg transition-colors whitespace-nowrap ${
              listening
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Mic size={14} /> {listening ? t.listening : t.voiceInput}
          </button>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap"
          >
            <Send size={14} /> {t.askAi}
          </button>
        </form>

        {error && (
          <div className="p-3.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {loading && (
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 animate-pulse">
            <div className="h-3 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
          </div>
        )}

        {!loading && answer && (
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
            {answer}
          </div>
        )}

        {!loading && !answer && !error && (
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3 text-xs text-slate-500">
            <MessageSquare size={16} className="text-slate-400 shrink-0" />
            <span>
              Ask a question above to analyze your live Shonchoy invoices, stock levels, and payment collections.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
