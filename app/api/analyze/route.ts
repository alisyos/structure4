import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_USER_PROMPT } from '../prompt/data';

// API 키 설정 (환경 변수만 사용)
const apiKey = process.env.OPENAI_API_KEY;

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: apiKey,
});

// 커스텀 프롬프트 파일 경로
const PROMPT_FILE_PATH = path.join(process.cwd(), 'app/api/prompt/custom_prompts.json');

// 프롬프트 불러오기
async function getPrompts() {
  try {
    // 파일이 존재하는지 확인
    try {
      await fs.access(PROMPT_FILE_PATH);
    } catch (error) {
      // 파일이 없으면 기본값 반환
      return {
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        userPrompt: DEFAULT_USER_PROMPT
      };
    }

    // 파일 읽기
    const fileContent = await fs.readFile(PROMPT_FILE_PATH, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('프롬프트 불러오기 오류:', error);
    // 오류 발생 시 기본값 반환
    return {
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      userPrompt: DEFAULT_USER_PROMPT
    };
  }
}

export async function POST(request: Request) {
  try {
    // API 키가 설정되어 있지 않은 경우 오류 반환
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되어 있지 않습니다. 환경 변수를 확인해주세요.' },
        { status: 500 }
      );
    }

    const { sentence } = await request.json();

    if (!sentence || typeof sentence !== 'string') {
      return NextResponse.json(
        { error: '유효한 문장을 입력해주세요.' },
        { status: 400 }
      );
    }
    
    // 프롬프트 불러오기
    const { systemPrompt, userPrompt } = await getPrompts();
    
    // 문장을 프롬프트에 삽입
    const formattedPrompt = userPrompt.replace('{sentence}', sentence);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: formattedPrompt,
          },
        ],
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content || '';
      
      // JSON 문자열 추출 (GPT가 때때로 마크다운 코드 블록으로 감싸서 반환할 수 있음)
      const jsonMatch = content.match(/```json\n([\s\S]*)\n```/) || 
                        content.match(/```\n([\s\S]*)\n```/) || 
                        content.match(/{[\s\S]*}/);
      
      let analysisResult;
      
      if (jsonMatch) {
        try {
          const jsonContent = jsonMatch[1] || jsonMatch[0];
          // 유효한 JSON인지 확인
          const parsedJson = JSON.parse(jsonContent);
          
          // components 배열이 있는지 확인하고 각 항목이 필요한 속성을 가지고 있는지 검증
          if (parsedJson && parsedJson.components && Array.isArray(parsedJson.components)) {
            // 각 컴포넌트가 유효한지 확인
            parsedJson.components = parsedJson.components.filter((comp: any) => 
              comp && typeof comp === 'object' && comp.type && comp.text
            );
            
            analysisResult = {
              sentence,
              components: parsedJson.components
            };
          } else {
            // 유효한 components 배열이 없는 경우
            analysisResult = { 
              sentence, 
              rawResponse: content,
              components: [] 
            };
          }
        } catch (e) {
          console.error('JSON 파싱 오류:', e);
          // JSON 파싱 실패 시 원본 텍스트 반환
          analysisResult = { 
            sentence, 
            rawResponse: content,
            components: [] 
          };
        }
      } else {
        // JSON 형식이 아닌 경우 원본 텍스트 반환
        analysisResult = { 
          sentence, 
          rawResponse: content,
          components: [] 
        };
      }

      return NextResponse.json(analysisResult);
    } catch (error: any) {
      console.error('OpenAI API 오류:', error);
      return NextResponse.json(
        { error: 'OpenAI API 호출 중 오류가 발생했습니다.', details: error?.message || '알 수 없는 오류' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error analyzing sentence:', error);
    return NextResponse.json(
      { error: '문장 분석 중 오류가 발생했습니다.', details: error?.message || '알 수 없는 오류' },
      { status: 500 }
    );
  }
} 