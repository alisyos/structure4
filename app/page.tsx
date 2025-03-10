'use client';

import React, { useState } from 'react';
import SentenceAnalyzer from '../components/SentenceAnalyzer';
import AnalysisResult from '../components/AnalysisResult';

interface ComponentData {
  text: string;
  type: string;
  startIndex: number;
  endIndex: number;
  role?: string;
}

interface AnalysisResponse {
  components: ComponentData[];
  sentence: string;
  rawResponse?: string;
}

export default function Home() {
  const [sentence, setSentence] = useState<string>('');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

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
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">영어 문장 구조 분석기</h1>
        <p className="text-gray-600">영어 문장의 구조를 시각적으로 분석하여 보여주는 도구입니다.</p>
      </div>

      <SentenceAnalyzer
        sentence={sentence}
        setSentence={setSentence}
        onAnalyze={handleAnalyze}
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