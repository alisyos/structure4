'use client';

import React, { useState, useEffect } from 'react';

interface PromptsEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

const PromptsEditor: React.FC<PromptsEditorProps> = ({ isOpen, onClose }) => {
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [saveError, setSaveError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadPrompts();
    }
  }, [isOpen]);

  const loadPrompts = async () => {
    setIsLoading(true);
    setSaveMessage('');
    setSaveError('');

    try {
      const response = await fetch('/api/prompt');
      
      if (!response.ok) {
        throw new Error('프롬프트를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setSystemPrompt(data.systemPrompt || '');
      setUserPrompt(data.userPrompt || '');
    } catch (error) {
      console.error('프롬프트 불러오기 오류:', error);
      setSaveError('프롬프트를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const savePrompts = async () => {
    setIsSaving(true);
    setSaveMessage('');
    setSaveError('');

    try {
      const response = await fetch('/api/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error('프롬프트를 저장하는데 실패했습니다.');
      }

      setSaveMessage('프롬프트가 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('프롬프트 저장 오류:', error);
      setSaveError('프롬프트를 저장하는데 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">시스템 프롬프트 수정</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                  시스템 프롬프트
                </label>
                <textarea
                  id="systemPrompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full h-32 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="시스템 프롬프트를 입력하세요..."
                />
              </div>

              <div>
                <label htmlFor="userPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                  사용자 프롬프트
                </label>
                <textarea
                  id="userPrompt"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  className="w-full h-96 p-2 border border-gray-300 rounded-md shadow-sm font-mono text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="사용자 프롬프트를 입력하세요..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  참고: 문장을 삽입할 위치에 {"{sentence}"} 표시를 사용하세요.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          {saveMessage && <p className="text-green-600 mb-2">{saveMessage}</p>}
          {saveError && <p className="text-red-600 mb-2">{saveError}</p>}
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              disabled={isSaving}
            >
              취소
            </button>
            <button
              onClick={savePrompts}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={isSaving || isLoading}
            >
              {isSaving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptsEditor; 