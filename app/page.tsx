'use client';

import React, { useState } from 'react';
import SentenceAnalyzer from '@/components/SentenceAnalyzer';
import AnalysisResult from '@/components/AnalysisResult';

interface AnalysisData {
  sentence: string;
  components: Array<{
    text: string;
    type: string;
    index: number;
    role?: string;
  }>;
  rawResponse?: string;
}

export default function Home() {
  const [sentence, setSentence] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisData | null>(null);

  const handleAnalyze = async () => {
    if (!sentence.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sentence }),
      });

      if (!response.ok) {
        throw new Error('분석 요청에 실패했습니다.');
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (error) {
      console.error('Error:', error);
      alert('문장 분석 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">영어 문장 분석기</h1>
        <p className="text-gray-600">
          영어 문장의 문법 성분을 분석하고 시각화합니다.
        </p>
      </div>

      <SentenceAnalyzer
        sentence={sentence}
        setSentence={setSentence}
        onAnalyze={handleAnalyze}
        isLoading={isLoading}
      />

      {analysisResult && <AnalysisResult analysis={analysisResult} />}
    </div>
  );
} 