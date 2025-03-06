'use client';

import { useState } from 'react';
import SentenceAnalyzer from '@/components/SentenceAnalyzer';
import AnalysisResult from '@/components/AnalysisResult';

export default function Home() {
  const [sentence, setSentence] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeSentence = async () => {
    if (!sentence.trim()) {
      setError('문장을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sentence }),
      });

      if (!response.ok) {
        throw new Error('분석 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold mb-2">영어 문장 성분 분석기</h1>
        <p className="text-gray-600">
          영어 문장을 입력하면 GPT API를 활용하여 문장 성분을 분석해 드립니다.
        </p>
      </header>

      <SentenceAnalyzer
        sentence={sentence}
        setSentence={setSentence}
        onAnalyze={analyzeSentence}
        isLoading={isLoading}
      />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {analysis && <AnalysisResult analysis={analysis} />}
    </div>
  );
} 